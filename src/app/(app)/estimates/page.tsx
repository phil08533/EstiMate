'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import EstimateCard from '@/components/estimates/EstimateCard'
import EstimateFiltersBar from '@/components/estimates/EstimateFilters'
import Spinner from '@/components/ui/Spinner'
import type { EstimateFilters } from '@/lib/types'

const DEFAULT_FILTERS: EstimateFilters = {
  status: 'all',
  sortField: 'updated_at',
  sortDirection: 'desc',
  search: '',
}

export default function EstimatesPage() {
  const [filters, setFilters] = useState<EstimateFilters>(DEFAULT_FILTERS)
  const { estimates, loading } = useEstimates(filters)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Estimates</h1>
          <EstimateFiltersBar filters={filters} onChange={setFilters} />
        </div>
      </div>

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
      </div>

      {/* FAB */}
      <Link
        href="/estimates/new"
        className="fixed bottom-24 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center active:bg-blue-700 transition-colors z-30"
        aria-label="New estimate"
      >
        <Plus className="w-7 h-7" />
      </Link>
    </div>
  )
}
