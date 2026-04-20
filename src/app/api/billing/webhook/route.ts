import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionPlan, SubscriptionStatus } from '@/lib/types'

// Stripe sends raw body — we must NOT parse it as JSON before verifying.
export const dynamic = 'force-dynamic'

// Minimal Stripe webhook signature verification (HMAC-SHA256, no SDK required)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const sig = parts['v1']
  if (!timestamp || !sig) return false

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const expected = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')

  // Constant-time comparison
  if (expected.length !== sig.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i)
  return diff === 0
}

function planFromPriceId(priceId: string): SubscriptionPlan {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return 'business'
  return 'free'
}

function mapStripeStatus(stripeStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  }
  return map[stripeStatus] ?? 'active'
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  const valid = await verifyStripeSignature(body, sig, webhookSecret)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const service = await createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const teamId = (session.metadata as Record<string, string>)?.team_id
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string
      if (!teamId || !customerId) break

      await service.from('subscriptions').update({
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('team_id', teamId)
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object
      const customerId = sub.customer as string
      const { data: existing } = await service
        .from('subscriptions')
        .select('team_id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!existing) break

      const items = (sub.items as { data: { price: { id: string } }[] })?.data
      const priceId = items?.[0]?.price?.id ?? ''
      const plan = planFromPriceId(priceId)
      const status = mapStripeStatus(sub.status as string)
      const periodStart = sub.current_period_start
        ? new Date((sub.current_period_start as number) * 1000).toISOString()
        : null
      const periodEnd = sub.current_period_end
        ? new Date((sub.current_period_end as number) * 1000).toISOString()
        : null
      const canceledAt = sub.canceled_at
        ? new Date((sub.canceled_at as number) * 1000).toISOString()
        : null
      const trialEnd = sub.trial_end
        ? new Date((sub.trial_end as number) * 1000).toISOString()
        : null

      await service.from('subscriptions').update({
        plan,
        status,
        stripe_subscription_id: sub.id as string,
        current_period_start: periodStart,
        current_period_end: periodEnd,
        canceled_at: canceledAt,
        trial_ends_at: trialEnd,
        updated_at: new Date().toISOString(),
      }).eq('team_id', existing.team_id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const customerId = sub.customer as string
      const { data: existing } = await service
        .from('subscriptions')
        .select('team_id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!existing) break

      await service.from('subscriptions').update({
        plan: 'free',
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('team_id', existing.team_id)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const customerId = invoice.customer as string
      const { data: existing } = await service
        .from('subscriptions')
        .select('team_id')
        .eq('stripe_customer_id', customerId)
        .single()
      if (!existing) break

      await service.from('subscriptions').update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      }).eq('team_id', existing.team_id)
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      const customerId = invoice.customer as string
      const { data: existing } = await service
        .from('subscriptions')
        .select('team_id, status')
        .eq('stripe_customer_id', customerId)
        .single()
      // Only flip past_due → active on payment success (don't touch trialing/canceled)
      if (!existing || existing.status !== 'past_due') break

      await service.from('subscriptions').update({
        status: 'active',
        updated_at: new Date().toISOString(),
      }).eq('team_id', existing.team_id)
      break
    }

    default:
      // Unhandled event — return 200 so Stripe doesn't retry
      break
  }

  return NextResponse.json({ received: true })
}
