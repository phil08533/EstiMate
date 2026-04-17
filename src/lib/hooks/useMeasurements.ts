'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Measurement, MeasurementInsert, MeasurementGroup } from '@/lib/types'

export function useMeasurements(estimateId: string) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [groups, setGroups] = useState<MeasurementGroup[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: mData }, { data: gData }] = await Promise.all([
      supabase
        .from('measurements')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: true }),
      supabase
        .from('measurement_groups')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])
    setMeasurements(mData ?? [])
    setGroups(gData ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addMeasurement(input: Omit<MeasurementInsert, 'estimate_id'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('measurements')
      .insert({ ...input, estimate_id: estimateId })
      .select()
      .single()
    if (error) throw error
    setMeasurements(prev => [...prev, data])
    return data as Measurement
  }

  async function deleteMeasurement(measurementId: string) {
    const supabase = createClient()
    await supabase.from('measurements').delete().eq('id', measurementId)
    setMeasurements(prev => prev.filter(m => m.id !== measurementId))
  }

  async function moveMeasurement(measurementId: string, groupId: string | null) {
    const supabase = createClient()
    await supabase.from('measurements').update({ group_id: groupId }).eq('id', measurementId)
    setMeasurements(prev => prev.map(m => m.id === measurementId ? { ...m, group_id: groupId } : m))
  }

  async function addGroup(name: string) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('measurement_groups')
      .insert({ estimate_id: estimateId, name, display_order: groups.length })
      .select()
      .single()
    if (error) throw error
    setGroups(prev => [...prev, data as MeasurementGroup])
    return data as MeasurementGroup
  }

  async function renameGroup(groupId: string, name: string) {
    const supabase = createClient()
    await supabase.from('measurement_groups').update({ name }).eq('id', groupId)
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g))
  }

  async function deleteGroup(groupId: string) {
    const supabase = createClient()
    // Measurements with this group_id will be set to null by DB (on delete set null)
    await supabase.from('measurement_groups').delete().eq('id', groupId)
    setGroups(prev => prev.filter(g => g.id !== groupId))
    // Update local state to ungroup measurements
    setMeasurements(prev => prev.map(m => m.group_id === groupId ? { ...m, group_id: null } : m))
  }

  const totalArea = measurements.reduce((sum, m) => sum + (m.area ?? 0), 0)

  return {
    measurements, groups, loading, totalArea,
    addMeasurement, deleteMeasurement, moveMeasurement,
    addGroup, renameGroup, deleteGroup,
    reload: load,
  }
}
