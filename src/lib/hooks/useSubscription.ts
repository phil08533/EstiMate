'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: member } = await supabase
      .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
    if (!member) { setLoading(false); return }
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('team_id', member.team_id)
      .single()
    setSubscription(data as Subscription | null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const isProOrBusiness = subscription?.plan === 'pro' || subscription?.plan === 'business'
  const isBusiness = subscription?.plan === 'business'
  const isTrialing = subscription?.status === 'trialing'
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 0

  return { subscription, loading, isProOrBusiness, isBusiness, isTrialing, trialDaysLeft }
}
