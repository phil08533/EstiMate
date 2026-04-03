'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

interface MediaCommentFormProps {
  initialComment: string | null
  onSave: (comment: string) => Promise<void>
}

export default function MediaCommentForm({ initialComment, onSave }: MediaCommentFormProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialComment ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(value)
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-left text-sm text-gray-500 py-2 px-3 bg-gray-50 rounded-xl active:bg-gray-100"
      >
        {value || '+ Add comment...'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        rows={3}
        placeholder="Add a comment about this photo..."
        className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl active:bg-blue-700 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={() => { setValue(initialComment ?? ''); setEditing(false) }}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl active:bg-gray-200"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
