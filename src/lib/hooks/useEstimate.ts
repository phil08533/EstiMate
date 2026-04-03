'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Estimate, EstimateInsert, EstimateWithProfiles } from '@/lib/types'

export function useEstimate(id: string) {
  const [estimate, setEstimate] = useState<EstimateWithProfiles | null>(null as EstimateWithProfiles | null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('estimates')
      .select('*, assignee:profiles!estimates_assigned_to_fkey(*), creator:profiles!estimates_created_by_fkey(*)')
      .eq('id', id)
      .single()
    setEstimate(data as EstimateWithProfiles)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function updateEstimate(updates: Partial<EstimateInsert>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('estimates')
      .update(updates)
      .eq('id', id)
      .select('*, assignee:profiles!estimates_assigned_to_fkey(*), creator:profiles!estimates_created_by_fkey(*)')
      .single()
    if (error) throw error
    setEstimate(data as EstimateWithProfiles)
    return data as Estimate
  }

  return { estimate, loading, updateEstimate, reload: load }
}
