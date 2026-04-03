'use client'

import { Trash2, Ruler } from 'lucide-react'
import { formatArea } from '@/lib/utils/format'
import type { Measurement } from '@/lib/types'

interface MeasurementListProps {
  measurements: Measurement[]
  onDelete: (id: string) => Promise<void>
}

export default function MeasurementList({ measurements, onDelete }: MeasurementListProps) {
  if (measurements.length === 0) return null

  return (
    <div className="space-y-2">
      {measurements.map(m => (
        <div
          key={m.id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
        >
          <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {m.label && <p className="text-sm font-medium text-gray-700 truncate">{m.label}</p>}
            <p className="text-xs text-gray-400">
              {m.length} × {m.width} ft = <span className="font-semibold text-gray-600">{formatArea(m.area)}</span>
            </p>
          </div>
          <button
            onClick={() => onDelete(m.id)}
            className="p-1.5 text-gray-400 active:text-red-500 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
