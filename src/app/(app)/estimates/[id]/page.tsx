'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit2, Phone, Mail, MapPin, MessageSquare } from 'lucide-react'
import { useEstimate } from '@/lib/hooks/useEstimate'
import { useTeam } from '@/lib/hooks/useTeam'
import TopBar from '@/components/layout/TopBar'
import StatusSelect from '@/components/estimates/StatusSelect'
import AssigneeSelect from '@/components/estimates/AssigneeSelect'
import MediaSection from '@/components/media/MediaSection'
import MeasurementsSection from '@/components/measurements/MeasurementsSection'
import Spinner from '@/components/ui/Spinner'
import type { EstimateStatus } from '@/lib/types'

export default function EstimateDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { estimate, loading, updateEstimate } = useEstimate(id)
  const { members } = useTeam()
  const [tab, setTab] = useState<'media' | 'measurements' | 'notes'>('media')

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Estimate not found</p>
      </div>
    )
  }

  async function handleStatusChange(status: EstimateStatus) {
    await updateEstimate({ status })
  }

  async function handleAssigneeChange(userId: string | null) {
    await updateEstimate({ assigned_to: userId })
  }

  return (
    <>
      <TopBar
        title={estimate.customer_name}
        backHref="/estimates"
        right={
          <Link href={`/estimates/${id}/edit`} className="p-1.5 rounded-lg text-gray-500 active:bg-gray-100">
            <Edit2 className="w-5 h-5" />
          </Link>
        }
      />

      <div className="p-4 space-y-4">
        {/* Status + assignee row */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatusSelect value={estimate.status} onChange={handleStatusChange} />
          <AssigneeSelect
            assignedTo={estimate.assigned_to}
            assignee={estimate.assignee}
            members={members}
            onChange={handleAssigneeChange}
          />
        </div>

        {/* Customer info card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <h2 className="font-semibold text-gray-900">{estimate.customer_name}</h2>
          {estimate.customer_phone && (
            <a href={`tel:${estimate.customer_phone}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Phone className="w-4 h-4" />
              {estimate.customer_phone}
            </a>
          )}
          {estimate.customer_email && (
            <a href={`mailto:${estimate.customer_email}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Mail className="w-4 h-4" />
              {estimate.customer_email}
            </a>
          )}
          {estimate.customer_address && (
            <div className="flex items-start gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {estimate.customer_address}
            </div>
          )}
        </div>

        {/* Notes preview */}
        {estimate.comments && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-semibold mb-1">
              <MessageSquare className="w-3.5 h-3.5" />
              NOTES
            </div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
              {estimate.comments}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {(['media', 'measurements', 'notes'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                  tab === t
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-4">
            {tab === 'media' && <MediaSection estimateId={id} teamId={estimate.team_id} />}
            {tab === 'measurements' && <MeasurementsSection estimateId={id} />}
            {tab === 'notes' && (
              <div>
                {estimate.comments ? (
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {estimate.comments}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-4">
                    No notes. <Link href={`/estimates/${id}/edit`} className="text-blue-600">Add notes →</Link>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
