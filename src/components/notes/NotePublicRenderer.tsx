'use client'

import dynamic from 'next/dynamic'
import { Pencil, Type } from 'lucide-react'
import type { Note } from '@/lib/types'

const NoteCanvas = dynamic(() => import('./NoteCanvas'), { ssr: false })

function formatNoteDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

export default function NotePublicRenderer({ notes }: { notes: Note[] }) {
  // Group by date
  const grouped = notes.reduce<Record<string, Note[]>>((acc, note) => {
    ;(acc[note.note_date] = acc[note.note_date] ?? []).push(note)
    return acc
  }, {})
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  if (notes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">No notes to display</div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {dates.map(date => (
        <div key={date}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            {formatNoteDate(date)}
          </h2>
          <div className="space-y-4">
            {grouped[date].map(note => (
              <div key={note.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    {note.mode === 'draw' ? (
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    ) : (
                      <Type className="w-3.5 h-3.5 text-gray-500" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">
                    {note.title || 'Untitled note'}
                  </span>
                </div>

                {/* Content */}
                {note.mode === 'text' ? (
                  <div className="px-4 py-3 text-gray-700 text-sm whitespace-pre-wrap">
                    {note.content || <span className="text-gray-400 italic">Empty note</span>}
                  </div>
                ) : (
                  <div style={{ height: 360 }}>
                    <NoteCanvas data={note.canvas_data} readOnly />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
