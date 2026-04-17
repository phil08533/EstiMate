'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Team, TeamMember, Profile } from '@/lib/types'

export interface TeamMemberWithProfile extends TeamMember {
  profile: Profile
}

export function useTeam() {
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMemberWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      const name = user.user_metadata?.full_name
        ? `${user.user_metadata.full_name}'s Team`
        : user.email
          ? `${user.email.split('@')[0]}'s Team`
          : 'My Team'

      const { data: newTeam } = await supabase
        .from('teams')
        .insert({ name, owner_id: user.id })
        .select()
        .single()

      if (newTeam) {
        await supabase.from('team_members').insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'owner',
        })
        await load()
      } else {
        setLoading(false)
      }
      return
    }

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single()

    setTeam(teamData)

    const { data: membersData } = await supabase
      .from('team_members')
      .select('*, profile:profiles(*)')
      .eq('team_id', membership.team_id)

    setMembers(
      (membersData ?? []).map((m: TeamMember & { profile: Profile }) => ({
        ...m,
        profile: m.profile,
      }))
    )
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  async function renameTeam(name: string) {
    const supabase = createClient()
    if (!team) throw new Error('No team')
    const { error } = await supabase.from('teams').update({ name }).eq('id', team.id)
    if (error) throw error
    setTeam(prev => prev ? { ...prev, name } : null)
  }

  async function inviteMember(email: string, role: 'member' | 'viewer' = 'member') {
    const supabase = createClient()
    if (!team) throw new Error('No team')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?team=${team.id}&role=${role}`,
      },
    })
    if (error) throw error
  }

  async function removeMember(userId: string) {
    const supabase = createClient()
    if (!team) throw new Error('No team')
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId)
    await load()
  }

  async function changeMemberRole(userId: string, role: 'member' | 'viewer') {
    const supabase = createClient()
    if (!team) throw new Error('No team')
    await supabase
      .from('team_members')
      .update({ role })
      .eq('team_id', team.id)
      .eq('user_id', userId)
    setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role } : m))
  }

  return { team, members, loading, renameTeam, inviteMember, removeMember, changeMemberRole, reload: load }
}
