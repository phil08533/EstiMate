'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/hooks/useTeam'
import type { Crew, CrewInsert, CrewMember, ScheduleBlock, ScheduleBlockInsert } from '@/lib/types'

export function useCrews() {
  const { team } = useTeam()
  const [crews, setCrews] = useState<Crew[]>([])
  const [crewMembers, setCrewMembersList] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team?.id) { setLoading(false); return }
    const supabase = createClient()
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from('crews').select('*').eq('team_id', team.id).eq('is_active', true).order('name'),
      supabase.from('crew_members').select('*').in('crew_id',
        (await supabase.from('crews').select('id').eq('team_id', team.id)).data?.map((r: {id: string}) => r.id) ?? []
      ),
    ])
    setCrews((c as Crew[]) ?? [])
    setCrewMembersList((m as CrewMember[]) ?? [])
    setLoading(false)
  }, [team?.id])

  useEffect(() => { load() }, [load])

  async function addCrew(fields: Omit<CrewInsert, 'team_id'>) {
    if (!team?.id) return null
    const supabase = createClient()
    const { data } = await supabase.from('crews').insert({ ...fields, team_id: team.id }).select().single()
    if (data) setCrews(prev => [...prev, data as Crew])
    return data as Crew | null
  }

  async function updateCrew(id: string, fields: Partial<CrewInsert>) {
    const supabase = createClient()
    await supabase.from('crews').update(fields).eq('id', id)
    setCrews(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c))
  }

  async function deleteCrew(id: string) {
    const supabase = createClient()
    await supabase.from('crews').update({ is_active: false }).eq('id', id)
    setCrews(prev => prev.filter(c => c.id !== id))
  }

  async function setCrewMembers(crewId: string, employeeIds: string[]) {
    const supabase = createClient()
    await supabase.from('crew_members').delete().eq('crew_id', crewId)
    if (employeeIds.length > 0) {
      await supabase.from('crew_members').insert(employeeIds.map(eid => ({ crew_id: crewId, employee_id: eid })))
    }
    setCrewMembersList(prev => [
      ...prev.filter(m => m.crew_id !== crewId),
      ...employeeIds.map(eid => ({ crew_id: crewId, employee_id: eid })),
    ])
  }

  return { crews, crewMembers, loading, addCrew, updateCrew, deleteCrew, setCrewMembers }
}

export function useScheduleBlocks(estimateId?: string) {
  const { team } = useTeam()
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team?.id) { setLoading(false); return }
    const supabase = createClient()
    let q = supabase.from('schedule_blocks').select('*').eq('team_id', team.id)
    if (estimateId) q = q.eq('estimate_id', estimateId)
    const { data } = await q.order('block_date')
    setBlocks((data as ScheduleBlock[]) ?? [])
    setLoading(false)
  }, [team?.id, estimateId])

  useEffect(() => { load() }, [load])

  async function addBlock(fields: Omit<ScheduleBlockInsert, 'team_id'>) {
    if (!team?.id) return null
    const supabase = createClient()
    const { data } = await supabase.from('schedule_blocks').insert({ ...fields, team_id: team.id }).select().single()
    if (data) setBlocks(prev => [...prev, data as ScheduleBlock].sort((a, b) => a.block_date.localeCompare(b.block_date)))
    return data as ScheduleBlock | null
  }

  async function deleteBlock(id: string) {
    const supabase = createClient()
    await supabase.from('schedule_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return { blocks, loading, addBlock, deleteBlock, reload: load }
}
