'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Share2 } from 'lucide-react'
import { useNote, useNotes } from '@/lib/hooks/useNotes'
import NoteEditor from '@/components/notes/NoteEditor'
import NoteShareSheet from '@/components/notes/NoteShareSheet'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

export default function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { note, loading, updateNote } = useNote(id)
  const { deleteNote, shareNote, shareAllNotes } = useNotes()
  const [shareOpen, setShareOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this note?')) return
    setDeleting(true)
    await deleteNote(id)
    router.replace('/notes')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100dvh - 80px)' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center" style={{ height: 'calc(100dvh - 80px)' }}>
        <p className="text-gray-500">Note not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100dvh - 80px)' }}>
      {/* Nav */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-500 rounded-xl active:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShareOpen(true)}
          className="p-2 text-gray-500 rounded-xl active:bg-gray-100"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-red-400 rounded-xl active:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <NoteEditor note={note} onUpdate={updateNote} />
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share note">
        <NoteShareSheet
          note={note}
          onShareNote={shareNote}
          onShareAll={shareAllNotes}
        />
      </Modal>
    </div>
  )
}
