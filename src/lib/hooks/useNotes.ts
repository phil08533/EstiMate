'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateShareToken, getShareUrl } from '@/lib/utils/share'
import type { Note, NoteInsert, NoteCanvasData, NoteShare } from '@/lib/types'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const getTeamId = useCallback(async (): Promise<string | null> => {
    const supabase = createClient()
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .limit(1)
      .single()
    return membership?.team_id ?? null
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }

    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('team_id', teamId)
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false })

    setNotes(data ?? [])
    setLoading(false)
  }, [getTeamId])

  useEffect(() => { load() }, [load])

  async function createNote(mode: 'text' | 'draw' = 'text'): Promise<Note> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')

    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('notes')
      .insert({
        team_id: teamId,
        created_by: user.id,
        mode,
        note_date: today,
        title: null,
        content: null,
        canvas_data: null,
      } as NoteInsert)
      .select()
      .single()

    if (error) throw error
    await load()
    return data as Note
  }

  async function updateNote(id: string, updates: { title?: string | null; content?: string | null; canvas_data?: NoteCanvasData | null; mode?: 'text' | 'draw' }) {
    const supabase = createClient()
    await supabase.from('notes').update(updates).eq('id', id)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
  }

  async function deleteNote(id: string) {
    const supabase = createClient()
    await supabase.from('notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  // Share all notes for the team
  async function shareAllNotes(): Promise<string> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')

    // Check if an all-notes share already exists
    const { data: existing } = await supabase
      .from('note_shares')
      .select('token')
      .eq('team_id', teamId)
      .is('note_id', null)
      .limit(1)
      .single()

    if (existing) return getShareUrl(`notes/${existing.token}`)

    const token = generateShareToken()
    await supabase.from('note_shares').insert({
      team_id: teamId,
      created_by: user.id,
      note_id: null,
      token,
      expires_at: null,
    })
    return getShareUrl(`notes/${token}`)
  }

  // Share a single note
  async function shareNote(noteId: string): Promise<string> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')

    const { data: existing } = await supabase
      .from('note_shares')
      .select('token')
      .eq('note_id', noteId)
      .limit(1)
      .single()

    if (existing) return getShareUrl(`notes/${existing.token}`)

    const token = generateShareToken()
    await supabase.from('note_shares').insert({
      team_id: teamId,
      created_by: user.id,
      note_id: noteId,
      token,
      expires_at: null,
    })
    return getShareUrl(`notes/${token}`)
  }

  async function getNoteShares(noteId: string): Promise<NoteShare[]> {
    const supabase = createClient()
    const { data } = await supabase
      .from('note_shares')
      .select('*')
      .eq('note_id', noteId)
    return data ?? []
  }

  async function deleteNoteShare(shareId: string) {
    const supabase = createClient()
    await supabase.from('note_shares').delete().eq('id', shareId)
  }

  return { notes, loading, createNote, updateNote, deleteNote, shareAllNotes, shareNote, getNoteShares, deleteNoteShare, reload: load }
}

export function useNote(id: string) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.from('notes').select('*').eq('id', id).single()
    setNote(data as Note | null)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function updateNote(updates: { title?: string | null; content?: string | null; canvas_data?: NoteCanvasData | null; mode?: 'text' | 'draw' }) {
    const supabase = createClient()
    const { data } = await supabase.from('notes').update(updates).eq('id', id).select().single()
    if (data) setNote(data as Note)
  }

  return { note, loading, updateNote, reload: load }
}
