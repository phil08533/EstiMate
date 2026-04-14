'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Crown, Pencil, Check, X } from 'lucide-react'
import { useTeam } from '@/lib/hooks/useTeam'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import ShareLinkCard from '@/components/team/ShareLinkCard'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function TeamPage() {
  const { team, members, loading, renameTeam, inviteMember, removeMember } = useTeam()
  const { user } = useAuth()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSent, setInviteSent] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleRename() {
    if (!newName.trim()) return
    setBusy(true)
    try {
      await renameTeam(newName.trim())
      setEditingName(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename')
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

        {/* Team name */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Team name</p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false) }}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleRename} disabled={busy} className="p-2 text-green-600 active:bg-gray-100 rounded-lg disabled:opacity-50">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingName(false)} className="p-2 text-gray-400 active:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{team?.name ?? 'My Team'}</h2>
              <button
                onClick={() => { setNewName(team?.name ?? ''); setEditingName(true) }}
                className="p-2 text-gray-400 active:bg-gray-100 rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
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
              {m.role === 'owner' && <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />}
              {m.user_id !== user?.id && team?.owner_id === user?.id && (
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
        {team && <ShareLinkCard teamId={team.id} />}
      </div>

      {/* Invite modal */}
      <Modal
        open={showInvite}
        onClose={() => { setShowInvite(false); setInviteSent(false); setInviteEmail(''); setError('') }}
        title="Invite member"
      >
        {inviteSent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">📬</div>
            <p className="font-semibold text-gray-900">Invite sent!</p>
            <p className="text-gray-500 text-sm mt-1">
              They&apos;ll get a link to join your team.
            </p>
            <Button variant="secondary" className="mt-4 mx-auto" onClick={() => { setInviteSent(false); setInviteEmail('') }}>
              Invite another
            </Button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" loading={busy} className="w-full">Send invite</Button>
          </form>
        )}
      </Modal>
    </>
  )
}
