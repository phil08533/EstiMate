import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import PaymentClient from './PaymentClient'

export default async function PaymentPage({ params }: { params: { token: string } }) {
  const { token } = params
  const supabase = await createServiceClient()

  const { data: link } = await supabase
    .from('payment_links')
    .select('*')
    .eq('token', token)
    .single()

  if (!link) notFound()

  // Fetch line items for the estimate
  const { data: lineItems } = await supabase
    .from('line_items')
    .select('description, quantity, unit_price')
    .eq('estimate_id', link.estimate_id)
    .order('sort_order', { ascending: true })

  // Fetch company settings for branding
  const { data: company } = await supabase
    .from('company_settings')
    .select('company_name, phone, email')
    .eq('team_id', link.team_id)
    .single()

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-gray-900">{company?.company_name ?? 'Your Estimate'}</h1>
          {company?.phone && <p className="text-sm text-gray-500">{company.phone}</p>}
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Customer greeting */}
        <div className="pt-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Hi {link.customer_name?.split(' ')[0] ?? 'there'} 👋
          </h2>
          <p className="text-gray-500 mt-1">
            Your quote is ready. Please review the details below and pay your deposit to get started.
          </p>
        </div>

        <PaymentClient
          link={link}
          lineItems={lineItems ?? []}
          stripeKey={stripeKey}
        />

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 pb-8">
          Questions? Contact us at {company?.email ?? company?.phone ?? 'the contact info above'}.
        </p>
      </div>
    </div>
  )
}
