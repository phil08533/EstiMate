'use client'

import { useState } from 'react'
import { Plus, Trash2, TrendingDown, TrendingUp, DollarSign, Download } from 'lucide-react'
import { useExpenses } from '@/lib/hooks/useExpenses'
import { useRevenue } from '@/lib/hooks/useRevenue'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import PageHelp from '@/components/ui/PageHelp'
import type { ExpenseCategory, PaymentMethod } from '@/lib/types'

type FinanceTab = 'overview' | 'revenue' | 'expenses'

const CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'materials', label: 'Materials', color: 'bg-green-100 text-green-800' },
  { value: 'labor', label: 'Labor', color: 'bg-blue-100 text-blue-800' },
  { value: 'equipment', label: 'Equipment', color: 'bg-orange-100 text-orange-800' },
  { value: 'fuel', label: 'Fuel', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'insurance', label: 'Insurance', color: 'bg-purple-100 text-purple-800' },
  { value: 'marketing', label: 'Marketing', color: 'bg-pink-100 text-pink-800' },
  { value: 'office', label: 'Office', color: 'bg-gray-100 text-gray-800' },
  { value: 'utilities', label: 'Utilities', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'subcontractor', label: 'Subcontractor', color: 'bg-teal-100 text-teal-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-600' },
]

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash', check: 'Check', card: 'Card', bank_transfer: 'Bank Transfer', other: 'Other',
}

