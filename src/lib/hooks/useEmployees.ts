'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Employee, EmployeeInsert, TimeEntry, TimeEntryInsert } from '@/lib/types'

async function getTeamId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
  return data?.team_id ?? null
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('team_id', teamId)
      .eq('is_active', true)
      .order('first_name')
    setEmployees((data as Employee[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addEmployee(input: Omit<EmployeeInsert, 'team_id'>) {
    const teamId = await getTeamId()
    if (!teamId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('employees')
      .insert({ ...input, team_id: teamId })
      .select().single()
    if (data) setEmployees(prev => [...prev, data as Employee])
    return data as Employee
  }

  async function updateEmployee(id: string, updates: Partial<EmployeeInsert>) {
    const supabase = createClient()
    const { data } = await supabase.from('employees').update(updates).eq('id', id).select().single()
    if (data) setEmployees(prev => prev.map(e => e.id === id ? data as Employee : e))
  }

  async function deactivateEmployee(id: string) {
    await updateEmployee(id, { is_active: false })
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  // Build org tree: { employee, children }[]
  function buildTree(rootManagerId: string | null = null): (Employee & { children: Employee[] })[] {
    return employees
      .filter(e => e.manager_id === rootManagerId)
      .map(e => ({ ...e, children: buildTree(e.id) as Employee[] }))
  }

  return { employees, loading, addEmployee, updateEmployee, deactivateEmployee, buildTree, reload: load }
}

export function useTimeEntries(employeeId?: string) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    let query = supabase.from('time_entries').select('*').eq('team_id', teamId)
    if (employeeId) query = query.eq('employee_id', employeeId)
    const { data } = await query.order('clock_in', { ascending: false }).limit(100)
    setEntries((data as TimeEntry[]) ?? [])
    setLoading(false)
  }, [employeeId])

  useEffect(() => { load() }, [load])

  async function clockIn(input: Omit<TimeEntryInsert, 'team_id'>) {
    const teamId = await getTeamId()
    if (!teamId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .insert({ ...input, team_id: teamId })
      .select().single()
    if (data) setEntries(prev => [data as TimeEntry, ...prev])
    return data as TimeEntry
  }

  async function clockOut(entryId: string, breakMins = 0) {
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .update({ clock_out: new Date().toISOString(), break_mins: breakMins })
      .eq('id', entryId).select().single()
    if (data) setEntries(prev => prev.map(e => e.id === entryId ? data as TimeEntry : e))
  }

  const totalHours = entries.reduce((sum, e) => {
    if (!e.clock_out) return sum
    const ms = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
    return sum + (ms / 3_600_000) - (e.break_mins / 60)
  }, 0)

  return { entries, loading, clockIn, clockOut, totalHours }
}
