'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useNotes } from '@/lib/hooks/useNotes'
import NoteEditor from '@/components/notes/NoteEditor'
import Spinner from '@/components/ui/Spinner'
import type { Note } from '@/lib/types'

const today = new Date().toISOString().split('T')[0]

function formatGroupDate(dateStr: string): string {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function NotesPage() {
  const { notes, loading, createNote, updateNote } = useNotes()
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const initRef = useRef(false)

  const todayNote = notes.find(n => n.note_date === today) ?? null

  useEffect(() => {
    if (loading || initRef.current) return
    initRef.current = true
    if (!notes.find(n => n.note_date === today)) {
      setCreating(true)
      createNote('text').finally(() => setCreating(false))
    }
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const pastNotes = notes.filter(n => n.note_date !== today)
  const filtered = search.trim()
    ? pastNotes.filter(n =>
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.content?.toLowerCase().includes(search.toLowerCase())
      )
    : pastNotes

  const grouped = filtered.reduce<Record<string, Note[]>>((acc, n) => {
    ;(acc[n.note_date] = acc[n.note_date] ?? []).push(n)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (loading || creating) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100dvh - 80px)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 80px)' }}>
      {/* Today header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 bg-white">
        <h1 className="text-xl font-bold text-gray-900">Today</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Today's note inline */}
      {todayNote && (
        <div className="flex-shrink-0 border-b border-gray-200" style={{ height: '260px' }}>
          <NoteEditor
            note={todayNote}
            onUpdate={(updates) => updateNote(todayNote.id, updates)}
          />
        </div>
      )}

      {/* Past notes */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white px-4 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search past notes…"
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="p-4 space-y-4 pb-8">
          {dates.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-4">
              {search ? `No notes match "${search}"` : 'No past notes'}
            </p>
          )}
          {dates.map(date => (
            <div key={date}>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {formatGroupDate(date)}
              </h2>
              <div className="space-y-2">
                {grouped[date].map(note => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 active:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {note.title || formatGroupDate(note.note_date)}
                      </p>
                      {note.content && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {note.content.slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
