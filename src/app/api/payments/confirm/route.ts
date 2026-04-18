import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = await createServiceClient()

  const { token, payment_intent_id } = await request.json()

  // Verify with Stripe that payment actually succeeded
  const intent = await stripe.paymentIntents.retrieve(payment_intent_id)
  if (intent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  }

  const { data: link } = await supabase
    .from('payment_links')
    .select('*')
    .eq('token', token)
    .single()

  if (!link) return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  if (link.status === 'paid') return NextResponse.json({ success: true })

  // Record the payment in the payments table
  await supabase.from('payments').insert({
    estimate_id: link.estimate_id,
    team_id: link.team_id,
    created_by: link.created_by,
    amount: link.deposit_amount,
    payment_method: 'card',
    payment_date: new Date().toISOString().split('T')[0],
    notes: `Online deposit (${link.deposit_pct}%) via payment link — Stripe ${payment_intent_id}`,
  })

  // Mark the link as paid
  await supabase
    .from('payment_links')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', link.id)

  // Auto-advance estimate to 'sold' if it was 'sent'
  await supabase
    .from('estimates')
    .update({ status: 'sold' })
    .eq('id', link.estimate_id)
    .in('status', ['sent', 'need_to_estimate'])

  return NextResponse.json({ success: true })
}
