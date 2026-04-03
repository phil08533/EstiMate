import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import EstimateStatusBadge from '@/components/estimates/EstimateStatusBadge'
import { formatDateRelative, formatArea } from '@/lib/utils/format'
import { ClipboardList, MapPin, Phone, Ruler, UserCircle } from 'lucide-react'
import type { Estimate, Profile } from '@/lib/types'

interface EstimateWithAssignee extends Estimate {
  assignee: Profile | null
}

export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServiceClient()

  // Validate token
  const { data: shareToken } = await supabase
    .from('share_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (!shareToken) notFound()

  // Check expiry
  if (shareToken.expires_at && new Date(shareToken.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h2 className="text-lg font-semibold text-gray-900">Link expired</h2>
          <p className="text-gray-500 text-sm mt-1">This share link has expired.</p>
        </div>
      </div>
    )
  }

  // Fetch estimates
  const { data: estimates } = await supabase
    .from('estimates')
    .select('*, assignee:profiles!estimates_assigned_to_fkey(*)')
    .eq('team_id', shareToken.team_id)
    .order('updated_at', { ascending: false })

  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', shareToken.team_id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">{team?.name ?? 'Estimates'}</h1>
          </div>
          <p className="text-xs text-gray-400">Read-only shared view · {(estimates ?? []).length} estimates</p>
        </div>

        {/* Estimates */}
        <div className="p-4 space-y-3">
          {(estimates as EstimateWithAssignee[] ?? []).map(estimate => (
            <div key={estimate.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{estimate.customer_name}</h3>
                <EstimateStatusBadge status={estimate.status} />
              </div>
              {estimate.customer_address && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {estimate.customer_address}
                </div>
              )}
              {estimate.customer_phone && (
                <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  {estimate.customer_phone}
                </div>
              )}
              {estimate.comments && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">{estimate.comments}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <UserCircle className="w-3.5 h-3.5" />
                  {estimate.assignee?.full_name ?? 'Unassigned'}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {estimate.total_area > 0 && (
                    <span className="flex items-center gap-1">
                      <Ruler className="w-3 h-3" />
                      {formatArea(estimate.total_area)}
                    </span>
                  )}
                  <span>{formatDateRelative(estimate.updated_at)}</span>
                </div>
              </div>
            </div>
          ))}
          {(estimates ?? []).length === 0 && (
            <div className="text-center py-12 text-gray-400">No estimates yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
