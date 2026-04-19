'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ClipboardList, DollarSign, AlertCircle, CalendarCheck,
  TrendingUp, Plus, Clock, ChevronRight, Users,
} from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useRevenue } from '@/lib/hooks/useRevenue'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import { getStatusColor } from '@/lib/utils/status'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { estimates, loading } = useEstimates()
  const { payments, loading: rLoad } = useRevenue()

  const today = new Date().toISOString().split('T')[0]
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  const stats = useMemo(() => {
    const todayJobs = estimates.filter(
      e => e.service_date === today || e.follow_up_date === today
    )
    const overdueFollowUps = estimates.filter(
      e => e.follow_up_date && e.follow_up_date < today && e.status !== 'lost'
    )
    const openEstimates = estimates.filter(
      e => e.status === 'need_to_estimate' || e.status === 'sent'
    )
    const thisMonth = new Date().toISOString().slice(0, 7)
    const monthRevenue = payments
      .filter(p => p.payment_date.startsWith(thisMonth))
      .reduce((s, p) => s + p.amount, 0)
    const pendingQuotes = estimates.filter(e => e.status === 'sent')
    const recentEstimates = [...estimates]
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 5)
    const quotesPendingResponse = estimates.filter(
      e => e.quote_token && !e.customer_response && e.status === 'sent'
    )
    return {
      todayJobs, overdueFollowUps, openEstimates,
      monthRevenue, pendingQuotes, recentEstimates, quotesPendingResponse,
    }
  }, [estimates, payments, today])

  if (loading || rLoad) {
    return (
      <>
        <TopBar title="Dashboard" />
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="p-4 space-y-4 pb-28">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
          <p className="text-blue-200 text-sm">Good {getGreeting()},</p>
          <p className="text-xl font-bold mt-0.5">{firstName} 👋</p>
          <p className="text-blue-200 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert: overdue follow-ups */}
        {stats.overdueFollowUps.length > 0 && (
          <Link href="/estimates?filter=followup" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 active:bg-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-800 text-sm">
                {stats.overdueFollowUps.length} overdue follow-up{stats.overdueFollowUps.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-500">Tap to review</p>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </Link>
        )}

        {/* Alert: quotes awaiting customer response */}
        {stats.quotesPendingResponse.length > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">
                {stats.quotesPendingResponse.length} quote{stats.quotesPendingResponse.length > 1 ? 's' : ''} awaiting response
              </p>
              <p className="text-xs text-amber-600">Sent to customer, no reply yet</p>
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-xs text-gray-400">This month</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{fmt(stats.monthRevenue)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Revenue collected</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <span className="text-xs text-gray-400">Active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.openEstimates.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Open estimates</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <CalendarCheck className="w-5 h-5 text-purple-500" />
              <span className="text-xs text-gray-400">Today</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayJobs.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Jobs scheduled</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-xs text-gray-400">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingQuotes.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">Quotes sent</p>
          </div>
        </div>

        {/* Today's jobs */}
        {stats.todayJobs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-900 text-sm">Today&apos;s Jobs</p>
              <CalendarCheck className="w-4 h-4 text-purple-400" />
            </div>
            {stats.todayJobs.map(est => (
              <Link
                key={est.id}
                href={`/estimates/${est.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDotColor(est.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{est.customer_name}</p>
                  {est.customer_address && (
                    <p className="text-xs text-gray-400 truncate">{est.customer_address}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/estimates/new"
            className="flex flex-col items-center gap-2 bg-blue-600 text-white rounded-2xl py-4 active:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-semibold">New Job</span>
          </Link>
          <Link
            href="/crm"
            className="flex flex-col items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-2xl py-4 active:bg-gray-50"
          >
            <Users className="w-5 h-5 text-violet-500" />
            <span className="text-xs font-semibold">CRM</span>
          </Link>
          <Link
            href="/schedule"
            className="flex flex-col items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-2xl py-4 active:bg-gray-50"
          >
            <CalendarCheck className="w-5 h-5 text-green-500" />
            <span className="text-xs font-semibold">Schedule</span>
          </Link>
        </div>

        {/* Recent estimates */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">Recent Estimates</p>
            <Link href="/estimates" className="text-xs text-blue-600 font-medium">View all</Link>
          </div>
          {stats.recentEstimates.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-400 text-sm">No estimates yet.</p>
              <Link href="/estimates/new" className="text-blue-600 text-sm font-medium">Create your first one →</Link>
            </div>
          ) : (
            stats.recentEstimates.map(est => (
              <Link
                key={est.id}
                href={`/estimates/${est.id}`}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 active:bg-gray-50"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getDotColor(est.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{est.customer_name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(est.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(est.status)}`}>
                  {est.status.replace('_', ' ')}
                </span>
              </Link>
            ))
          )}
        </div>

      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getDotColor(status: string) {
  switch (status) {
    case 'need_to_estimate': return 'bg-amber-400'
    case 'sent':             return 'bg-blue-400'
    case 'sold':             return 'bg-green-400'
    case 'lost':             return 'bg-red-400'
    default:                 return 'bg-gray-400'
  }
}
