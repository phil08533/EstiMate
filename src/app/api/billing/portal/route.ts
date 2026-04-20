import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  // Optional: caller can specify which plan to check out for
  let targetPlan: string | null = null
  try {
    const body = await req.json()
    targetPlan = body?.plan ?? null
  } catch { /* no body is fine */ }

  const service = await createServiceClient()
  const { data: member } = await service
    .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
  if (!member) return NextResponse.json({ error: 'No team found' }, { status: 400 })

  const { data: sub } = await service
    .from('subscriptions').select('stripe_customer_id').eq('team_id', member.team_id).single()

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://esti-mate.vercel.app'}/settings/billing`

  if (sub?.stripe_customer_id) {
    // Existing Stripe customer — open billing portal (they can switch plans there)
    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ customer: sub.stripe_customer_id, return_url: returnUrl }),
    })
    const session = await res.json()
    return NextResponse.json({ url: session.url })
  } else {
    // No Stripe customer yet — create checkout for the requested plan
    const priceId =
      targetPlan === 'business'
        ? (process.env.STRIPE_BUSINESS_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID)
        : process.env.STRIPE_PRO_PRICE_ID
    if (!priceId) return NextResponse.json({ url: returnUrl })

    const { data: profile } = await service
      .from('profiles').select('email').eq('id', user.id).single()

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        success_url: `${returnUrl}?success=1`,
        cancel_url: returnUrl,
        ...(profile?.email ? { customer_email: profile.email } : {}),
        'metadata[team_id]': member.team_id,
      }),
    })
    const session = await res.json()
    return NextResponse.json({ url: session.url })
  }
}
