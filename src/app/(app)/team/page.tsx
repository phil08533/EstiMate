'use client'

import { useState } from 'react'
import { UserPlus, Trash2, Crown, Pencil, Check, X, Eye, Users } from 'lucide-react'
import { useTeam } from '@/lib/hooks/useTeam'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import ShareLinkCard from '@/components/team/ShareLinkCard'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

function Initials({ name, email }: { name: string | null; email: string | null }) {
  const letter = (name ?? email ?? '?')[0].toUpperCase()
  return (
    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm">
      {letter}
    </div>
  )
}

export default function TeamPage() {
  const { team, members, loading, renameTeam, inviteMember, removeMember, changeMemberRole } = useTeam()
  const { user, profile, updateProfile } = useAuth()

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)

  // Team name editing
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'viewer'>('member')
  const [inviteSent, setInviteSent] = useState(false)
  const [inviteBusy, setInviteBusy] = useState(false)

  const [error, setError] = useState('')

  const isOwner = team?.owner_id === user?.id

  async function handleSaveProfile() {
    if (!newProfileName.trim()) return
    setProfileBusy(true)
    try {
      await updateProfile({ full_name: newProfileName.trim() })
      setEditingProfile(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setProfileBusy(false)
    }
  }

  async function handleRename() {
    if (!newName.trim()) return
    setRenameBusy(true)
    try {
      await renameTeam(newName.trim())
      setEditingName(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename')
    } finally {
      setRenameBusy(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviteBusy(true)
    setError('')
    try {
      await inviteMember(inviteEmail.trim(), inviteRole)
      setInviteSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setInviteBusy(false)
    }
  }

  function closeInvite() {
    setShowInvite(false)
    setInviteSent(false)
    setInviteEmail('')
    setInviteRole('member')
    setError('')
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
      <div className="p-4 space-y-4 pb-28">

        {/* My Account */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-3">My Account</p>
          {editingProfile ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newProfileName}
                onChange={e => setNewProfileName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveProfile(); if (e.key === 'Escape') setEditingProfile(false) }}
                placeholder="Your name"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleSaveProfile} disabled={profileBusy} className="p-2 text-green-600 active:bg-gray-100 rounded-lg disabled:opacity-50">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingProfile(false)} className="p-2 text-gray-400 active:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {(profile?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{profile?.full_name ?? 'No name set'}</p>
                <p className="text-sm text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setNewProfileName(profile?.full_name ?? ''); setEditingProfile(true) }}
                className="p-2 text-gray-400 active:bg-gray-100 rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

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
              <button onClick={handleRename} disabled={renameBusy} className="p-2 text-green-600 active:bg-gray-100 rounded-lg disabled:opacity-50">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => setEditingName(false)} className="p-2 text-gray-400 active:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{team?.name ?? 'My Team'}</h2>
              {isOwner && (
                <button
                  onClick={() => { setNewName(team?.name ?? ''); setEditingName(true) }}
                  className="p-2 text-gray-400 active:bg-gray-100 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Members ({members.length})</h3>
            {isOwner && (
              <Button variant="secondary" size="sm" onClick={() => setShowInvite(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Invite
              </Button>
            )}
          </div>
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
              <Initials name={m.profile.full_name} email={m.profile.email} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{m.profile.full_name ?? 'No name'}</p>
                <p className="text-xs text-gray-400 truncate">{m.profile.email}</p>
              </div>

              {/* Role indicator */}
              {m.role === 'owner' ? (
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
              ) : isOwner ? (
                <button
                  onClick={() => changeMemberRole(m.user_id, m.role === 'member' ? 'viewer' : 'member')}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    m.role === 'member'
                      ? 'bg-blue-100 text-blue-700 active:bg-blue-200'
                      : 'bg-gray-100 text-gray-500 active:bg-gray-200'
                  }`}
                  title={m.role === 'member' ? 'Can edit — tap to make Viewer' : 'View only — tap to make Member'}
                >
                  {m.role === 'member' ? (
                    <><Users className="w-3 h-3" /> Member</>
                  ) : (
                    <><Eye className="w-3 h-3" /> Viewer</>
                  )}
                </button>
              ) : (
                <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  m.role === 'member' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {m.role === 'member' ? <><Users className="w-3 h-3" /> Member</> : <><Eye className="w-3 h-3" /> Viewer</>}
                </span>
              )}

              {m.user_id !== user?.id && isOwner && (
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
      <Modal open={showInvite} onClose={closeInvite} title="Invite member">
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

            {/* Role selector */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Role</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInviteRole('member')}
                  className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 transition-colors text-left ${
                    inviteRole === 'member'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Member</span>
                  </div>
                  <span className="text-xs text-gray-500">Can add &amp; edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole('viewer')}
                  className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 transition-colors text-left ${
                    inviteRole === 'viewer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-gray-900 text-sm">Viewer</span>
                  </div>
                  <span className="text-xs text-gray-500">Read only</span>
                </button>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" loading={inviteBusy} className="w-full">Send invite</Button>
          </form>
        )}
      </Modal>
    </>
  )
}
