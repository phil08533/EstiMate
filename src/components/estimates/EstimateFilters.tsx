'use client'

import { Search, ArrowUpDown } from 'lucide-react'
import { ALL_STATUSES, getStatusLabel } from '@/lib/utils/status'
import type { EstimateFilters, SortField } from '@/lib/types'

interface Props {
  filters: EstimateFilters
  onChange: (f: EstimateFilters) => void
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: 'Recently updated' },
  { value: 'created_at', label: 'Date created' },
  { value: 'customer_name', label: 'Customer name' },
  { value: 'total_area', label: 'Total area' },
  { value: 'status', label: 'Status' },
]

export default function EstimateFiltersBar({ filters, onChange }: Props) {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search customers..."
          value={filters.search ?? ''}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        <button
          onClick={() => onChange({ ...filters, status: 'all' })}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !filters.status || filters.status === 'all'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          All
        </button>
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => onChange({ ...filters, status: s })}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filters.status === s
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {getStatusLabel(s)}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <select
          value={filters.sortField}
          onChange={e => onChange({ ...filters, sortField: e.target.value as SortField })}
          className="flex-1 text-sm text-gray-700 bg-transparent border-none focus:outline-none"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => onChange({
            ...filters,
            sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
          })}
          className="text-xs text-gray-500 bg-gray-100 rounded-lg px-2 py-1 active:bg-gray-200"
        >
          {filters.sortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>
      </div>
    </div>
  )
}
