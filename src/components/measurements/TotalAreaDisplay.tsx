import { Ruler } from 'lucide-react'
import { formatArea } from '@/lib/utils/format'

export default function TotalAreaDisplay({ totalArea, count }: { totalArea: number; count: number }) {
  if (totalArea <= 0) return null

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <Ruler className="w-5 h-5 text-green-700" />
      </div>
      <div>
        <p className="text-xs text-green-600 font-semibold uppercase">Total Area</p>
        <p className="text-xl font-bold text-green-800">{formatArea(totalArea)}</p>
        {count > 1 && (
          <p className="text-xs text-green-600">{count} measurements</p>
        )}
      </div>
    </div>
  )
}
