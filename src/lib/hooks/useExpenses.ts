'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Expense, ExpenseInsert } from '@/lib/types'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
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
      .from('expenses')
      .select('*')
      .eq('team_id', teamId)
      .order('expense_date', { ascending: false })
    setExpenses(data ?? [])
    setLoading(false)
  }, [getTeamId])

  useEffect(() => { load() }, [load])

  async function addExpense(input: Omit<ExpenseInsert, 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')

    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...input, team_id: teamId, created_by: user.id })
      .select().single()
    if (error) throw error
    setExpenses(prev => [data as Expense, ...prev])
  }

  async function deleteExpense(id: string) {
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return { expenses, loading, addExpense, deleteExpense, reload: load }
}
