'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) loadProfile(user)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadProfile(user: User) {
    const supabase = createClient()

    const { data } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name
          ?? user.email?.split('@')[0]
          ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })
      .select()
      .single()

    if (!data) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(existing)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }

  async function updateProfile(updates: { full_name?: string }) {
    const supabase = createClient()
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
  }

  return { user, profile, loading, signOut, updateProfile }
}