function catColor(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat)?.color ?? 'bg-gray-100 text-gray-600'
}
function catLabel(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function groupByMonth<T>(items: T[], getDate: (item: T) => string): [string, T[]][] {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const key = getDate(item).slice(0, 7)
    ;(map[key] = map[key] ?? []).push(item)
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function FinancesPage() {
  const { expenses, loading: expLoading, addExpense, deleteExpense } = useExpenses()
  const { payments, loading: revLoading, totalRevenue } = useRevenue()
  const [tab, setTab] = useState<FinanceTab>('overview')
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('materials')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [saving, setSaving] = useState(false)

  const loading = expLoading || revLoading

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  const byCategory = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  const groupedExpenses = groupByMonth(expenses, e => e.expense_date)
  const groupedRevenue = groupByMonth(payments, p => p.payment_date)

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    const amt = parseFloat(amount)
    if (!desc.trim() || !amt || amt <= 0) return
    setSaving(true)
    await addExpense({
      description: desc.trim(),
      amount: amt,
      category,
      expense_date: date,
      vendor: vendor || null,
      receipt_path: null,
      notes: null,
    })
    setSaving(false)
    setDesc(''); setAmount(''); setVendor('')
    setShowForm(false)
  }

  function exportRevenue() {
    const rows = [['Date', 'Amount', 'Method', 'Notes']]
    for (const p of [...payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date)))
      rows.push([p.payment_date, p.amount.toFixed(2), METHOD_LABELS[p.payment_method], p.notes ?? ''])
    downloadCSV('revenue.csv', rows)
  }

  function exportExpenses() {
    const rows = [['Date', 'Description', 'Category', 'Vendor', 'Amount']]
    for (const e of [...expenses].sort((a, b) => b.expense_date.localeCompare(a.expense_date)))
      rows.push([e.expense_date, e.description, catLabel(e.category), e.vendor ?? '', e.amount.toFixed(2)])
    downloadCSV('expenses.csv', rows)
  }

  if (loading) return <><TopBar title="Finances" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Finances" />
      <div className="pb-28">
        {/* Tab bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
          {(['overview', 'revenue', 'expenses'] as FinanceTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-4">
          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              {/* P&L Summary */}
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">P&L Overview</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-green-700 font-medium">Revenue</p>
                    <p className="font-bold text-green-800 text-sm">{fmt(totalRevenue)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-red-600 font-medium">Expenses</p>
                    <p className="font-bold text-red-700 text-sm">{fmt(totalExpenses)}</p>
                  </div>
                  <div className={`rounded-xl p-3 text-center ${netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <DollarSign className={`w-5 h-5 mx-auto mb-1 ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
                    <p className={`text-xs font-medium ${netProfit >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Net</p>
                    <p className={`font-bold text-sm ${netProfit >= 0 ? 'text-blue-800' : 'text-orange-700'}`}>{fmt(netProfit)}</p>
                  </div>
                </div>
              </div>

              {/* Category breakdown */}
              {Object.keys(byCategory).length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expenses by Category</p>
                  <div className="space-y-2">
                    {(Object.entries(byCategory) as [ExpenseCategory, number][])
                      .sort((a, b) => b[1] - a[1])
                      .map(([cat, total]) => (
                        <div key={cat} className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0 ${catColor(cat)}`}>
                            {catLabel(cat)}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${totalExpenses > 0 ? (total / totalExpenses) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 flex-shrink-0">{fmt(total)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── REVENUE ── */}
          {tab === 'revenue' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-2xl font-bold text-green-800">{fmt(totalRevenue)}</p>
                  <p className="text-xs text-green-600">{payments.length} payments received</p>
                </div>
                {payments.length > 0 && (
                  <button
                    onClick={exportRevenue}
                    className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-white border border-green-300 rounded-lg px-3 py-1.5 active:bg-green-50"
                  >
                    <Download className="w-3.5 h-3.5" />CSV
                  </button>
                )}
              </div>

              {payments.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <p>No payments recorded yet.</p>
                  <p className="mt-1">Record payments on the Payments tab of each estimate.</p>
                </div>
              )}

              {groupedRevenue.map(([month, items]) => {
                const monthTotal = items.reduce((s, p) => s + p.amount, 0)
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <h3 className="text-sm font-semibold text-gray-500">{formatMonth(month)}</h3>
                      <span className="text-sm font-bold text-green-600">{fmt(monthTotal)}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map(p => (
                        <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <DollarSign className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{fmt(p.amount)}</p>
                            <p className="text-xs text-gray-400">{METHOD_LABELS[p.payment_method]} · {p.payment_date}</p>
                            {p.notes && <p className="text-xs text-gray-500 truncate">{p.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* ── EXPENSES ── */}
          {tab === 'expenses' && (
            <>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-2xl font-bold text-red-700">{fmt(totalExpenses)}</p>
                  <p className="text-xs text-red-500">{expenses.length} expense entries</p>
                </div>
                {expenses.length > 0 && (
                  <button
                    onClick={exportExpenses}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded-lg px-3 py-1.5 active:bg-red-50"
                  >
                    <Download className="w-3.5 h-3.5" />CSV
                  </button>
                )}
              </div>

              {showForm ? (
                <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                  <p className="font-semibold text-gray-900">Add Expense</p>
                  <input
                    autoFocus
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Description"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      type="number"
                      inputMode="decimal"
                      placeholder="Amount ($)"
                      className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      type="date"
                      className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    value={vendor}
                    onChange={e => setVendor(e.target.value)}
                    placeholder="Vendor (optional)"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Category</p>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(c.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            category === c.value ? 'bg-blue-600 text-white border-blue-600' : `${c.color} border-transparent`
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" loading={saving} disabled={!desc.trim() || !amount} className="flex-1">Add</Button>
                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium active:bg-gray-50"
                >
                  <Plus className="w-5 h-5" />
                  Add expense
                </button>
              )}

              {groupedExpenses.map(([month, items]) => {
                const monthTotal = items.reduce((s, e) => s + e.amount, 0)
                return (
                  <div key={month}>
                    <div className="flex items-center justify-between px-1 mb-2">
                      <h3 className="text-sm font-semibold text-gray-500">{formatMonth(month)}</h3>
                      <span className="text-sm font-bold text-red-600">{fmt(monthTotal)}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map(e => (
                        <div key={e.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold flex-shrink-0 ${catColor(e.category)}`}>
                            {catLabel(e.category)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{e.description}</p>
                            {e.vendor && <p className="text-xs text-gray-400 truncate">{e.vendor}</p>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{fmt(e.amount)}</p>
                          <button onClick={() => deleteExpense(e.id)} className="p-1.5 text-gray-400 active:text-red-500 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}

              {expenses.length === 0 && !showForm && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-gray-500 font-medium">No expenses yet</p>
                  <p className="text-gray-400 text-sm mt-1">Track materials, fuel, equipment, and more</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-4">
          <PageHelp
            title="Finances"
            intro="Track all money in (revenue from payments on estimates) and money out (expenses you log here). The Overview tab shows your P&L."
            steps={[
              'Revenue is pulled automatically from payments recorded on your estimates.',
              'Add expenses on the Expenses tab — pick a category, amount, date, and vendor.',
              'The Overview tab shows total revenue, expenses, and net profit with a category breakdown.',
              'Use Analytics in Settings for charts and YTD numbers.',
            ]}
            tips={[
              'Record expenses regularly — even small ones add up and reduce your tax burden.',
              'Log equipment fuel and repairs under the correct categories for accurate reporting.',
              'Payments on estimates automatically flow into your revenue total.',
            ]}
          />
        </div>
      </div>
    </>
  )
}
