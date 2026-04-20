'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { JobNote } from '@/lib/types'

export function useJobNotes(estimateId: string) {
  const [notes, setNotes] = useState<JobNote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('job_notes')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: true })
    setNotes((data as JobNote[]) ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addNote(content: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) throw new Error('No team')
    const { data, error } = await supabase
      .from('job_notes')
      .insert({ estimate_id: estimateId, team_id: membership.team_id, created_by: user.id, content })
      .select().single()
    if (error) throw error
    setNotes(prev => [...prev, data as JobNote])
  }

  async function deleteNote(id: string) {
    const supabase = createClient()
    await supabase.from('job_notes').delete().eq('id', id)
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  return { notes, loading, addNote, deleteNote, reload: load }
}
