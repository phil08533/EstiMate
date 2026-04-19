'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EstimateLineItem, EstimateLineItemInsert, ServiceItem } from '@/lib/types'

export function useLineItems(estimateId: string) {
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([])
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()

    const [{ data: items }, { data: catalog }] = await Promise.all([
      supabase.from('estimate_line_items')
        .select('*').eq('estimate_id', estimateId).order('sort_order').order('created_at'),
      membership
        ? supabase.from('service_items').select('*').eq('team_id', membership.team_id).order('name')
        : Promise.resolve({ data: [] }),
    ])

    setLineItems(items ?? [])
    setServiceItems((catalog ?? []) as ServiceItem[])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addLineItem(input: Omit<EstimateLineItemInsert, 'estimate_id'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('estimate_line_items')
      .insert({ ...input, estimate_id: estimateId, sort_order: lineItems.length })
      .select().single()
    if (error) throw error
    setLineItems(prev => [...prev, data as EstimateLineItem])
  }

  async function updateLineItem(id: string, updates: Partial<EstimateLineItem>) {
    const supabase = createClient()
    const { data } = await supabase
      .from('estimate_line_items').update(updates).eq('id', id).select().single()
    setLineItems(prev => prev.map(li => li.id === id ? data as EstimateLineItem : li))
  }

  async function deleteLineItem(id: string) {
    const supabase = createClient()
    await supabase.from('estimate_line_items').delete().eq('id', id)
    setLineItems(prev => prev.filter(li => li.id !== id))
  }

  async function addServiceItem(input: Omit<ServiceItem, 'id' | 'created_at' | 'team_id'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) throw new Error('No team')
    const { data, error } = await supabase
      .from('service_items').insert({ ...input, team_id: membership.team_id }).select().single()
    if (error) throw error
    setServiceItems(prev => [...prev, data as ServiceItem].sort((a, b) => a.name.localeCompare(b.name)))
    return data as ServiceItem
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)

  return {
    lineItems, serviceItems, loading, subtotal,
    addLineItem, updateLineItem, deleteLineItem, addServiceItem,
    reload: load,
  }
}
