'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment, PaymentInsert } from '@/lib/types'

export function usePayments(estimateId: string) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('payment_date', { ascending: false })
    setPayments(data ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addPayment(input: Omit<PaymentInsert, 'estimate_id' | 'team_id' | 'created_by'>) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) throw new Error('No team')

    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...input,
        estimate_id: estimateId,
        team_id: membership.team_id,
        created_by: user.id,
      })
      .select().single()
    if (error) throw error
    setPayments(prev => [data as Payment, ...prev])
  }

  async function deletePayment(id: string) {
    const supabase = createClient()
    await supabase.from('payments').delete().eq('id', id)
    setPayments(prev => prev.filter(p => p.id !== id))
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return { payments, loading, totalPaid, addPayment, deletePayment, reload: load }
}
