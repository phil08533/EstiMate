import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { StickyNote } from 'lucide-react'
import NotePublicRenderer from '@/components/notes/NotePublicRenderer'
import type { Note } from '@/lib/types'

export default async function SharedNotesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createServiceClient()

  // Validate token
  const { data: share } = await supabase
    .from('note_shares')
    .select('*')
    .eq('token', token)
    .single()

  if (!share) notFound()

  // Check expiry
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-3">⏰</div>
          <h2 className="text-lg font-semibold text-gray-900">Link expired</h2>
          <p className="text-gray-500 text-sm mt-1">This share link has expired.</p>
        </div>
      </div>
    )
  }

  // Fetch team name
  const { data: team } = await supabase
    .from('teams')
    .select('name')
    .eq('id', share.team_id)
    .single()

  // Fetch notes (single note or all team notes)
  let notes: Note[] = []
  if (share.note_id) {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('id', share.note_id)
      .single()
    if (data) notes = [data as Note]
  } else {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('team_id', share.team_id)
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false })
    notes = (data as Note[]) ?? []
  }

  const subtitle = share.note_id
    ? `1 note · Read-only shared view`
    : `${notes.length} note${notes.length !== 1 ? 's' : ''} · Read-only shared view`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-2 mb-1">
            <StickyNote className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">
              {team?.name ?? 'Notes'}
            </h1>
          </div>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>

        <NotePublicRenderer notes={notes} />
      </div>
    </div>
  )
}
