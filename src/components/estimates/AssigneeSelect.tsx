'use client'

import { useState } from 'react'
import { UserCircle, ChevronDown } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { Profile } from '@/lib/types'
import type { TeamMemberWithProfile } from '@/lib/hooks/useTeam'

interface AssigneeSelectProps {
  assignedTo: string | null
  assignee: Profile | null | undefined
  members: TeamMemberWithProfile[]
  onChange: (userId: string | null) => Promise<void>
}

export default function AssigneeSelect({ assignedTo, assignee, members, onChange }: AssigneeSelectProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSelect(userId: string | null) {
    setSaving(true)
    await onChange(userId)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={saving}
        className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-xl px-3 py-2 active:bg-gray-200 disabled:opacity-50"
      >
        <UserCircle className="w-4 h-4" />
        <span>{assignee?.full_name ?? 'Unassigned'}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Assign to">
        <div className="space-y-2">
          <button
            onClick={() => handleSelect(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
              !assignedTo ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <UserCircle className="w-5 h-5 opacity-50" />
            <span>Unassigned</span>
            {!assignedTo && <span className="ml-auto text-sm">✓</span>}
          </button>
          {members.map(m => (
            <button
              key={m.user_id}
              onClick={() => handleSelect(m.user_id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                assignedTo === m.user_id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {(m.profile.full_name ?? m.profile.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-medium">{m.profile.full_name ?? 'No name'}</div>
                <div className="text-xs opacity-60">{m.profile.email}</div>
              </div>
              {assignedTo === m.user_id && <span className="ml-auto text-sm">✓</span>}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
