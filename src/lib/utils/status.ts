import type { EstimateStatus } from '@/lib/types'

export const STATUS_LABELS: Record<EstimateStatus, string> = {
  need_to_estimate: 'Need to Estimate',
  sent: 'Sent',
  sold: 'Sold',
  lost: 'Lost',
}

export const STATUS_COLORS: Record<EstimateStatus, string> = {
  need_to_estimate: 'bg-amber-100 text-amber-800 border-amber-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  sold: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
}

export const STATUS_DOT: Record<EstimateStatus, string> = {
  need_to_estimate: 'bg-amber-400',
  sent: 'bg-blue-400',
  sold: 'bg-green-400',
  lost: 'bg-red-400',
}

export const ALL_STATUSES: EstimateStatus[] = [
  'need_to_estimate',
  'sent',
  'sold',
  'lost',
]

export function getStatusLabel(status: EstimateStatus): string {
  return STATUS_LABELS[status]
}

export function getStatusColor(status: EstimateStatus): string {
  return STATUS_COLORS[status]
}
