'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PaymentLink } from '@/lib/types'

export function usePaymentLinks(estimateId: string) {
  const [links, setLinks] = useState<PaymentLink[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('payment_links')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: false })
    setLinks(data ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function createLink(opts: {
    depositPct: number
    depositAmount: number
    totalAmount: number
    customerEmail: string | null
    customerName: string | null
  }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { data: membership } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!membership) throw new Error('No team')

    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        estimate_id: estimateId,
        team_id: membership.team_id,
        created_by: user.id,
        deposit_pct: opts.depositPct,
        deposit_amount: opts.depositAmount,
        total_amount: opts.totalAmount,
        status: 'pending',
        customer_email: opts.customerEmail,
        customer_name: opts.customerName,
        stripe_payment_intent_id: null,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    setLinks(prev => [data as PaymentLink, ...prev])
    return data as PaymentLink
  }

  async function deleteLink(id: string) {
    const supabase = createClient()
    await supabase.from('payment_links').delete().eq('id', id)
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  return { links, loading, createLink, deleteLink, reload: load }
}
