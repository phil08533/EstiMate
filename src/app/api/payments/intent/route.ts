import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = await createServiceClient()

  const { token } = await request.json()

  const { data: link, error } = await supabase
    .from('payment_links')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !link) {
    return NextResponse.json({ error: 'Invalid or expired payment link' }, { status: 404 })
  }
  if (link.status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const amountCents = Math.round(link.deposit_amount * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    automatic_payment_methods: { enabled: true },
    metadata: {
      token,
      link_id: link.id,
      estimate_id: link.estimate_id,
    },
    description: `${link.deposit_pct}% deposit — ${link.customer_name ?? 'Customer'}`,
    receipt_email: link.customer_email ?? undefined,
  })

  await supabase
    .from('payment_links')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', link.id)

  return NextResponse.json({ client_secret: paymentIntent.client_secret })
}
