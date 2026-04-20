'use client'

import { useState, useMemo } from 'react'
import { Plus, Wrench, AlertCircle, CheckCircle, XCircle, ChevronRight, Calendar, X, ChevronLeft, ChevronDown } from 'lucide-react'
import { useEquipment } from '@/lib/hooks/useEquipment'
import { useEquipmentSchedule } from '@/lib/hooks/useEquipmentSchedule'
import { useEstimates } from '@/lib/hooks/useEstimates'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import PageHelp from '@/components/ui/PageHelp'
import type { Equipment, EquipmentStatus } from '@/lib/types'

const STATUS_CONFIG: Record<EquipmentStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'text-green-700 bg-green-100', icon: CheckCircle },
  maintenance: { label: 'Maintenance', color: 'text-amber-700 bg-amber-100', icon: AlertCircle },
  retired: { label: 'Retired', color: 'text-gray-500 bg-gray-100', icon: XCircle },
}

function weekStartOf(d: Date) {
  const day = new Date(d)
  const dow = day.getDay()
  day.setDate(day.getDate() - dow)
  return day.toISOString().split('T')[0]
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function fmtDay(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Schedule tab ─────────────────────────────────────────────────────────────
function ScheduleTab() {
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()))
  const weekEnd = addDays(weekStart, 6)
  const { assignments, loading, addAssignment, removeAssignment } = useEquipmentSchedule(weekStart, weekEnd)
  const { equipment } = useEquipment()
  const { estimates } = useEstimates()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ equipment_id: '', estimate_id: '', assigned_date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const byDay = useMemo(() => {
    const map: Record<string, typeof assignments> = {}
    for (const a of assignments) {
      if (!map[a.assigned_date]) map[a.assigned_date] = []
      map[a.assigned_date].push(a)
    }
    return map
  }, [assignments])

  const activeEquipment = equipment.filter(e => e.status === 'active')
  const openEstimates = estimates.filter(e => !e.completed_at)

  async function handleAdd(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.equipment_id || !form.estimate_id || !form.assigned_date) return
    setSaving(true)
    try {
      await addAssignment({ equipment_id: form.equipment_id, estimate_id: form.estimate_id, assigned_date: form.assigned_date, notes: form.notes || undefined })
      setForm({ equipment_id: '', estimate_id: '', assigned_date: '', notes: '' })
      setShowAdd(false)
    } catch {
      // duplicate — silently ignore
    } finally {
      setSaving(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      {/* Week nav */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3">
        <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-1.5 rounded-lg active:bg-gray-100">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{fmtDay(weekStart)} — {fmtDay(weekEnd)}</p>
          <button onClick={() => setWeekStart(weekStartOf(new Date()))} className="text-xs text-blue-600 font-medium">This week</button>
        </div>
        <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-1.5 rounded-lg active:bg-gray-100">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day rows */}
      {days.map(day => {
        const rows = byDay[day] ?? []
        const isToday = day === today
        return (
          <div key={day} className={`bg-white border rounded-2xl overflow-hidden ${isToday ? 'border-blue-300' : 'border-gray-200'}`}>
            <div className={`px-4 py-2.5 flex items-center justify-between ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
              <p className={`text-sm font-semibold ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{fmtDay(day)}{isToday && ' · Today'}</p>
              <span className="text-xs text-gray-400">{rows.length} item{rows.length !== 1 ? 's' : ''}</span>
            </div>
            {rows.length > 0 && (
              <div className="divide-y divide-gray-100">
                {rows.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.equipment_name ?? 'Equipment'}</p>
                      <p className="text-xs text-gray-400 truncate">{a.customer_name ?? 'Job'}</p>
                    </div>
                    <button onClick={() => removeAssignment(a.id)} className="p-1.5 text-gray-300 active:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {rows.length === 0 && (
              <p className="text-xs text-gray-400 px-4 py-2.5">No equipment assigned</p>
            )}
          </div>
        )
      })}

      {/* Assign button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-2xl active:bg-blue-700"
      >
        <Plus className="w-5 h-5" />
        Assign Equipment
      </button>

      {/* Assign modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Assign equipment">
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Equipment</label>
            <div className="relative">
              <select
                value={form.equipment_id}
                onChange={e => setForm(p => ({ ...p, equipment_id: e.target.value }))}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select equipment…</option>
                {activeEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Job / Estimate</label>
            <div className="relative">
              <select
                value={form.estimate_id}
                onChange={e => setForm(p => ({ ...p, estimate_id: e.target.value }))}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select job…</option>
                {openEstimates.map(est => <option key={est.id} value={est.id}>{est.customer_name}{est.service_date ? ` — ${est.service_date}` : ''}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <Input
            label="Date"
            type="date"
            value={form.assigned_date}
            onChange={e => setForm(p => ({ ...p, assigned_date: e.target.value }))}
            required
          />
          <Input
            label="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Any special instructions"
          />
          <Button type="submit" loading={saving} className="w-full">Save assignment</Button>
        </form>
      </Modal>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function EquipmentPage() {
  const { equipment, loading, addEquipment } = useEquipment()
  const [tab, setTab] = useState<'fleet' | 'schedule'>('fleet')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', make: '', model: '', year: '', serial_number: '',
    purchase_date: '', purchase_price: '', description: '', notes: '',
    status: 'active' as EquipmentStatus,
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await addEquipment({
      name: form.name.trim(),
      make: form.make || null,
      model: form.model || null,
      year: form.year ? parseInt(form.year) : null,
      serial_number: form.serial_number || null,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      description: form.description || null,
      notes: form.notes || null,
      status: form.status,
      category: null,
      useful_life_years: null,
      salvage_value: null,
    })
    setSaving(false)
    setForm({ name: '', make: '', model: '', year: '', serial_number: '', purchase_date: '', purchase_price: '', description: '', notes: '', status: 'active' })
    setShowAdd(false)
  }

  const grouped = {
    active: equipment.filter(e => e.status === 'active'),
    maintenance: equipment.filter(e => e.status === 'maintenance'),
    retired: equipment.filter(e => e.status === 'retired'),
  }

  if (loading) return <><TopBar title="Equipment" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar
        title="Equipment"
        backHref="/settings"
        right={
          tab === 'fleet' ? (
            <button onClick={() => setShowAdd(true)} className="p-1.5 rounded-lg text-blue-600 active:bg-blue-50 font-medium text-sm">
              <Plus className="w-5 h-5" />
            </button>
          ) : undefined
        }
      />
      <div className="p-4 space-y-4 pb-28">

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {([['fleet', 'Fleet', Wrench], ['schedule', 'Schedule', Calendar]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'fleet' && (
          <>
            {equipment.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔧</div>
                <p className="text-gray-500 font-medium">No equipment yet</p>
                <p className="text-gray-400 text-sm mt-1">Track mowers, trucks, trailers, and tools</p>
                <Button className="mt-4 mx-auto" onClick={() => setShowAdd(true)}>Add first item</Button>
              </div>
            )}
            {(['active', 'maintenance', 'retired'] as EquipmentStatus[]).map(status => {
              const items = grouped[status]
              if (!items.length) return null
              const cfg = STATUS_CONFIG[status]
              return (
                <div key={status}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    {cfg.label} ({items.length})
                  </p>
                  <div className="space-y-2">
                    {items.map(item => <EquipmentCard key={item.id} item={item} />)}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {tab === 'schedule' && <ScheduleTab />}
      </div>

      <div className="px-4">
        <PageHelp
          title="Equipment"
          intro="Track every piece of equipment — mowers, trucks, trailers, tools. Use the Schedule tab to see what equipment is assigned to which job each day."
          steps={[
            'Tap + to add equipment — name is required, make/model/year/price are optional.',
            'Open any item to see its depreciation schedule and log maintenance costs.',
            'Use the Schedule tab to assign equipment to jobs by date.',
            'Change status to Maintenance when equipment is being serviced.',
          ]}
          tips={[
            'Equipment with 85%+ depreciation shows a replacement warning.',
            'Log all repair costs to track true cost of ownership.',
          ]}
        />
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add equipment">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input label="Name *" value={form.name} onChange={set('name')} placeholder="Zero-turn mower" autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Make" value={form.make} onChange={set('make')} placeholder="Hustler" />
            <Input label="Model" value={form.model} onChange={set('model')} placeholder="Raptor" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Year" type="number" value={form.year} onChange={set('year')} placeholder="2022" />
            <Input label="Serial #" value={form.serial_number} onChange={set('serial_number')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Purchase date" type="date" value={form.purchase_date} onChange={set('purchase_date')} />
            <Input label="Purchase price ($)" type="number" value={form.purchase_price} onChange={set('purchase_price')} />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={set('notes')} rows={2} />
          <Button type="submit" loading={saving} className="w-full">Add equipment</Button>
        </form>
      </Modal>
    </>
  )
}

function EquipmentCard({ item }: { item: Equipment }) {
  const cfg = STATUS_CONFIG[item.status]
  const Icon = cfg.icon
  return (
    <Link
      href={`/equipment/${item.id}`}
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 active:bg-gray-50"
    >
      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
        <Wrench className="w-5 h-5 text-orange-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400 truncate">
          {[item.year, item.make, item.model].filter(Boolean).join(' ')}
        </p>
      </div>
      <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold flex-shrink-0 ${cfg.color}`}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </Link>
  )
}
