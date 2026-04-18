'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CompanySettings, CompanySettingsInsert } from '@/lib/types'

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
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
      .from('company_settings')
      .select('*')
      .eq('team_id', teamId)
      .single()

    setSettings(data as CompanySettings | null)
    setLoading(false)
  }, [getTeamId])

  useEffect(() => { load() }, [load])

  async function saveSettings(updates: Partial<Omit<CompanySettingsInsert, 'team_id'>>) {
    const supabase = createClient()
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')

    if (settings) {
      const { data } = await supabase
        .from('company_settings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .select().single()
      setSettings(data as CompanySettings)
    } else {
      const { data } = await supabase
        .from('company_settings')
        .insert({ team_id: teamId, ...updates } as CompanySettingsInsert)
        .select().single()
      setSettings(data as CompanySettings)
    }
  }

  async function uploadLogo(file: File): Promise<string> {
    const supabase = createClient()
    const teamId = await getTeamId()
    if (!teamId) throw new Error('No team')
    const ext = file.name.split('.').pop()
    const path = `${teamId}/logo/logo.${ext}`
    const { error } = await supabase.storage
      .from('estimate-media')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return path
  }

  return { settings, loading, saveSettings, uploadLogo, reload: load }
}
