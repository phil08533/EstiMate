import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { estimateId, token } = await req.json()
  if (!estimateId || !token) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const service = await createServiceClient()
  const { data: estimate } = await service
    .from('estimates')
    .select('customer_name, customer_email, team_id, estimate_line_items(*), company_settings:team_id(company_name,phone,email,tax_rate,payment_terms)')
    .eq('id', estimateId)
    .single()

  if (!estimate?.customer_email) {
    return NextResponse.json({ error: 'No customer email on record' }, { status: 400 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: 'Email not configured (RESEND_API_KEY missing)' }, { status: 503 })
  }

  const settings = Array.isArray(estimate.company_settings)
    ? estimate.company_settings[0]
    : estimate.company_settings

  const lineItems = (estimate.estimate_line_items ?? []) as Array<{ description: string; quantity: number; unit_price: number }>
  const total = lineItems.reduce((s: number, li) => s + li.quantity * li.unit_price, 0)
  const quoteUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://esti-mate.vercel.app'}/quote/${token}`
  const companyName = settings?.company_name ?? 'Your Contractor'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${companyName} <noreply@esti-mate.vercel.app>`,
      to: [estimate.customer_email],
      subject: `Your quote from ${companyName} — $${total.toFixed(2)}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2>Hi ${estimate.customer_name},</h2>
          <p>${companyName} has sent you a quote. Please review it and let us know how you'd like to proceed.</p>
          <p style="font-size:24px;font-weight:bold">Total: $${total.toFixed(2)}</p>
          <a href="${quoteUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
            View &amp; Respond to Quote →
          </a>
          <p style="color:#888;font-size:12px">You can accept, decline, or request changes directly from this link.</p>
          ${settings?.phone ? `<p>Questions? Call us: ${settings.phone}</p>` : ''}
        </div>
      `,
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  // Update estimate status to 'sent' if still at need_to_estimate
  await service.from('estimates')
    .update({ status: 'sent' })
    .eq('id', estimateId)
    .eq('status', 'need_to_estimate')

  return NextResponse.json({ success: true })
}
