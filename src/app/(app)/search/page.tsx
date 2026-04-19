'use client'

import { useState, useMemo } from 'react'
import { Search, ClipboardList, Users, StickyNote, Building2 } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCustomers } from '@/lib/hooks/useCRM'
import { useNotes } from '@/lib/hooks/useNotes'
import { useVendors } from '@/lib/hooks/useVendors'
import { getStatusColor } from '@/lib/utils/status'

type ResultKind = 'estimate' | 'customer' | 'note' | 'vendor'

interface SearchResult {
  id: string
  kind: ResultKind
  title: string
  subtitle: string
  href: string
  badge?: string
  badgeColor?: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { estimates } = useEstimates()
  const { customers } = useCustomers()
  const { notes } = useNotes()
  const { vendors } = useVendors()

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const out: SearchResult[] = []

    for (const e of estimates) {
      if (
        e.customer_name.toLowerCase().includes(q) ||
        e.customer_phone?.toLowerCase().includes(q) ||
        e.customer_email?.toLowerCase().includes(q) ||
        e.customer_address?.toLowerCase().includes(q) ||
        e.comments?.toLowerCase().includes(q)
      ) {
        out.push({
          id: e.id,
          kind: 'estimate',
          title: e.customer_name,
          subtitle: e.customer_address ?? e.customer_email ?? e.customer_phone ?? 'No address',
          href: `/estimates/${e.id}`,
          badge: e.status.replace('_', ' '),
          badgeColor: getStatusColor(e.status),
        })
      }
    }

    for (const c of customers) {
      if (
        c.full_name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.address?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q)
      ) {
        out.push({
          id: c.id,
          kind: 'customer',
          title: c.full_name,
          subtitle: c.phone ?? c.email ?? c.address ?? 'No contact',
          href: `/crm/customers/${c.id}`,
          badge: 'Client',
          badgeColor: 'bg-violet-100 text-violet-700',
        })
      }
    }

    for (const n of notes) {
      if (
        n.title?.toLowerCase().includes(q) ||
        n.content?.toLowerCase().includes(q)
      ) {
        out.push({
          id: n.id,
          kind: 'note',
          title: n.title ?? 'Untitled note',
          subtitle: n.content ? n.content.slice(0, 80) : 'No content',
          href: `/notes/${n.id}`,
          badge: 'Note',
          badgeColor: 'bg-amber-100 text-amber-700',
        })
      }
    }

    for (const v of vendors) {
      if (
        v.name.toLowerCase().includes(q) ||
        v.contact_name?.toLowerCase().includes(q) ||
        v.phone?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      ) {
        out.push({
          id: v.id,
          kind: 'vendor',
          title: v.name,
          subtitle: v.contact_name ?? v.phone ?? v.category ?? 'Vendor',
          href: `/vendors`,
          badge: 'Vendor',
          badgeColor: 'bg-teal-100 text-teal-700',
        })
      }
    }

    return out
  }, [query, estimates, customers, notes, vendors])

  const KindIcon: Record<ResultKind, React.ReactNode> = {
    estimate: <ClipboardList className="w-4 h-4 text-blue-500" />,
    customer: <Users className="w-4 h-4 text-violet-500" />,
    note: <StickyNote className="w-4 h-4 text-amber-500" />,
    vendor: <Building2 className="w-4 h-4 text-teal-500" />,
  }

  return (
    <>
      <TopBar title="Search" />
      <div className="p-4 space-y-3 pb-28">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
          <input
            autoFocus
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search estimates, clients, notes, vendors…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {query.trim().length > 0 && query.trim().length < 2 && (
          <p className="text-sm text-gray-400 text-center py-4">Keep typing…</p>
        )}

        {query.trim().length >= 2 && results.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No results for &ldquo;{query.trim()}&rdquo;</p>
            <p className="text-gray-400 text-sm mt-1">Try a different name, address, or phone number</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 border-b border-gray-100">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((r, i) => (
              <Link
                key={`${r.kind}-${r.id}`}
                href={r.href}
                className={`flex items-center gap-3 px-4 py-3 active:bg-gray-50 ${i < results.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <span className="flex-shrink-0">{KindIcon[r.kind]}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                </div>
                {r.badge && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${r.badgeColor}`}>
                    {r.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {!query && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Search everything</p>
            <p className="text-gray-400 text-sm mt-1">Estimates, clients, notes &amp; vendors</p>
          </div>
        )}
      </div>
    </>
  )
}
