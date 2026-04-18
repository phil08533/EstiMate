'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Customer, CustomerInsert, Lead, LeadInsert, LeadStage, ContactLog, ContactLogInsert } from '@/lib/types'

async function getTeamId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
  return data?.team_id ?? null
}

// ─── Customers ────────────────────────────────────────────────────────────────

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('team_id', teamId)
      .order('full_name')
    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addCustomer(input: Omit<CustomerInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const teamId = await getTeamId()
    if (!teamId) return
    const { data } = await supabase
      .from('customers')
      .insert({ ...input, team_id: teamId, created_by: user.id })
      .select().single()
    if (data) setCustomers(prev => [...prev, data as Customer].sort((a, b) => a.full_name.localeCompare(b.full_name)))
    return data as Customer
  }

  async function updateCustomer(id: string, updates: Partial<CustomerInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('customers').update(updates).eq('id', id).select().single()
    if (data) setCustomers(prev => prev.map(c => c.id === id ? data as Customer : c))
  }

  async function deleteCustomer(id: string) {
    const supabase = createClient()
    await supabase.from('customers').delete().eq('id', id)
    setCustomers(prev => prev.filter(c => c.id !== id))
  }

  return { customers, loading, addCustomer, updateCustomer, deleteCustomer, reload: load }
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    setLeads((data as Lead[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addLead(input: Omit<LeadInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const teamId = await getTeamId()
    if (!teamId) return
    const { data } = await supabase
      .from('leads')
      .insert({ ...input, team_id: teamId, created_by: user.id })
      .select().single()
    if (data) setLeads(prev => [data as Lead, ...prev])
    return data as Lead
  }

  async function updateLead(id: string, updates: Partial<LeadInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('leads').update(updates).eq('id', id).select().single()
    if (data) setLeads(prev => prev.map(l => l.id === id ? data as Lead : l))
  }

  async function moveLead(id: string, stage: LeadStage) {
    return updateLead(id, { stage })
  }

  async function convertToCustomer(lead: Lead): Promise<Customer | null> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const teamId = await getTeamId()
    if (!teamId) return null

    const { data: customer } = await supabase
      .from('customers')
      .insert({
        team_id: teamId,
        created_by: user.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        notes: lead.notes,
        source: lead.source,
        is_active: true,
      })
      .select().single()

    if (customer) {
      await supabase.from('leads').update({ stage: 'won', customer_id: customer.id }).eq('id', lead.id)
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'won', customer_id: customer.id } : l))
    }
    return customer as Customer | null
  }

  async function deleteLead(id: string) {
    const supabase = createClient()
    await supabase.from('leads').delete().eq('id', id)
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  return { leads, loading, addLead, updateLead, moveLead, convertToCustomer, deleteLead, reload: load }
}

// ─── Contact logs ─────────────────────────────────────────────────────────────

export function useContactLogs(customerId?: string, leadId?: string) {
  const [logs, setLogs] = useState<ContactLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    let query = supabase.from('contact_logs').select('*').eq('team_id', teamId)
    if (customerId) query = query.eq('customer_id', customerId)
    if (leadId) query = query.eq('lead_id', leadId)
    const { data } = await query.order('created_at', { ascending: false })
    setLogs((data as ContactLog[]) ?? [])
    setLoading(false)
  }, [customerId, leadId])

  useEffect(() => { load() }, [load])

  async function addLog(input: Omit<ContactLogInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const teamId = await getTeamId()
    if (!teamId) return
    const { data } = await supabase
      .from('contact_logs')
      .insert({ ...input, team_id: teamId, created_by: user.id })
      .select().single()
    if (data) setLogs(prev => [data as ContactLog, ...prev])
  }

  async function deleteLog(id: string) {
    const supabase = createClient()
    await supabase.from('contact_logs').delete().eq('id', id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return { logs, loading, addLog, deleteLog }
}
