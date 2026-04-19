'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/hooks/useTeam'
import type { RecurringJob, RecurringJobInsert } from '@/lib/types'

export function useRecurringJobs() {
  const { team } = useTeam()
  const [jobs, setJobs] = useState<RecurringJob[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team?.id) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_jobs')
      .select('*')
      .eq('team_id', team.id)
      .order('next_date', { ascending: true })
    setJobs((data as RecurringJob[]) ?? [])
    setLoading(false)
  }, [team?.id])

  useEffect(() => { load() }, [load])

  async function addJob(fields: Omit<RecurringJobInsert, 'team_id'>) {
    if (!team?.id) return null
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_jobs')
      .insert({ ...fields, team_id: team.id })
      .select()
      .single()
    if (data) { setJobs(prev => [...prev, data as RecurringJob].sort((a, b) => a.next_date.localeCompare(b.next_date))) }
    return data as RecurringJob | null
  }

  async function updateJob(id: string, fields: Partial<RecurringJobInsert>) {
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_jobs')
      .update(fields)
      .eq('id', id)
      .select()
      .single()
    if (data) setJobs(prev => prev.map(j => j.id === id ? data as RecurringJob : j))
  }

  async function deleteJob(id: string) {
    const supabase = createClient()
    await supabase.from('recurring_jobs').delete().eq('id', id)
    setJobs(prev => prev.filter(j => j.id !== id))
  }

  return { jobs, loading, addJob, updateJob, deleteJob }
}

export function advanceDate(date: string, frequency: RecurringJob['frequency']): string {
  const d = new Date(date + 'T12:00:00Z')
  switch (frequency) {
    case 'weekly':    d.setDate(d.getDate() + 7); break
    case 'biweekly':  d.setDate(d.getDate() + 14); break
    case 'monthly':   d.setMonth(d.getMonth() + 1); break
    case 'quarterly': d.setMonth(d.getMonth() + 3); break
    case 'annually':  d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0]
}
