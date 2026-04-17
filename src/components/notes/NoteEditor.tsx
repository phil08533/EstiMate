'use client'

import { useState, useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import type { Note } from '@/lib/types'

type NoteUpdates = {
  title?: string | null
  content?: string | null
}

interface NoteEditorProps {
  note: Note
  onUpdate: (updates: NoteUpdates) => Promise<void>
  readOnly?: boolean
}

export default function NoteEditor({ note, onUpdate, readOnly = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title ?? '')
  const [content, setContent] = useState(note.content ?? '')
  const [saved, setSaved] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<NoteUpdates>({})

  useEffect(() => {
    setTitle(note.title ?? '')
    setContent(note.content ?? '')
  }, [note.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function scheduleAutoSave(updates: NoteUpdates) {
    pendingRef.current = { ...pendingRef.current, ...updates }
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await onUpdate(pendingRef.current)
      pendingRef.current = {}
      setSaved(true)
    }, 800)
  }

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-gray-100 bg-white flex-shrink-0">
          {saved ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <Check className="w-3 h-3" />
              Saved
            </span>
          ) : (
            <span className="text-xs text-gray-400">Saving…</span>
          )}
        </div>
      )}

      {!readOnly ? (
        <input
          type="text"
          value={title}
          onChange={e => { setTitle(e.target.value); scheduleAutoSave({ title: e.target.value || null }) }}
          placeholder="Title"
          className="w-full px-4 py-3 text-lg font-semibold text-gray-900 placeholder:text-gray-300 border-b border-gray-100 outline-none bg-white flex-shrink-0"
        />
      ) : note.title ? (
        <div className="px-4 py-3 text-lg font-semibold text-gray-900 border-b border-gray-100 flex-shrink-0">
          {note.title}
        </div>
      ) : null}

      <div className="flex-1 overflow-hidden">
        {readOnly ? (
          <div className="px-4 py-3 text-gray-700 whitespace-pre-wrap overflow-y-auto h-full">
            {content || <span className="text-gray-400 italic">Empty note</span>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); scheduleAutoSave({ content: e.target.value || null }) }}
            placeholder="Start typing…"
            className="w-full h-full px-4 py-3 text-gray-700 placeholder:text-gray-300 outline-none resize-none bg-white"
          />
        )}
      </div>
    </div>
  )
}
