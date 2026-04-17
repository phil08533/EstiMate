'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Estimate, EstimateFilters, EstimateInsert, EstimateStatus, EstimateWithProfiles } from '@/lib/types'

export function useEstimates(filters?: EstimateFilters) {
  const [estimates, setEstimates] = useState<EstimateWithProfiles[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Get user's team
    let { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()

    // Auto-create team if none exists (user may never have visited Team tab)
    if (!membership) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })
      const name = user.user_metadata?.full_name
        ? `${user.user_metadata.full_name}'s Team`
        : user.email ? `${user.email.split('@')[0]}'s Team` : 'My Team'
      const { data: newTeam } = await supabase.from('teams').insert({ name, owner_id: user.id }).select().single()
      if (newTeam) {
        await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: user.id, role: 'owner' })
        membership = { team_id: newTeam.id }
      }
    }

    if (!membership) { setLoading(false); return }

    let query = supabase
      .from('estimates')
      .select('*, assignee:profiles!estimates_assigned_to_fkey(*), creator:profiles!estimates_created_by_fkey(*)')
      .eq('team_id', membership.team_id)

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }
    if (filters?.assignedTo && filters.assignedTo !== 'all') {
      query = query.eq('assigned_to', filters.assignedTo)
    }
    if (filters?.search) {
      query = query.ilike('customer_name', `%${filters.search}%`)
    }

    const sortField = filters?.sortField ?? 'created_at'
    const ascending = (filters?.sortDirection ?? 'desc') === 'asc'
    query = query.order(sortField, { ascending })

    const { data } = await query
    setEstimates((data as EstimateWithProfiles[]) ?? [])
    setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  async function createEstimate(input: Omit<EstimateInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()

    if (!membership) throw new Error('No team found. Please refresh and try again.')

    const { data, error } = await supabase
      .from('estimates')
      .insert({ ...input, team_id: membership.team_id, created_by: user.id, status: 'need_to_estimate' })
      .select()
      .single()

    if (error) throw error
    await load()
    return data as Estimate
  }

  async function updateStatus(estimateId: string, status: EstimateStatus) {
    const supabase = createClient()
    await supabase.from('estimates').update({ status }).eq('id', estimateId)
    setEstimates(prev => prev.map(e => e.id === estimateId ? { ...e, status } : e))
  }

  async function assignEstimate(estimateId: string, userId: string | null) {
    const supabase = createClient()
    await supabase.from('estimates').update({ assigned_to: userId }).eq('id', estimateId)
    await load()
  }

  async function deleteEstimate(estimateId: string) {
    const supabase = createClient()
    await supabase.from('estimates').delete().eq('id', estimateId)
    setEstimates(prev => prev.filter(e => e.id !== estimateId))
  }

  return { estimates, loading, createEstimate, updateStatus, assignEstimate, deleteEstimate, reload: load }
}
