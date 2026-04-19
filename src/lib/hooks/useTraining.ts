'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/hooks/useTeam'
import type { TrainingModule, TrainingModuleInsert, TrainingItem, TrainingItemInsert, TrainingCompletion } from '@/lib/types'

export function useTraining() {
  const { team } = useTeam()
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team?.id) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('training_modules')
      .select('*')
      .eq('team_id', team.id)
      .order('created_at', { ascending: false })
    setModules((data as TrainingModule[]) ?? [])
    setLoading(false)
  }, [team?.id])

  useEffect(() => { load() }, [load])

  async function addModule(fields: Omit<TrainingModuleInsert, 'team_id' | 'created_by'>) {
    if (!team?.id) return null
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('training_modules')
      .insert({ ...fields, team_id: team.id, created_by: user?.id ?? null })
      .select().single()
    if (data) setModules(prev => [data as TrainingModule, ...prev])
    return data as TrainingModule | null
  }

  async function updateModule(id: string, fields: Partial<TrainingModuleInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('training_modules').update(fields).eq('id', id).select().single()
    if (data) setModules(prev => prev.map(m => m.id === id ? data as TrainingModule : m))
  }

  async function deleteModule(id: string) {
    const supabase = createClient()
    await supabase.from('training_modules').delete().eq('id', id)
    setModules(prev => prev.filter(m => m.id !== id))
  }

  return { modules, loading, addModule, updateModule, deleteModule }
}

export function useTrainingItems(moduleId: string) {
  const [items, setItems] = useState<TrainingItem[]>([])
  const [completions, setCompletions] = useState<TrainingCompletion[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!moduleId) { setLoading(false); return }
    const supabase = createClient()
    const [{ data: it }, { data: co }] = await Promise.all([
      supabase.from('training_items').select('*').eq('module_id', moduleId).order('position'),
      supabase.from('training_completions').select('*').in('item_id',
        (await supabase.from('training_items').select('id').eq('module_id', moduleId)).data?.map((r: {id: string}) => r.id) ?? []
      ),
    ])
    setItems((it as TrainingItem[]) ?? [])
    setCompletions((co as TrainingCompletion[]) ?? [])
    setLoading(false)
  }, [moduleId])

  useEffect(() => { load() }, [load])

  async function addItem(fields: Omit<TrainingItemInsert, 'position'>) {
    const supabase = createClient()
    const pos = items.length
    const { data } = await supabase.from('training_items').insert({ ...fields, position: pos }).select().single()
    if (data) setItems(prev => [...prev, data as TrainingItem])
    return data as TrainingItem | null
  }

  async function deleteItem(id: string) {
    const supabase = createClient()
    await supabase.from('training_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function toggleCompletion(itemId: string, employeeId: string) {
    const supabase = createClient()
    const existing = completions.find(c => c.item_id === itemId && c.employee_id === employeeId)
    if (existing) {
      await supabase.from('training_completions').delete().eq('id', existing.id)
      setCompletions(prev => prev.filter(c => c.id !== existing.id))
    } else {
      const { data } = await supabase.from('training_completions')
        .insert({ item_id: itemId, employee_id: employeeId })
        .select().single()
      if (data) setCompletions(prev => [...prev, data as TrainingCompletion])
    }
  }

  return { items, completions, loading, addItem, deleteItem, toggleCompletion }
}
