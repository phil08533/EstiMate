'use client'

import { useState } from 'react'
import { Plus, Trash2, TrendingDown } from 'lucide-react'
import { useExpenses } from '@/lib/hooks/useExpenses'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import type { ExpenseCategory } from '@/lib/types'

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

function catColor(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat)?.color ?? 'bg-gray-100 text-gray-600'
}
function catLabel(cat: ExpenseCategory) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function groupByMonth(expenses: ReturnType<typeof useExpenses>['expenses']) {
  const map: Record<string, typeof expenses> = {}
  for (const e of expenses) {
    const key = e.expense_date.slice(0, 7) // YYYY-MM
    ;(map[key] = map[key] ?? []).push(e)
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function FinancesPage() {
  const { expenses, loading, addExpense, deleteExpense } = useExpenses()
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('materials')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [vendor, setVendor] = useState('')
  const [saving, setSaving] = useState(false)

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Breakdown by category
  const byCategory = expenses.reduce<Partial<Record<ExpenseCategory, number>>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  const grouped = groupByMonth(expenses)

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

  if (loading) return <><TopBar title="Finances" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Finances" />
      <div className="p-4 space-y-4 pb-28">

        {/* Summary card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Expense Overview</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{fmt(totalExpenses)}</p>
              <p className="text-xs text-gray-400">Total expenses · {expenses.length} entries</p>
            </div>
          </div>

          {Object.keys(byCategory).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.entries(byCategory) as [ExpenseCategory, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([cat, total]) => (
                  <div key={cat} className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${catColor(cat)}`}>
                    {catLabel(cat)}: {fmt(total)}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add expense */}
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

        {/* Grouped by month */}
        {grouped.map(([month, items]) => {
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
      </div>
    </>
  )
}
