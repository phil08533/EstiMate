'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Measurement, MeasurementInsert } from '@/lib/types'

export function useMeasurements(estimateId: string) {
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('measurements')
      .select('*')
      .eq('estimate_id', estimateId)
      .order('created_at', { ascending: true })
    setMeasurements(data ?? [])
    setLoading(false)
  }, [estimateId])

  useEffect(() => { load() }, [load])

  async function addMeasurement(input: Omit<MeasurementInsert, 'estimate_id'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('measurements')
      .insert({ ...input, estimate_id: estimateId })
      .select()
      .single()
    if (error) throw error
    setMeasurements(prev => [...prev, data])
    return data as Measurement
  }

  async function deleteMeasurement(measurementId: string) {
    const supabase = createClient()
    await supabase.from('measurements').delete().eq('id', measurementId)
    setMeasurements(prev => prev.filter(m => m.id !== measurementId))
  }

  const totalArea = measurements.reduce((sum, m) => sum + (m.area ?? 0), 0)

  return { measurements, loading, addMeasurement, deleteMeasurement, totalArea, reload: load }
}
