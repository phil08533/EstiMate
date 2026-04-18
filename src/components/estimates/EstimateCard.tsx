import Link from 'next/link'
import { MapPin, Phone, UserCircle, Ruler, Clock, AlertTriangle } from 'lucide-react'
import EstimateStatusBadge from './EstimateStatusBadge'
import { formatDateRelative, formatArea } from '@/lib/utils/format'
import type { EstimateWithProfiles } from '@/lib/types'

const today = new Date().toISOString().split('T')[0]

export default function EstimateCard({ estimate }: { estimate: EstimateWithProfiles }) {
  const followUp = estimate.follow_up_date
  const isOverdue = followUp && followUp < today
  const isDueToday = followUp === today

  return (
    <Link
      href={`/estimates/${estimate.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-4 active:bg-gray-50 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">
          {estimate.customer_name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isOverdue && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              Follow up
            </span>
          )}
          {isDueToday && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700">
              <Clock className="w-3 h-3" />
              Today
            </span>
          )}
          <EstimateStatusBadge status={estimate.status} />
        </div>
      </div>

      {estimate.customer_address && (
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{estimate.customer_address}</span>
        </div>
      )}

      {estimate.customer_phone && (
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{estimate.customer_phone}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
          {estimate.assignee ? (
            <>
              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {(estimate.assignee.full_name ?? estimate.assignee.email ?? '?')[0].toUpperCase()}
              </div>
              <span>{estimate.assignee.full_name ?? estimate.assignee.email}</span>
            </>
          ) : (
            <>
              <UserCircle className="w-4 h-4" />
              <span>Unassigned</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {estimate.total_area > 0 && (
            <span className="flex items-center gap-1">
              <Ruler className="w-3.5 h-3.5" />
              {formatArea(estimate.total_area)}
            </span>
          )}
          <span>{formatDateRelative(estimate.updated_at)}</span>
        </div>
      </div>
    </Link>
  )
}
