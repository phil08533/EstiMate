'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTeam } from '@/lib/hooks/useTeam'
import type { ServiceCategory, ServiceCategoryInsert } from '@/lib/types'

export function useServiceCategories() {
  const { team } = useTeam()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!team?.id) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('service_categories')
      .select('*')
      .eq('team_id', team.id)
      .eq('is_active', true)
      .order('name')
    setCategories((data as ServiceCategory[]) ?? [])
    setLoading(false)
  }, [team?.id])

  useEffect(() => { load() }, [load])

  async function addCategory(fields: Omit<ServiceCategoryInsert, 'team_id'>) {
    if (!team?.id) return null
    const supabase = createClient()
    const { data } = await supabase
      .from('service_categories')
      .insert({ ...fields, team_id: team.id })
      .select().single()
    if (data) setCategories(prev => [...prev, data as ServiceCategory].sort((a, b) => a.name.localeCompare(b.name)))
    return data as ServiceCategory | null
  }

  async function updateCategory(id: string, fields: Partial<ServiceCategoryInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('service_categories').update(fields).eq('id', id).select().single()
    if (data) setCategories(prev => prev.map(c => c.id === id ? data as ServiceCategory : c))
  }

  async function deleteCategory(id: string) {
    const supabase = createClient()
    await supabase.from('service_categories').update({ is_active: false }).eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory }
}
