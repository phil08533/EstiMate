'use client'

import { useState } from 'react'
import { calcArea } from '@/lib/utils/area'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Ruler } from 'lucide-react'
import type { MeasurementInsert } from '@/lib/types'

interface MeasurementFormProps {
  onAdd: (m: Omit<MeasurementInsert, 'estimate_id'>) => Promise<void>
}

export default function MeasurementForm({ onAdd }: MeasurementFormProps) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [saving, setSaving] = useState(false)

  const l = parseFloat(length)
  const w = parseFloat(width)
  const area = calcArea(l, w)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!l || !w || l <= 0 || w <= 0) return
    setSaving(true)
    await onAdd({ length: l, width: w, label: label || null, media_id: null })
    setSaving(false)
    setLabel('')
    setLength('')
    setWidth('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium active:bg-gray-50"
      >
        <Ruler className="w-4 h-4" />
        Add measurement
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
      <Input
        label="Label (optional)"
        placeholder="e.g. Master bedroom"
        value={label}
        onChange={e => setLabel(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Length (ft)"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          placeholder="0"
          value={length}
          onChange={e => setLength(e.target.value)}
        />
        <Input
          label="Width (ft)"
          type="number"
          inputMode="decimal"
          step="0.1"
          min="0.1"
          placeholder="0"
          value={width}
          onChange={e => setWidth(e.target.value)}
        />
      </div>
      {area > 0 && (
        <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm text-blue-700 font-semibold">
          Area = {l} × {w} = <span className="text-lg">{area}</span> sq ft
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" loading={saving} disabled={area <= 0} className="flex-1">
          Add
        </Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
