'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Crown } from 'lucide-react'
import { useTeam } from '@/lib/hooks/useTeam'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import ShareLinkCard from '@/components/team/ShareLinkCard'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'

export default function TeamPage() {
  const { team, members, loading, createTeam, inviteMember, removeMember } = useTeam()
  const { user } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!teamName.trim()) return
    setBusy(true)
    setError('')
    try {
      await createTeam(teamName.trim())
      setShowCreate(false)
      setTeamName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setBusy(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setBusy(true)
    setError('')
    try {
      await inviteMember(inviteEmail.trim())
      setInviteSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Team" />
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Team" />
      <div className="p-4 space-y-4">
        {!team ? (
          /* No team yet */
          <div className="text-center py-12">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-gray-700 font-semibold mb-1">No team yet</p>
            <p className="text-gray-500 text-sm mb-6">Create a team to start tracking estimates and collaborate with others.</p>
            <Button onClick={() => setShowCreate(true)} className="mx-auto">Create team</Button>
          </div>
        ) : (
          <>
            {/* Team name */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Team</p>
              <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
            </div>

            {/* Members list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Members ({members.length})</h3>
                <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>
              {members.map(m => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {(m.profile.full_name ?? m.profile.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{m.profile.full_name ?? 'No name'}</p>
                    <p className="text-xs text-gray-400 truncate">{m.profile.email}</p>
                  </div>
                  {m.role === 'owner' && <Crown className="w-4 h-4 text-amber-500" />}
                  {m.user_id !== user?.id && team.owner_id === user?.id && (
                    <button
                      onClick={() => removeMember(m.user_id)}
                      className="p-1.5 text-gray-400 active:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Share links */}
            <ShareLinkCard teamId={team.id} />
          </>
        )}
      </div>

      {/* Create team modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create team">
        <form onSubmit={handleCreateTeam} className="space-y-4">
          <Input label="Team name" placeholder="My Flooring Co." value={teamName} onChange={e => setTeamName(e.target.value)} autoFocus />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <Button type="submit" loading={busy} className="w-full">Create team</Button>
        </form>
      </Modal>

      {/* Invite modal */}
      <Modal open={showInvite} onClose={() => { setShowInvite(false); setInviteSent(false); setInviteEmail(''); setError('') }} title="Invite member">
        {inviteSent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">📬</div>
            <p className="font-semibold text-gray-900">Invite sent!</p>
            <p className="text-gray-500 text-sm mt-1">They&apos;ll get a magic link to join your team.</p>
            <Button variant="secondary" className="mt-4 mx-auto" onClick={() => { setInviteSent(false); setInviteEmail('') }}>
              Invite another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input label="Email address" type="email" placeholder="colleague@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} autoFocus />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">Send invite</Button>
          </form>
        )}
      </Modal>
    </>
  )
}
