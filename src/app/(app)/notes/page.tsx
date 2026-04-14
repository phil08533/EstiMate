'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { useNotes } from '@/lib/hooks/useNotes'
import NoteCard from '@/components/notes/NoteCard'
import Spinner from '@/components/ui/Spinner'
import type { Note } from '@/lib/types'

function formatGroupDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function NotesPage() {
  const { notes, loading, createNote } = useNotes()
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleNew() {
    setCreating(true)
    try {
      const note = await createNote('text')
      router.push(`/notes/${note.id}`)
    } finally {
      setCreating(false)
    }
  }

  // Group notes by date
  const grouped = notes.reduce<Record<string, Note[]>>((acc, note) => {
    ;(acc[note.note_date] = acc[note.note_date] ?? []).push(note)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Notes</h1>
      </div>

      <div className="p-4 space-y-6 pb-28">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : dates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📝</div>
            <p className="text-gray-500 font-medium">No notes yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add your first note</p>
          </div>
        ) : (
          dates.map(date => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {formatGroupDate(date)}
              </h2>
              <div className="space-y-3">
                {grouped[date].map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={handleNew}
        disabled={creating}
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-30 disabled:opacity-60"
        aria-label="New note"
      >
        {creating ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Plus className="w-7 h-7" />
        )}
      </button>
    </div>
  )
}
