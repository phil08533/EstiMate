'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Note } from '@/lib/types'

interface NoteShareSheetProps {
  note: Note
  onShareNote: (noteId: string) => Promise<string>
  onShareAll: () => Promise<string>
}

export default function NoteShareSheet({ note, onShareNote, onShareAll }: NoteShareSheetProps) {
  const [noteUrl, setNoteUrl] = useState<string | null>(null)
  const [allUrl, setAllUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState<'note' | 'all' | null>(null)
  const [loading, setLoading] = useState<'note' | 'all' | null>(null)

  async function getLink(type: 'note' | 'all') {
    setLoading(type)
    try {
      if (type === 'note') {
        setNoteUrl(await onShareNote(note.id))
      } else {
        setAllUrl(await onShareAll())
      }
    } finally {
      setLoading(null)
    }
  }

  async function copy(type: 'note' | 'all', url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Share this note */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-1">Share this note</p>
        <p className="text-xs text-gray-400 mb-3">Anyone with this link can view this note (read-only)</p>
        {noteUrl ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-gray-600 bg-white rounded-xl px-3 py-2 truncate border border-gray-200">
              {noteUrl}
            </code>
            <button
              onClick={() => copy('note', noteUrl)}
              className="p-2 text-gray-400 active:text-blue-600 rounded-xl bg-white border border-gray-200"
            >
              {copied === 'note' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" loading={loading === 'note'} onClick={() => getLink('note')}>
            Get link
          </Button>
        )}
      </div>

      {/* Share all notes */}
      <div className="bg-gray-50 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-700 mb-1">Share all notes</p>
        <p className="text-xs text-gray-400 mb-3">Anyone with this link can view all your team&apos;s notes</p>
        {allUrl ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs text-gray-600 bg-white rounded-xl px-3 py-2 truncate border border-gray-200">
              {allUrl}
            </code>
            <button
              onClick={() => copy('all', allUrl)}
              className="p-2 text-gray-400 active:text-blue-600 rounded-xl bg-white border border-gray-200"
            >
              {copied === 'all' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" loading={loading === 'all'} onClick={() => getLink('all')}>
            Get link
          </Button>
        )}
      </div>
    </div>
  )
}
