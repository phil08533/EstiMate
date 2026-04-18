'use client'

import { useState, useEffect } from 'react'
import { Download, ArrowLeft, Mail, Link2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEstimate } from '@/lib/hooks/useEstimate'
import { useLineItems } from '@/lib/hooks/useLineItems'
import { useCompanySettings } from '@/lib/hooks/useCompanySettings'
import { usePayments } from '@/lib/hooks/usePayments'
import { usePaymentLinks } from '@/lib/hooks/usePaymentLinks'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function InvoicePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { estimate, loading: eLoading } = useEstimate(id)
  const { lineItems, subtotal, loading: liLoading } = useLineItems(id)
  const { settings, loading: sLoading } = useCompanySettings()
  const { payments, totalPaid, loading: pLoading } = usePayments(id)
  const { links, createLink } = usePaymentLinks(id)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [sendingLink, setSendingLink] = useState(false)
  const [copied, setCopied] = useState(false)

  const loading = eLoading || liLoading || sLoading || pLoading

  useEffect(() => {
    if (settings?.logo_path) {
      createClient().storage.from('estimate-media')
        .createSignedUrl(settings.logo_path, 3600)
        .then(({ data }) => setLogoUrl(data?.signedUrl ?? null))
    }
  }, [settings?.logo_path])

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  if (!estimate) return <div className="p-4 text-center text-gray-500">Estimate not found</div>

  const taxRate = settings?.tax_rate ?? 0
  const taxableSubtotal = lineItems.filter(li => !li.tax_exempt).reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const taxAmount = taxableSubtotal * (taxRate / 100)
  const totalDue = subtotal + taxAmount
  const balance = totalDue - totalPaid

  const invoiceNumber = `EST-${estimate.id.slice(-6).toUpperCase()}`
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  async function handleSendPaymentLink() {
    if (!estimate) return
    setSendingLink(true)
    try {
      const depositAmt = Math.round(totalDue * 0.5 * 100) / 100
      const existing = links.find(l => l.status === 'pending')
      const link = existing ?? await createLink({
        depositPct: 50,
        depositAmount: depositAmt,
        totalAmount: totalDue,
        customerEmail: estimate!.customer_email,
        customerName: estimate!.customer_name,
      })
      const url = `${window.location.origin}/pay/${link.token}`

      if (estimate!.customer_email) {
        const subject = encodeURIComponent(`Your estimate from ${settings?.company_name ?? 'us'} — pay your deposit`)
        const body = encodeURIComponent(
          `Hi ${estimate!.customer_name},\n\nYour estimate is ready! Please click the link below to review and pay your 50% deposit (${fmt(depositAmt)}) to get started:\n\n${url}\n\nTotal quote: ${fmt(totalDue)}\n\nThank you!\n${settings?.company_name ?? ''}`
        )
        window.location.href = `mailto:${estimate!.customer_email}?subject=${subject}&body=${body}`
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } finally {
      setSendingLink(false)
    }
  }

  function handleEmail() {
    const to = estimate!.customer_email ?? ''
    const subject = encodeURIComponent(`Estimate ${invoiceNumber} from ${settings?.company_name ?? 'us'}`)
    const body = encodeURIComponent(
      `Hi ${estimate!.customer_name},\n\nPlease find your estimate ${invoiceNumber} attached.\n\nTotal: ${fmt(totalDue)}\n\nThank you for your business!\n\n${settings?.company_name ?? ''}\n${settings?.phone ?? ''}`
    )
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 no-print">
        <button onClick={() => router.back()} className="p-2 text-gray-500 rounded-xl active:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="flex-1 font-semibold text-gray-900">Invoice Preview</span>
        <button
          onClick={handleSendPaymentLink}
          disabled={sendingLink}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl active:bg-purple-700 disabled:opacity-60"
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          {copied ? 'Copied!' : sendingLink ? '…' : 'Send Link'}
        </button>
        {estimate.customer_email && (
          <button
            onClick={handleEmail}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl active:bg-green-700"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        )}
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>
      </div>

      {/* Invoice document */}
      <div className="max-w-2xl mx-auto p-4 print:p-0">
        <div className="bg-white shadow-sm rounded-2xl print:rounded-none print:shadow-none p-8 space-y-6" id="invoice">

          {/* Header: logo + company */}
          <div className="flex items-start justify-between gap-4">
            <div>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="Company logo"
                  style={{ width: `${Math.round(150 * (settings?.logo_scale ?? 1))}px` }}
                  className="object-contain mb-3"
                />
              )}
              <h1 className="text-2xl font-bold text-gray-900">{settings?.company_name ?? 'Your Company'}</h1>
              {settings?.address && <p className="text-sm text-gray-500 whitespace-pre-line mt-0.5">{settings.address}</p>}
              {settings?.phone && <p className="text-sm text-gray-500">{settings.phone}</p>}
              {settings?.email && <p className="text-sm text-gray-500">{settings.email}</p>}
              {settings?.license_number && <p className="text-xs text-gray-400 mt-1">Lic # {settings.license_number}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estimate</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{invoiceNumber}</p>
              <p className="text-sm text-gray-500 mt-1">Date: {today}</p>
              <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold inline-block ${
                balance <= 0 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {balance <= 0 ? 'PAID' : 'UNPAID'}
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Bill to */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bill To</p>
            <p className="font-semibold text-gray-900">{estimate.customer_name}</p>
            {estimate.customer_address && <p className="text-sm text-gray-600">{estimate.customer_address}</p>}
            {estimate.customer_phone && <p className="text-sm text-gray-600">{estimate.customer_phone}</p>}
            {estimate.customer_email && <p className="text-sm text-gray-600">{estimate.customer_email}</p>}
          </div>

          {/* Scope of work */}
          {estimate.comments && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Scope of Work</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{estimate.comments}</p>
            </div>
          )}

          {/* Line items */}
          {lineItems.length > 0 && (
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-500 text-xs uppercase">
                    <th className="text-left pb-2 font-semibold">Description</th>
                    <th className="text-right pb-2 font-semibold w-16">Qty</th>
                    <th className="text-right pb-2 font-semibold w-24">Price</th>
                    <th className="text-right pb-2 font-semibold w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map(li => (
                    <tr key={li.id}>
                      <td className="py-2.5 text-gray-800">
                        {li.description}
                        {li.tax_exempt && <span className="ml-1 text-xs text-amber-600">(exempt)</span>}
                      </td>
                      <td className="py-2.5 text-right text-gray-600">{li.quantity}</td>
                      <td className="py-2.5 text-right text-gray-600">{fmt(li.unit_price)}</td>
                      <td className="py-2.5 text-right font-medium text-gray-900">{fmt(li.quantity * li.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-4 border-t border-gray-200 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax ({taxRate}%)</span>
                    <span>{fmt(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1.5 mt-1.5">
                  <span>Total Due</span>
                  <span>{fmt(totalDue)}</span>
                </div>

                {payments.length > 0 && (
                  <>
                    {payments.map(p => (
                      <div key={p.id} className="flex justify-between text-sm text-green-700">
                        <span>Payment — {p.payment_method} ({p.payment_date})</span>
                        <span>-{fmt(p.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-1.5 mt-1.5">
                      <span className={balance <= 0 ? 'text-green-700' : 'text-gray-900'}>Balance Due</span>
                      <span className={balance <= 0 ? 'text-green-700' : 'text-gray-900'}>
                        {balance <= 0 ? 'Paid in full' : fmt(balance)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Payment terms */}
          {(settings?.payment_terms || settings?.footer_notes) && (
            <div className="border-t border-gray-200 pt-4 space-y-1">
              {settings.payment_terms && (
                <p className="text-sm text-gray-600"><span className="font-semibold">Payment terms:</span> {settings.payment_terms}</p>
              )}
              {settings.footer_notes && (
                <p className="text-sm text-gray-500">{settings.footer_notes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #invoice { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}
