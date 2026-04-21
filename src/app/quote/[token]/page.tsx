import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import QuoteResponseClient from './QuoteResponseClient'

export const dynamic = 'force-dynamic'

export default async function QuotePage({ params }: { params: { token: string } }) {
  const supabase = await createServiceClient()

  const { data: estimate } = await supabase
    .from('estimates')
    .select('*, estimate_line_items(*), company_settings:team_id(company_name, phone, email, logo_path, tax_rate, payment_terms, footer_notes)')
    .eq('quote_token', params.token)
    .single()

  if (!estimate) notFound()

  // Fetch media attached to this estimate (images for the design/proposal)
  const { data: media } = await supabase
    .from('estimate_media')
    .select('id, file_path, file_type, caption')
    .eq('estimate_id', estimate.id)
    .in('file_type', ['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    .order('created_at')

  const lineItems = (estimate.estimate_line_items ?? []) as Array<{
    id: string; description: string; quantity: number; unit_price: number
    unit: string; tax_exempt: boolean
  }>

  const settings = Array.isArray(estimate.company_settings)
    ? estimate.company_settings[0]
    : estimate.company_settings

  const taxRate: number = settings?.tax_rate ?? 0
  const subtotal = lineItems.reduce((s: number, li) => s + li.quantity * li.unit_price, 0)
  const taxable  = lineItems.filter(li => !li.tax_exempt).reduce((s: number, li) => s + li.quantity * li.unit_price, 0)
  const tax      = taxable * (taxRate / 100)
  const total    = subtotal + tax

  // Build public URLs for images
  const photoUrls = (media ?? []).map(m => ({
    id: m.id,
    caption: m.caption as string | null,
    url: supabase.storage.from('estimate-media').getPublicUrl(m.file_path).data.publicUrl,
  }))

  return (
    <QuoteResponseClient
      estimate={estimate}
      lineItems={lineItems}
      settings={settings}
      subtotal={subtotal}
      tax={tax}
      total={total}
      token={params.token}
      photos={photoUrls}
      showLineItems={estimate.quote_show_line_items ?? true}
    />
  )
}
