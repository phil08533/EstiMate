'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, MessageSquare, Zap, Phone, Mail, Images } from 'lucide-react'

interface LineItem {
  id: string; description: string; quantity: number
  unit_price: number; unit: string; tax_exempt: boolean
}

interface Photo { id: string; url: string; caption: string | null }

interface Props {
  estimate: {
    id: string; customer_name: string; customer_phone: string | null
    customer_email: string | null; customer_address: string | null
    comments: string | null; customer_response: string | null
    service_date: string | null
  }
  lineItems: LineItem[]
  settings: { company_name?: string | null; phone?: string | null; email?: string | null; tax_rate?: number; payment_terms?: string | null; footer_notes?: string | null } | null
  subtotal: number; tax: number; total: number
  token: string
  photos?: Photo[]
}

type Action = 'accepted' | 'declined' | 'modification_requested'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function QuoteResponseClient({ estimate, lineItems, settings, subtotal, tax, total, token, photos = [] }: Props) {
  const [action, setAction] = useState<Action | null>(
    estimate.customer_response as Action | null
  )
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!estimate.customer_response)

  async function respond(type: Action) {
    setSubmitting(true)
    const res = await fetch(`/api/quote/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: type, notes }),
    })
    if (res.ok) {
      setAction(type)
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  const companyName = settings?.company_name ?? 'Your Contractor'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900">{companyName}</p>
          <p className="text-xs text-gray-500">Quote for {estimate.customer_name}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-12">

        {/* Response banner */}
        {submitted && action && (
          <div className={`flex items-center gap-3 rounded-2xl p-4 ${
            action === 'accepted'              ? 'bg-green-50 border border-green-200' :
            action === 'declined'             ? 'bg-red-50 border border-red-200' :
            'bg-amber-50 border border-amber-200'
          }`}>
            {action === 'accepted'    && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />}
            {action === 'declined'   && <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
            {action === 'modification_requested' && <MessageSquare className="w-6 h-6 text-amber-500 flex-shrink-0" />}
            <div>
              <p className={`font-semibold text-sm ${action === 'accepted' ? 'text-green-800' : action === 'declined' ? 'text-red-800' : 'text-amber-800'}`}>
                {action === 'accepted'    ? 'Quote accepted — thank you!' :
                 action === 'declined'   ? 'You declined this quote.' :
                 'Modification request sent.'}
              </p>
              <p className="text-xs mt-0.5 text-gray-500">
                {companyName} has been notified of your response.
              </p>
            </div>
          </div>
        )}

        {/* Service date */}
        {estimate.service_date && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Proposed Service Date</p>
            <p className="font-bold text-blue-900 mt-0.5">
              {new Date(estimate.service_date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          </div>
        )}

        {/* Line items */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Quote Details</p>
          </div>
          <div className="divide-y divide-gray-50">
            {lineItems.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No line items on this quote.</p>
            ) : lineItems.map(li => (
              <div key={li.id} className="px-4 py-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">{li.description}</p>
                  <p className="text-xs text-gray-400">{li.quantity} {li.unit} × {fmt(li.unit_price)}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                  {fmt(li.quantity * li.unit_price)}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-3 space-y-1.5 bg-gray-50">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax ({settings?.tax_rate ?? 0}%)</span><span>{fmt(tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Design / proposal photos */}
        {photos.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <Images className="w-4 h-4 text-gray-400" />
              <p className="font-semibold text-gray-900 text-sm">Project Photos</p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              {photos.map(photo => (
                <div key={photo.id} className="rounded-xl overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption ?? 'Project photo'} className="w-full object-cover aspect-video" />
                  {photo.caption && (
                    <p className="text-xs text-gray-500 px-2 py-1.5">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {estimate.comments && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">Notes from contractor</p>
            <p className="text-sm text-gray-800">{estimate.comments}</p>
          </div>
        )}

        {/* Payment terms */}
        {settings?.payment_terms && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 mb-1">Payment Terms</p>
            <p className="text-sm text-gray-700">{settings.payment_terms}</p>
          </div>
        )}

        {/* Response buttons */}
        {!submitted && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-gray-900 text-sm">Your Response</p>
            <p className="text-xs text-gray-500">Let {companyName} know how you&apos;d like to proceed:</p>

            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional message to the contractor…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => respond('accepted')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white font-semibold rounded-xl active:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                Accept Quote
              </button>
              <button
                onClick={() => respond('modification_requested')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 text-white font-semibold rounded-xl active:bg-amber-600 disabled:opacity-50"
              >
                <MessageSquare className="w-5 h-5" />
                Request Changes
              </button>
              <button
                onClick={() => respond('declined')}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-3 bg-white border-2 border-red-200 text-red-600 font-semibold rounded-xl active:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Decline
              </button>
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Questions? Contact us</p>
          <div className="space-y-2">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="flex items-center gap-2 text-blue-600 text-sm">
                <Phone className="w-4 h-4" /> {settings.phone}
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-blue-600 text-sm">
                <Mail className="w-4 h-4" /> {settings.email}
              </a>
            )}
          </div>
        </div>

        {settings?.footer_notes && (
          <p className="text-xs text-gray-400 text-center px-4">{settings.footer_notes}</p>
        )}
      </div>
    </div>
  )
}
