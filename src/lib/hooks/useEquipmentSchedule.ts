'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EquipmentAssignment } from '@/lib/types'

// Returned rows have joined equipment/estimate names
export type EquipmentAssignmentRow = EquipmentAssignment & {
  equipment_name?: string
  customer_name?: string
  service_date?: string | null
}

export function useEquipmentSchedule(startDate?: string, endDate?: string) {
  const [assignments, setAssignments] = useState<EquipmentAssignmentRow[]>([])
  const [loading, setLoading] = useState(true)

  const getTeamId = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    return data?.team_id ?? null
  }, [])

  const load = useCallback(async () => {
    const supabase = createClient()
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }

    let query = supabase
      .from('equipment_assignments')
      .select(`
        *,
        equipment:equipment_id(name),
        estimate:estimate_id(customer_name, service_date)
      `)
      .eq('team_id', teamId)
      .order('assigned_date')

    if (startDate) query = query.gte('assigned_date', startDate)
    if (endDate) query = query.lte('assigned_date', endDate)

    const { data } = await query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: EquipmentAssignmentRow[] = (data ?? []).map((r: any) => ({
      id: r.id, equipment_id: r.equipment_id, estimate_id: r.estimate_id,
      team_id: r.team_id, assigned_date: r.assigned_date, notes: r.notes,
      created_by: r.created_by, created_at: r.created_at,
      equipment_name: r.equipment?.name,
      customer_name: r.estimate?.customer_name,
      service_date: r.estimate?.service_date,
    }))
    setAssignments(rows)
    setLoading(false)
  }, [getTeamId, startDate, endDate])

  useEffect(() => { load() }, [load])

  async function addAssignment(input: {
    equipment_id: string
    estimate_id: string
    assigned_date: string
    notes?: string
  }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')
    const { error } = await supabase
      .from('equipment_assignments')
      .insert({ ...input, team_id: teamId, created_by: user.id })
    if (error) throw error
    await load()
  }

  async function removeAssignment(id: string) {
    const supabase = createClient()
    await supabase.from('equipment_assignments').delete().eq('id', id)
    setAssignments(prev => prev.filter(a => a.id !== id))
  }

  return { assignments, loading, addAssignment, removeAssignment, reload: load }
}
