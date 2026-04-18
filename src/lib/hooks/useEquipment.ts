'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Equipment, EquipmentInsert, EquipmentLog, EquipmentLogInsert } from '@/lib/types'

export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
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

    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('team_id', teamId)
      .order('name')
    setEquipment(data ?? [])
    setLoading(false)
  }, [getTeamId])

  useEffect(() => { load() }, [load])

  async function addEquipment(input: Omit<EquipmentInsert, 'team_id'>) {
    const supabase = createClient()
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')
    const { data, error } = await supabase
      .from('equipment').insert({ ...input, team_id: teamId }).select().single()
    if (error) throw error
    setEquipment(prev => [...prev, data as Equipment])
    return data as Equipment
  }

  async function updateEquipment(id: string, updates: Partial<Equipment>) {
    const supabase = createClient()
    const { data } = await supabase
      .from('equipment').update(updates).eq('id', id).select().single()
    setEquipment(prev => prev.map(e => e.id === id ? data as Equipment : e))
  }

  async function deleteEquipment(id: string) {
    const supabase = createClient()
    await supabase.from('equipment').delete().eq('id', id)
    setEquipment(prev => prev.filter(e => e.id !== id))
  }

  return { equipment, loading, addEquipment, updateEquipment, deleteEquipment, reload: load }
}

export function useEquipmentLogs(equipmentId: string) {
  const [logs, setLogs] = useState<EquipmentLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('equipment_logs')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('log_date', { ascending: false })
    setLogs(data ?? [])
    setLoading(false)
  }, [equipmentId])

  useEffect(() => { load() }, [load])

  async function addLog(input: Omit<EquipmentLogInsert, 'equipment_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('equipment_logs')
      .insert({ ...input, equipment_id: equipmentId, created_by: user.id })
      .select().single()
    if (error) throw error
    setLogs(prev => [data as EquipmentLog, ...prev])
  }

  async function deleteLog(id: string) {
    const supabase = createClient()
    await supabase.from('equipment_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  const totalCost = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0)

  return { logs, loading, totalCost, addLog, deleteLog, reload: load }
}
