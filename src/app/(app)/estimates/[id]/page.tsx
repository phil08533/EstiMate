'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Edit2, Phone, Mail, MapPin, FileText, Calendar, Eye, EyeOff } from 'lucide-react'
import { useEstimate } from '@/lib/hooks/useEstimate'
import { useTeam } from '@/lib/hooks/useTeam'
import { useLineItems } from '@/lib/hooks/useLineItems'
import TopBar from '@/components/layout/TopBar'
import StatusSelect from '@/components/estimates/StatusSelect'
import AssigneeSelect from '@/components/estimates/AssigneeSelect'
import MediaSection from '@/components/media/MediaSection'
import MeasurementsSection from '@/components/measurements/MeasurementsSection'
import LineItemsSection from '@/components/estimates/LineItemsSection'
import PaymentsSection from '@/components/estimates/PaymentsSection'
import MakeClientButton from '@/components/estimates/MakeClientButton'
import SendQuoteButton from '@/components/estimates/SendQuoteButton'
import Spinner from '@/components/ui/Spinner'
import type { EstimateStatus } from '@/lib/types'

type Tab = 'quote' | 'media' | 'measurements' | 'payments' | 'notes'

export default function EstimateDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { estimate, loading, updateEstimate } = useEstimate(id)
  const { members } = useTeam()
  const { addLineItem, lineItems } = useLineItems(id)
  const [tab, setTab] = useState<Tab>('quote')
  const [descDraft, setDescDraft] = useState<string | null>(null)

  const handleImportMeasurements = useCallback(async (
    items: { description: string; quantity: number; unit: string }[]
  ) => {
    for (let i = 0; i < items.length; i++) {
      await addLineItem({
        description: items[i].description,
        quantity: items[i].quantity,
        unit_price: 0,
        unit: items[i].unit,
        tax_exempt: false,
        service_item_id: null,
        sort_order: lineItems.length + i,
        category: 'other',
      })
    }
    setTab('quote')
  }, [addLineItem, lineItems.length])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div>
  }
  if (!estimate) {
    return <div className="p-4 text-center"><p className="text-gray-500">Estimate not found</p></div>
  }

  // descDraft: null means "use estimate.comments" (not editing yet)
  const descValue = descDraft ?? (estimate.comments ?? '')

  function saveDesc() {
    const current = estimate!.comments ?? ''
    if (descDraft !== null && descDraft !== current) {
      updateEstimate({ comments: descDraft || null })
    }
  }

  const showLineItems = estimate.quote_show_line_items ?? true

  const tabs: { id: Tab; label: string }[] = [
    { id: 'quote', label: 'Quote' },
    { id: 'media', label: 'Media' },
    { id: 'measurements', label: 'Measure' },
    { id: 'payments', label: 'Payments' },
    { id: 'notes', label: 'Description' },
  ]

  return (
    <>
      <TopBar
        title={estimate.customer_name}
        backHref="/estimates"
        right={
          <div className="flex items-center gap-1">
            <Link href={`/estimates/${id}/invoice`} className="p-1.5 rounded-lg text-gray-500 active:bg-gray-100">
              <FileText className="w-5 h-5" />
            </Link>
            <Link href={`/estimates/${id}/edit`} className="p-1.5 rounded-lg text-gray-500 active:bg-gray-100">
              <Edit2 className="w-5 h-5" />
            </Link>
          </div>
        }
      />

      <div className="p-4 space-y-4">
        {/* Status + assignee */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusSelect value={estimate.status} onChange={async s => { await updateEstimate({ status: s as EstimateStatus }) }} />
          <AssigneeSelect
            assignedTo={estimate.assigned_to}
            assignee={estimate.assignee}
            members={members}
            onChange={async userId => { await updateEstimate({ assigned_to: userId }) }}
          />
        </div>

        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-900">{estimate.customer_name}</h2>
            <MakeClientButton estimate={estimate} />
          </div>
          {estimate.customer_phone && (
            <a href={`tel:${estimate.customer_phone}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Phone className="w-4 h-4" />{estimate.customer_phone}
            </a>
          )}
          {estimate.customer_email && (
            <a href={`mailto:${estimate.customer_email}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Mail className="w-4 h-4" />{estimate.customer_email}
            </a>
          )}
          {estimate.customer_address && (
            <div className="flex items-start gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />{estimate.customer_address}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 px-3 py-2.5">
            <Calendar className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Service date</p>
              <input type="date" value={estimate.service_date ?? ''} onChange={e => updateEstimate({ service_date: e.target.value || null })}
                className="w-full text-xs text-gray-800 outline-none bg-transparent" />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200 px-3 py-2.5">
            <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Follow-up</p>
              <input type="date" value={estimate.follow_up_date ?? ''} onChange={e => updateEstimate({ follow_up_date: e.target.value || null })}
                className="w-full text-xs text-gray-800 outline-none bg-transparent" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 py-3 px-4 text-sm font-medium transition-colors ${
                  tab === t.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'quote' && (
              <div className="space-y-5">
                {/* Inline description */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                    Description (shown to customer)
                  </label>
                  <textarea
                    value={descValue}
                    onChange={e => setDescDraft(e.target.value)}
                    onBlur={saveDesc}
                    placeholder="Describe the scope of work — materials, areas, timeline, anything the customer should know…"
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  />
                </div>

                {/* Line items */}
                <LineItemsSection estimateId={id} />

                {/* Quote options + send */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quote options</p>

                  <button
                    onClick={() => updateEstimate({ quote_show_line_items: !showLineItems })}
                    className={`w-full flex items-center gap-3 px-4 py-3 border rounded-xl text-left transition-colors ${
                      showLineItems ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {showLineItems
                      ? <Eye className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      : <EyeOff className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    }
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${showLineItems ? 'text-blue-800' : 'text-gray-600'}`}>
                        {showLineItems ? 'Showing itemized prices' : 'Showing total only'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {showLineItems
                          ? 'Customer sees each line item. Tap to show total only.'
                          : 'Customer sees just the total. Tap to show line items.'}
                      </p>
                    </div>
                  </button>

                  <SendQuoteButton estimate={estimate} />
                </div>
              </div>
            )}

            {tab === 'media' && <MediaSection estimateId={id} teamId={estimate.team_id} />}

            {tab === 'measurements' && (
              <MeasurementsSection estimateId={id} onImportToQuote={handleImportMeasurements} />
            )}

            {tab === 'payments' && <PaymentsSection estimateId={id} />}

            {tab === 'notes' && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">This text appears on the customer&apos;s quote and the invoice. Describe the scope of work, materials, or anything they should know.</p>
                <textarea
                  value={descValue}
                  onChange={e => setDescDraft(e.target.value)}
                  onBlur={saveDesc}
                  placeholder="Describe the scope of work — areas to be serviced, materials, exclusions, guarantees…"
                  rows={10}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 text-right">Auto-saves when you tap away</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
