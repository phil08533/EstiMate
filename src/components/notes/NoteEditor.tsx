'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Type, Pencil, Check } from 'lucide-react'
import type { Note, NoteCanvasData } from '@/lib/types'

const NoteCanvas = dynamic(() => import('./NoteCanvas'), { ssr: false })

type NoteUpdates = {
  title?: string | null
  content?: string | null
  canvas_data?: NoteCanvasData | null
  mode?: 'text' | 'draw'
}

interface NoteEditorProps {
  note: Note
  onUpdate: (updates: NoteUpdates) => Promise<void>
  readOnly?: boolean
}

export default function NoteEditor({ note, onUpdate, readOnly = false }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title ?? '')
  const [content, setContent] = useState(note.content ?? '')
  const [mode, setMode] = useState<'text' | 'draw'>(note.mode)
  const [saved, setSaved] = useState(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<NoteUpdates>({})

  useEffect(() => {
    setTitle(note.title ?? '')
    setContent(note.content ?? '')
    setMode(note.mode)
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

  function handleTitleChange(v: string) {
    setTitle(v)
    scheduleAutoSave({ title: v || null })
  }

  function handleContentChange(v: string) {
    setContent(v)
    scheduleAutoSave({ content: v || null })
  }

  function handleCanvasChange(canvas_data: NoteCanvasData) {
    scheduleAutoSave({ canvas_data })
  }

  async function handleModeToggle(newMode: 'text' | 'draw') {
    if (newMode === mode) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    pendingRef.current = {}
    setSaved(true)
    setMode(newMode)
    await onUpdate({ mode: newMode })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex rounded-xl bg-gray-100 p-1 gap-0.5">
            <button
              onClick={() => handleModeToggle('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Text
            </button>
            <button
              onClick={() => handleModeToggle('draw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                mode === 'draw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Draw
            </button>
          </div>
          <div className="ml-auto">
            {saved ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <Check className="w-3 h-3" />
                Saved
              </span>
            ) : (
              <span className="text-xs text-gray-400">Saving…</span>
            )}
          </div>
        </div>
      )}

      {/* Title */}
      {!readOnly ? (
        <input
          type="text"
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Title"
          className="w-full px-4 py-3 text-lg font-semibold text-gray-900 placeholder:text-gray-300 border-b border-gray-100 outline-none bg-white flex-shrink-0"
        />
      ) : note.title ? (
        <div className="px-4 py-3 text-lg font-semibold text-gray-900 border-b border-gray-100 flex-shrink-0">
          {note.title}
        </div>
      ) : null}

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {mode === 'text' ? (
          readOnly ? (
            <div className="px-4 py-3 text-gray-700 whitespace-pre-wrap overflow-y-auto h-full">
              {content || <span className="text-gray-400 italic">Empty note</span>}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              placeholder="Start typing…"
              className="w-full h-full px-4 py-3 text-gray-700 placeholder:text-gray-300 outline-none resize-none bg-white"
            />
          )
        ) : (
          <NoteCanvas
            data={note.canvas_data}
            onChange={readOnly ? undefined : handleCanvasChange}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  )
}
