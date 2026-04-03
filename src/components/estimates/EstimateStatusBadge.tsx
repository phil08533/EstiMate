import Badge from '@/components/ui/Badge'
import { getStatusColor, getStatusLabel, STATUS_DOT } from '@/lib/utils/status'
import type { EstimateStatus } from '@/lib/types'

export default function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  return (
    <Badge className={getStatusColor(status)}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {getStatusLabel(status)}
    </Badge>
  )
}
