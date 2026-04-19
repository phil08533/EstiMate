'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Vendor, VendorInsert } from '@/lib/types'

async function getTeamId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
  return data?.team_id ?? null
}

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('name')
    setVendors((data as Vendor[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addVendor(input: Omit<VendorInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const teamId = await getTeamId()
    if (!teamId || !user) return
    const { data } = await supabase
      .from('vendors')
      .insert({ ...input, team_id: teamId, created_by: user.id })
      .select().single()
    if (data) setVendors(prev => [...prev, data as Vendor].sort((a, b) => a.name.localeCompare(b.name)))
    return data as Vendor
  }

  async function updateVendor(id: string, updates: Partial<VendorInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('vendors').update(updates).eq('id', id).select().single()
    if (data) setVendors(prev => prev.map(v => v.id === id ? data as Vendor : v))
  }

  async function deleteVendor(id: string) {
    const supabase = createClient()
    await supabase.from('vendors').update({ is_active: false }).eq('id', id)
    setVendors(prev => prev.filter(v => v.id !== id))
  }

  return { vendors, loading, addVendor, updateVendor, deleteVendor, reload: load }
}
