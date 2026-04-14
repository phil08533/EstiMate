import Link from 'next/link'
import { Pencil, Type } from 'lucide-react'
import type { Note } from '@/lib/types'

function formatNoteDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

export default function NoteCard({ note }: { note: Note }) {
  const Icon = note.mode === 'draw' ? Pencil : Type
  const preview =
    note.mode === 'text'
      ? note.content?.slice(0, 100) ?? ''
      : note.canvas_data
      ? `${note.canvas_data.shapes.length} shape${note.canvas_data.shapes.length !== 1 ? 's' : ''}`
      : 'Empty canvas'

  return (
    <Link
      href={`/notes/${note.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-4 active:bg-gray-50 transition-colors shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 text-base leading-tight">
          {note.title || 'Untitled note'}
        </h3>
        <div className="flex-shrink-0 p-1.5 bg-gray-100 rounded-lg">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
      </div>
      {preview ? (
        <p className="text-sm text-gray-500 line-clamp-2">{preview}</p>
      ) : null}
      <p className="text-xs text-gray-400 mt-2">{formatNoteDate(note.note_date)}</p>
    </Link>
  )
}
