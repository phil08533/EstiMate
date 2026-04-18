'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { EstimateTemplate, TemplateLineItem, EstimateLineItemInsert } from '@/lib/types'

export function useTemplates() {
  const [templates, setTemplates] = useState<(EstimateTemplate & { items: TemplateLineItem[] })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) { setLoading(false); return }

    const { data: tmplData } = await supabase
      .from('estimate_templates')
      .select('*')
      .eq('team_id', membership.team_id)
      .order('name')

    const tList = tmplData ?? []

    if (tList.length === 0) {
      setTemplates([])
      setLoading(false)
      return
    }

    const ids = tList.map(t => t.id)
    const { data: itemData } = await supabase
      .from('template_line_items')
      .select('*')
      .in('template_id', ids)
      .order('sort_order')

    const itemsByTemplate: Record<string, TemplateLineItem[]> = {}
    for (const item of itemData ?? []) {
      ;(itemsByTemplate[item.template_id] = itemsByTemplate[item.template_id] ?? []).push(item)
    }

    setTemplates(tList.map(t => ({ ...t, items: itemsByTemplate[t.id] ?? [] })))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function getTeamId() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    return data?.team_id ?? null
  }

  async function saveAsTemplate(
    name: string,
    description: string | null,
    lineItems: Pick<EstimateLineItemInsert, 'description' | 'quantity' | 'unit_price' | 'unit' | 'tax_exempt' | 'sort_order'>[]
  ) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const teamId = await getTeamId()
    if (!teamId) return

    const { data: tmpl } = await supabase
      .from('estimate_templates')
      .insert({ team_id: teamId, created_by: user.id, name, description })
      .select()
      .single()

    if (!tmpl) return

    if (lineItems.length > 0) {
      await supabase.from('template_line_items').insert(
        lineItems.map((li, i) => ({
          template_id: tmpl.id,
          description: li.description,
          quantity: li.quantity,
          unit_price: li.unit_price,
          unit: li.unit,
          tax_exempt: li.tax_exempt,
          sort_order: li.sort_order ?? i,
        }))
      )
    }
    await load()
  }

  async function deleteTemplate(id: string) {
    const supabase = createClient()
    await supabase.from('estimate_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return { templates, loading, saveAsTemplate, deleteTemplate, reload: load }
}
