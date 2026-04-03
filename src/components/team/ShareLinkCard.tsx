'use client'

import { useState, useEffect } from 'react'
import { Link2, Copy, Check, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateShareToken, getShareUrl } from '@/lib/utils/share'
import Button from '@/components/ui/Button'
import type { ShareToken } from '@/lib/types'

export default function ShareLinkCard({ teamId }: { teamId: string }) {
  const [tokens, setTokens] = useState<ShareToken[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadTokens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId])

  async function loadTokens() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('share_tokens')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
    setTokens(data ?? [])
    setLoading(false)
  }

  async function createLink() {
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const token = generateShareToken()
    await supabase.from('share_tokens').insert({
      team_id: teamId,
      created_by: user.id,
      token,
      expires_at: null,
    })
    await loadTokens()
    setCreating(false)
  }

  async function deleteToken(id: string) {
    const supabase = createClient()
    await supabase.from('share_tokens').delete().eq('id', id)
    setTokens(prev => prev.filter(t => t.id !== id))
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(getShareUrl(token))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Share links</h3>
        </div>
        <Button variant="secondary" size="sm" loading={creating} onClick={createLink}>
          + New link
        </Button>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Anyone with a share link can view all estimates (read-only).
      </p>
      {tokens.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3">No share links yet</p>
      ) : (
        <div className="space-y-2">
          {tokens.map(t => (
            <div key={t.id} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <code className="flex-1 text-xs text-gray-600 truncate">{getShareUrl(t.token)}</code>
              <button
                onClick={() => copyLink(t.token)}
                className="p-1.5 text-gray-400 active:text-blue-600 rounded-lg"
              >
                {copied === t.token ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => deleteToken(t.id)}
                className="p-1.5 text-gray-400 active:text-red-500 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
