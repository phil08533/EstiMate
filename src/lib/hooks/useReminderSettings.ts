'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ReminderSettings } from '@/lib/types'

async function getTeamId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
  return data?.team_id ?? null
}

const DEFAULTS: Omit<ReminderSettings, 'id' | 'team_id' | 'created_at' | 'updated_at'> = {
  is_enabled: true,
  reminder_days_before: [1],
  send_email: true,
  send_sms: false,
  message_template: null,
}

export function useReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const teamId = await getTeamId()
    if (!teamId) { setLoading(false); return }
    const supabase = createClient()
    const { data } = await supabase
      .from('reminder_settings')
      .select('*')
      .eq('team_id', teamId)
      .single()
    setSettings(data as ReminderSettings | null)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save(updates: Partial<Omit<ReminderSettings, 'id' | 'team_id' | 'created_at' | 'updated_at'>>) {
    const teamId = await getTeamId()
    if (!teamId) return
    const supabase = createClient()
    const payload = { ...DEFAULTS, ...settings, ...updates, team_id: teamId }
    const { data } = await supabase
      .from('reminder_settings')
      .upsert(payload, { onConflict: 'team_id' })
      .select().single()
    if (data) setSettings(data as ReminderSettings)
  }

  return { settings, loading, save, reload: load }
}
