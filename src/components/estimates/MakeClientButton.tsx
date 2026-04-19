'use client'

import { useState } from 'react'
import { UserPlus, CheckCircle, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCustomers } from '@/lib/hooks/useCRM'
import type { Estimate } from '@/lib/types'

export default function MakeClientButton({ estimate }: { estimate: Estimate }) {
  const router = useRouter()
  const { addCustomer } = useCustomers()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(estimate.customer_id)

  if (customerId) {
    return (
      <button
        onClick={() => router.push(`/crm/customers/${customerId}`)}
        className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 active:bg-green-100"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        View in CRM
        <ExternalLink className="w-3 h-3 opacity-60" />
      </button>
    )
  }

  async function handleMakeClient() {
    setLoading(true)
    const newCustomer = await addCustomer({
      full_name: estimate.customer_name,
      email: estimate.customer_email,
      phone: estimate.customer_phone,
      address: estimate.customer_address,
      city: null,
      state: null,
      zip: null,
      tags: null,
      notes: estimate.comments,
      source: 'estimate',
      is_active: true,
    })
    if (newCustomer) {
      setCustomerId(newCustomer.id)
      setDone(true)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleMakeClient}
      disabled={loading}
      className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors ${
        done
          ? 'text-green-700 bg-green-50 border border-green-200'
          : 'text-violet-700 bg-violet-50 border border-violet-200 active:bg-violet-100'
      }`}
    >
      {done ? (
        <>
          <CheckCircle className="w-3.5 h-3.5" />
          Added to CRM
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          {loading ? 'Adding…' : 'Make Client'}
        </>
      )}
    </button>
  )
}
