'use client'

import { useState } from 'react'
import { Send, Copy, Check, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Estimate } from '@/lib/types'

function generateToken() {
  const arr = new Uint8Array(18)
  crypto.getRandomValues(arr)
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
}

export default function SendQuoteButton({ estimate, onTokenGenerated }: {
  estimate: Estimate
  onTokenGenerated?: (token: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [quoteUrl, setQuoteUrl] = useState<string | null>(
    estimate.quote_token ? `${window.location.origin}/quote/${estimate.quote_token}` : null
  )

  async function generateQuoteLink() {
    setLoading(true)
    const token = estimate.quote_token ?? generateToken()
    const supabase = createClient()
    await supabase.from('estimates').update({ quote_token: token }).eq('id', estimate.id)
    const url = `${window.location.origin}/quote/${token}`
    setQuoteUrl(url)
    onTokenGenerated?.(token)

    // Try to send email if customer has one
    if (estimate.customer_email) {
      await fetch('/api/quote/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimateId: estimate.id, token }),
      })
    }
    setLoading(false)
  }

  async function copyLink() {
    if (!quoteUrl) return
    await navigator.clipboard.writeText(quoteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasResponse = !!estimate.customer_response

  return (
    <div className="flex flex-col gap-2">
      {quoteUrl ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 min-w-0">
            <Link2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{quoteUrl}</span>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-blue-600 text-white rounded-xl active:bg-blue-700 flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : null}

      {!hasResponse && (
        <button
          onClick={generateQuoteLink}
          disabled={loading}
          className="flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Generating…' : quoteUrl ? 'Resend Quote' : 'Send Quote to Customer'}
        </button>
      )}

      {hasResponse && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
          estimate.customer_response === 'accepted'           ? 'bg-green-50 text-green-700 border border-green-200' :
          estimate.customer_response === 'declined'          ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          <span>
            {estimate.customer_response === 'accepted'           ? '✅ Customer accepted the quote' :
             estimate.customer_response === 'declined'          ? '❌ Customer declined the quote' :
             '✏️ Customer requested modifications'}
          </span>
        </div>
      )}

      {estimate.customer_response_notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <p className="text-xs text-gray-500 font-medium mb-0.5">Customer note:</p>
          <p className="text-sm text-gray-700">{estimate.customer_response_notes}</p>
        </div>
      )}
    </div>
  )
}
