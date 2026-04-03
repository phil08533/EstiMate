'use client'

import { useState } from 'react'
import { ALL_STATUSES, getStatusLabel, getStatusColor } from '@/lib/utils/status'
import type { EstimateStatus } from '@/lib/types'
import Modal from '@/components/ui/Modal'

interface StatusSelectProps {
  value: EstimateStatus
  onChange: (status: EstimateStatus) => Promise<void>
}

export default function StatusSelect({ value, onChange }: StatusSelectProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSelect(status: EstimateStatus) {
    if (status === value) { setOpen(false); return }
    setSaving(true)
    await onChange(status)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={saving}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-opacity ${getStatusColor(value)} disabled:opacity-50`}
      >
        <span className="w-2 h-2 rounded-full bg-current opacity-60" />
        {getStatusLabel(value)}
        <span className="text-xs opacity-60">▾</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Change status">
        <div className="space-y-2">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                s === value
                  ? getStatusColor(s) + ' border-current'
                  : 'bg-gray-50 border-gray-200 text-gray-700 active:bg-gray-100'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${
                s === 'need_to_estimate' ? 'bg-amber-400' :
                s === 'sent' ? 'bg-blue-400' :
                s === 'sold' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="font-medium">{getStatusLabel(s)}</span>
              {s === value && <span className="ml-auto text-sm">✓</span>}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
