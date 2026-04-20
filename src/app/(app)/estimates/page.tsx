'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import EstimateCard from '@/components/estimates/EstimateCard'
import EstimateFiltersBar from '@/components/estimates/EstimateFilters'
import Spinner from '@/components/ui/Spinner'
import PageHelp from '@/components/ui/PageHelp'
import type { EstimateFilters } from '@/lib/types'

const FREE_LIMIT = 25

const DEFAULT_FILTERS: EstimateFilters = {
  status: 'all',
  sortField: 'updated_at',
  sortDirection: 'desc',
  search: '',
}

export default function EstimatesPage() {
  const [filters, setFilters] = useState<EstimateFilters>(DEFAULT_FILTERS)
  const { estimates, loading } = useEstimates(filters)
  const { subscription } = useSubscription()
  const [totalCount, setTotalCount] = useState<number | null>(null)

  useEffect(() => {
    if (subscription?.plan !== 'free') return
    async function fetchCount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
      if (!member) return
      const { count } = await supabase
        .from('estimates').select('id', { count: 'exact', head: true }).eq('team_id', member.team_id)
      setTotalCount(count ?? 0)
    }
    fetchCount()
  }, [subscription?.plan])

  const isAtLimit = subscription?.plan === 'free' && totalCount !== null && totalCount >= FREE_LIMIT
  const isNearLimit = subscription?.plan === 'free' && totalCount !== null && totalCount >= 20 && totalCount < FREE_LIMIT

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Estimates</h1>
          <EstimateFiltersBar filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Free tier banner */}
      {(isAtLimit || isNearLimit) && (
        <div className={`mx-4 mt-3 rounded-xl px-4 py-3 flex items-start gap-3 ${isAtLimit ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isAtLimit ? 'text-red-500' : 'text-amber-500'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${isAtLimit ? 'text-red-700' : 'text-amber-700'}`}>
              {isAtLimit ? `Free limit reached (${totalCount}/${FREE_LIMIT})` : `${totalCount}/${FREE_LIMIT} free estimates used`}
            </p>
            <p className={`text-xs mt-0.5 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`}>
              {isAtLimit ? 'Upgrade to Pro for unlimited estimates.' : 'Upgrade to Pro before you run out.'}
            </p>
          </div>
          <Link href="/settings/billing" className={`text-xs font-bold flex-shrink-0 ${isAtLimit ? 'text-red-600' : 'text-amber-600'}`}>
            Upgrade
          </Link>
        </div>
      )}

      {/* List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500 font-medium">No estimates yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap + to add your first estimate</p>
          </div>
        ) : (
          estimates.map(estimate => (
            <EstimateCard key={estimate.id} estimate={estimate} />
          ))
        )}
        <PageHelp
          title="Estimates"
          intro="Estimates are the core of your workflow — capture customer info in the field, build a quote, track status, and record payments."
          steps={[
            'Tap + to create a new estimate — name, phone, and address are all you need.',
            'Open an estimate and add line items to build the quote.',
            'Change the status from Need to Estimate → Sent → Sold as the job progresses.',
            'Record payments on the estimate when you collect money.',
            'View the invoice/PDF to print or save for the customer.',
          ]}
          tips={[
            'Set a follow-up date so you get a reminder badge if you haven\'t heard back.',
            'Set the service date to see the job on the Schedule calendar.',
            'Use the camera button to attach before/after photos — great for social posts.',
          ]}
        />
      </div>

      {/* FAB */}
      <Link
        href={isAtLimit ? '/settings/billing' : '/estimates/new'}
        className={`fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors z-30 ${
          isAtLimit ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white active:bg-blue-700'
        }`}
        aria-label={isAtLimit ? 'Upgrade to add more estimates' : 'New estimate'}
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
