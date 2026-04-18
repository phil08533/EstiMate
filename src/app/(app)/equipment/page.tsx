'use client'

import { useState } from 'react'
import { Plus, Wrench, AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import { useEquipment } from '@/lib/hooks/useEquipment'
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

export default function EquipmentPage() {
  const { equipment, loading, addEquipment } = useEquipment()
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
          <button
            onClick={() => setShowAdd(true)}
            className="p-1.5 rounded-lg text-blue-600 active:bg-blue-50 font-medium text-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <div className="p-4 space-y-4 pb-28">

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
                {items.map(item => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4">
        <PageHelp
          title="Equipment"
          intro="Track every piece of equipment — mowers, trucks, trailers, tools. Log maintenance and repairs, and see depreciation to plan replacements."
          steps={[
            'Tap + to add equipment — name is required, make/model/year/price are optional.',
            'Open any item to see its depreciation schedule based on purchase price and useful life.',
            'Add log entries for maintenance, repairs, and fuel to track total operating cost.',
            'Change status to Maintenance when equipment is being serviced, or Retired when replaced.',
            'Edit the Useful Life and Salvage Value fields to tune the depreciation calculation.',
          ]}
          tips={[
            'Equipment with 85%+ depreciation shows a replacement warning — budget ahead.',
            'Log all repair costs to see true cost of ownership per piece of equipment.',
            'Use the serial number field for warranty claims and insurance documentation.',
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

function EquipmentCard({ item }: {
  item: Equipment
}) {
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
