'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Payment } from '@/lib/types'

export function useRevenue() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) { setLoading(false); return }

    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('team_id', membership.team_id)
      .order('payment_date', { ascending: false })

    setPayments((data as Payment[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)

  return { payments, loading, totalRevenue }
}
