'use client'

import { useState } from 'react'
import { Plus, Trash2, DollarSign } from 'lucide-react'
import { usePayments } from '@/lib/hooks/usePayments'
import { useLineItems } from '@/lib/hooks/useLineItems'
import { useCompanySettings } from '@/lib/hooks/useCompanySettings'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import type { PaymentMethod } from '@/lib/types'

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export default function PaymentsSection({ estimateId }: { estimateId: string }) {
  const { payments, loading: pLoading, totalPaid, addPayment, deletePayment } = usePayments(estimateId)
  const { lineItems, loading: liLoading } = useLineItems(estimateId)
  const { settings } = useCompanySettings()

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  if (pLoading || liLoading) return <div className="flex justify-center py-4"><Spinner /></div>

  const taxRate = settings?.tax_rate ?? 0
  const subtotal = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const taxableSubtotal = lineItems.filter(li => !li.tax_exempt).reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const totalDue = subtotal + taxableSubtotal * (taxRate / 100)
  const balance = totalDue - totalPaid

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) return
    setSaving(true)
    await addPayment({ amount: amt, payment_method: method, payment_date: date, notes: notes || null })
    setSaving(false)
    setAmount(''); setNotes('')
    setShowForm(false)
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      {totalDue > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Invoice total</span>
            <span>{formatMoney(totalDue)}</span>
          </div>
          <div className="flex justify-between text-sm text-green-700">
            <span>Paid</span>
            <span>-{formatMoney(totalPaid)}</span>
          </div>
          <div className={`flex justify-between font-bold text-base pt-1 border-t border-gray-200 ${balance <= 0 ? 'text-green-700' : 'text-gray-900'}`}>
            <span>Balance due</span>
            <span>{balance <= 0 ? 'Paid in full' : formatMoney(balance)}</span>
          </div>
        </div>
      )}

      {/* Payment list */}
      {payments.map(p => (
        <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{formatMoney(p.amount)}</p>
            <p className="text-xs text-gray-400">{METHODS.find(m => m.value === p.payment_method)?.label} · {p.payment_date}</p>
            {p.notes && <p className="text-xs text-gray-500 truncate">{p.notes}</p>}
          </div>
          <button onClick={() => deletePayment(p.id)} className="p-1.5 text-gray-400 active:text-red-500 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add payment form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Amount ($)</label>
              <input
                autoFocus
                value={amount}
                onChange={e => setAmount(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Date</label>
              <input
                value={date}
                onChange={e => setDate(e.target.value)}
                type="date"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Payment method</label>
            <div className="flex flex-wrap gap-2">
              {METHODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    method === m.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <Button type="submit" loading={saving} disabled={!amount} className="flex-1" size="sm">Record payment</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1" size="sm">Cancel</Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium active:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Record payment
        </button>
      )}
    </div>
  )
}
