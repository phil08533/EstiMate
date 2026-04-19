'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Estimate } from '@/lib/types'

export function useCustomerEstimates(customerId: string) {
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!customerId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('estimates')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    setEstimates((data as Estimate[]) ?? [])
    setLoading(false)
  }, [customerId])

  useEffect(() => { load() }, [load])

  return { estimates, loading }
}
