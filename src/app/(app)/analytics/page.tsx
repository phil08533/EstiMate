'use client'

import { useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ClipboardList, Target, Users, Tag } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useRevenue } from '@/lib/hooks/useRevenue'
import { useExpenses } from '@/lib/hooks/useExpenses'
import { useLeads } from '@/lib/hooks/useCRM'
import { useServiceCategories } from '@/lib/hooks/useServiceCategories'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import PageHelp from '@/components/ui/PageHelp'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function pct(n: number, d: number) {
  if (!d) return '0%'
  return `${Math.round((n / d) * 100)}%`
}

function MonthBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max((value / max) * 100, 2) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-16 text-right flex-shrink-0">{fmt(value)}</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { estimates, loading: eLoad } = useEstimates()
  const { payments, loading: rLoad } = useRevenue()
  const { expenses, loading: expLoad } = useExpenses()
  const { leads, loading: lLoad } = useLeads()
  const { categories } = useServiceCategories()

  const loading = eLoad || rLoad || expLoad || lLoad

  const stats = useMemo(() => {
    const now = new Date()
    const thisYear = now.getFullYear()
    const ytdRevenue = payments
      .filter(p => new Date(p.payment_date).getFullYear() === thisYear)
      .reduce((s, p) => s + p.amount, 0)
    const ytdExpenses = expenses
      .filter(e => new Date(e.expense_date).getFullYear() === thisYear)
      .reduce((s, e) => s + e.amount, 0)
    const ytdNet = ytdRevenue - ytdExpenses

    const totalEstimates = estimates.length
    const wonEstimates = estimates.filter(e => e.status === 'sold').length
    const winRate = totalEstimates > 0 ? (wonEstimates / totalEstimates) : 0

    const leadsWon = leads.filter(l => l.stage === 'won').length
    const leadWinRate = leads.length > 0 ? (leadsWon / leads.length) : 0

    // Revenue by month (last 6 months)
    const monthlyRevenue: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const value = payments
        .filter(p => p.payment_date.startsWith(key))
        .reduce((s, p) => s + p.amount, 0)
      monthlyRevenue.push({ label, value })
    }

    // Monthly expenses (last 6)
    const monthlyExpenses: { label: string; value: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const value = expenses
        .filter(e => e.expense_date.startsWith(key))
        .reduce((s, e) => s + e.amount, 0)
      monthlyExpenses.push({ label, value })
    }

    // Estimates by status
    const byStatus = {
      need_to_estimate: estimates.filter(e => e.status === 'need_to_estimate').length,
      sent:  estimates.filter(e => e.status === 'sent').length,
      sold:  estimates.filter(e => e.status === 'sold').length,
      lost:  estimates.filter(e => e.status === 'lost').length,
    }

    const avgEstimateValue = wonEstimates > 0
      ? payments.reduce((s, p) => s + p.amount, 0) / wonEstimates
      : 0

    const maxMonthly = Math.max(...monthlyRevenue.map(m => m.value), 1)
    const maxExpMonthly = Math.max(...monthlyExpenses.map(m => m.value), 1)

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)

    // Jobs and revenue by service category
    const byCategoryId: Record<string, { jobs: number; sold: number }> = {}
    for (const e of estimates) {
      const cid = e.category_id ?? '__none__'
      if (!byCategoryId[cid]) byCategoryId[cid] = { jobs: 0, sold: 0 }
      byCategoryId[cid].jobs++
      if (e.status === 'sold') byCategoryId[cid].sold++
    }

    return {
      ytdRevenue, ytdExpenses, ytdNet,
      totalRevenue,
      totalEstimates, wonEstimates, winRate,
      leadsWon, leadWinRate,
      byStatus, avgEstimateValue,
      monthlyRevenue, monthlyExpenses,
      maxMonthly, maxExpMonthly,
      byCategoryId,
    }
  }, [estimates, payments, expenses, leads])

  if (loading) return <><TopBar title="Analytics" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Analytics" />
      <div className="p-4 space-y-4 pb-28">

        {/* YTD Summary */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Year-to-Date {new Date().getFullYear()}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-700 font-medium">Revenue</p>
              <p className="font-bold text-green-800 text-sm">{fmt(stats.ytdRevenue)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-red-600 font-medium">Expenses</p>
              <p className="font-bold text-red-700 text-sm">{fmt(stats.ytdExpenses)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${stats.ytdNet >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <DollarSign className={`w-5 h-5 mx-auto mb-1 ${stats.ytdNet >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
              <p className={`text-xs font-medium ${stats.ytdNet >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Net Profit</p>
              <p className={`font-bold text-sm ${stats.ytdNet >= 0 ? 'text-blue-800' : 'text-orange-700'}`}>{fmt(stats.ytdNet)}</p>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <ClipboardList className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalEstimates}</p>
            <p className="text-xs text-gray-400">Total estimates</p>
            <div className="mt-2 space-y-1">
              {[
                { label: 'Pending', count: stats.byStatus.need_to_estimate, color: 'bg-amber-400' },
                { label: 'Sent',    count: stats.byStatus.sent,             color: 'bg-blue-400' },
                { label: 'Won',     count: stats.byStatus.sold,             color: 'bg-green-400' },
                { label: 'Lost',    count: stats.byStatus.lost,             color: 'bg-red-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-gray-500 flex-1">{row.label}</span>
                  <span className="font-semibold text-gray-700">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <Target className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{pct(stats.wonEstimates, stats.totalEstimates)}</p>
            <p className="text-xs text-gray-400">Estimate win rate</p>
            <div className="mt-3 bg-gray-100 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.winRate * 100}%` }} />
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-400">Lead conversion</p>
              <p className="font-bold text-gray-700">{pct(stats.leadsWon, leads.length)}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <DollarSign className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{fmt(stats.avgEstimateValue)}</p>
            <p className="text-xs text-gray-400">Avg job value</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
            <p className="text-xs text-gray-400">Total leads</p>
            <p className="text-sm font-semibold text-green-700 mt-1">{stats.leadsWon} won</p>
          </div>
        </div>

        {/* Revenue by month */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Revenue — Last 6 Months</p>
          <div className="space-y-2.5">
            {stats.monthlyRevenue.map(m => (
              <MonthBar key={m.label} label={m.label} value={m.value} max={stats.maxMonthly} />
            ))}
          </div>
        </div>

        {/* Expenses by month */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expenses — Last 6 Months</p>
          <div className="space-y-2.5">
            {stats.monthlyExpenses.map(m => (
              <MonthBar key={m.label} label={m.label} value={m.value} max={stats.maxExpMonthly} />
            ))}
          </div>
        </div>

        {/* Service category breakdown */}
        {categories.length > 0 && Object.keys(stats.byCategoryId).some(k => k !== '__none__') && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jobs by Service Category</p>
            </div>
            <div className="space-y-2.5">
              {categories.map(cat => {
                const data = stats.byCategoryId[cat.id] ?? { jobs: 0, sold: 0 }
                if (data.jobs === 0) return null
                const winPct = data.jobs > 0 ? Math.round((data.sold / data.jobs) * 100) : 0
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-gray-700 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{data.sold}/{data.jobs} won</span>
                    <div className="w-20 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${winPct}%`, backgroundColor: cat.color }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right flex-shrink-0">{winPct}%</span>
                  </div>
                )
              })}
              {stats.byCategoryId['__none__']?.jobs > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-500 flex-1">Uncategorized</span>
                  <span className="text-xs text-gray-400">{stats.byCategoryId['__none__'].sold}/{stats.byCategoryId['__none__'].jobs} won</span>
                  <div className="w-20 bg-gray-100 rounded-full h-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-400 w-8 text-right">—</span>
                </div>
              )}
            </div>
          </div>
        )}

        <PageHelp
          title="Analytics"
          intro="Analytics gives you a bird's-eye view of your business performance — revenue, expenses, win rates, and pipeline health all in one place."
          steps={[
            'YTD numbers pull from payments recorded on estimates (revenue) and logged expenses.',
            'Win rate = sold estimates ÷ total estimates — aim for 50%+ on leads you quote.',
            'Lead conversion rate tracks how many CRM leads turn into won jobs.',
            'Revenue and expense bars show month-by-month trends for the last 6 months.',
          ]}
          tips={[
            'Low win rate? Your pricing or follow-up may need work — check the Resources tips.',
            'High expenses in one category? Drill in to Finances for the breakdown.',
            'Average job value helps you set minimum job sizes to stay profitable.',
          ]}
        />

      </div>
    </>
  )
}
