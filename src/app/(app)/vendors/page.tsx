'use client'

import { useState } from 'react'
import { Plus, Phone, Mail, Globe, Trash2, Pencil, Search, Store } from 'lucide-react'
import { useVendors } from '@/lib/hooks/useVendors'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Vendor, VendorCategory, VendorInsert } from '@/lib/types'

const CATEGORIES: { value: VendorCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'nursery',      label: '🌱 Nursery / Plants' },
  { value: 'stone',        label: '🪨 Stone / Aggregate' },
  { value: 'lumber',       label: '🪵 Lumber / Wood' },
  { value: 'landscaping',  label: '🌿 Landscaping Supply' },
  { value: 'rental',       label: '🚜 Equipment Rental' },
  { value: 'fuel',         label: '⛽ Fuel / Oil' },
  { value: 'hardware',     label: '🔧 Hardware' },
  { value: 'other',        label: '📦 Other' },
]

const CATEGORY_COLORS: Record<string, string> = {
  nursery:     'bg-green-100 text-green-800',
  stone:       'bg-gray-100 text-gray-800',
  lumber:      'bg-orange-100 text-orange-800',
  landscaping: 'bg-emerald-100 text-emerald-800',
  rental:      'bg-yellow-100 text-yellow-800',
  fuel:        'bg-red-100 text-red-800',
  hardware:    'bg-blue-100 text-blue-800',
  other:       'bg-purple-100 text-purple-800',
}

const EMPTY: Omit<VendorInsert, 'team_id' | 'created_by'> = {
  name: '', category: null, contact_name: null,
  phone: null, email: null, address: null, website: null, notes: null, is_active: true,
}

export default function VendorsPage() {
  const { vendors, loading, addVendor, updateVendor, deleteVendor } = useVendors()
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<VendorCategory | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.name.toLowerCase().includes(q) ||
      (v.contact_name ?? '').toLowerCase().includes(q) ||
      (v.phone ?? '').includes(q)
    const matchCat = !catFilter || v.category === catFilter
    return matchSearch && matchCat
  })

  function openAdd() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(v: Vendor) {
    setEditing(v)
    setForm({
      name: v.name, category: v.category, contact_name: v.contact_name,
      phone: v.phone, email: v.email, address: v.address,
      website: v.website, notes: v.notes, is_active: v.is_active,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editing) {
      await updateVendor(editing.id, form)
    } else {
      await addVendor(form)
    }
    setSaving(false)
    setModalOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this vendor?')) return
    await deleteVendor(id)
  }

  if (loading) return <><TopBar title="Vendors" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar
        title="Vendors"
        right={
          <button onClick={openAdd} className="p-1.5 rounded-lg bg-blue-600 text-white active:bg-blue-700">
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      <div className="p-4 space-y-3 pb-28">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCatFilter(c.value as VendorCategory | '')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                catFilter === c.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              {vendors.length === 0 ? 'No vendors yet. Add your first supplier.' : 'No vendors match your search.'}
            </p>
            {vendors.length === 0 && (
              <button onClick={openAdd} className="mt-3 text-blue-600 text-sm font-medium">
                + Add vendor
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(v => (
              <div key={v.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{v.name}</p>
                      {v.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[v.category] ?? 'bg-gray-100 text-gray-700'}`}>
                          {CATEGORIES.find(c => c.value === v.category)?.label ?? v.category}
                        </span>
                      )}
                    </div>
                    {v.contact_name && <p className="text-sm text-gray-500 mt-0.5">{v.contact_name}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 active:text-blue-600 rounded-lg">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v.id)} className="p-1.5 text-gray-400 active:text-red-500 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  {v.phone && (
                    <a href={`tel:${v.phone}`} className="flex items-center gap-1.5 text-blue-600 text-sm">
                      <Phone className="w-3.5 h-3.5" /> {v.phone}
                    </a>
                  )}
                  {v.email && (
                    <a href={`mailto:${v.email}`} className="flex items-center gap-1.5 text-blue-600 text-sm">
                      <Mail className="w-3.5 h-3.5" /> {v.email}
                    </a>
                  )}
                  {v.website && (
                    <a href={v.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 text-sm">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>

                {v.notes && (
                  <p className="mt-2 text-xs text-gray-400 line-clamp-2">{v.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'}>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Vendor name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="ABC Stone Supply"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
            <select
              value={form.category ?? ''}
              onChange={e => setForm(f => ({ ...f, category: (e.target.value || null) as VendorCategory | null }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category…</option>
              {CATEGORIES.slice(1).map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Contact name</label>
            <input
              value={form.contact_name ?? ''}
              onChange={e => setForm(f => ({ ...f, contact_name: e.target.value || null }))}
              placeholder="John Smith"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone ?? ''}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value || null }))}
                placeholder="(555) 000-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm(f => ({ ...f, email: e.target.value || null }))}
                placeholder="supplier@co.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Website</label>
            <input
              value={form.website ?? ''}
              onChange={e => setForm(f => ({ ...f, website: e.target.value || null }))}
              placeholder="https://example.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))}
              placeholder="Pricing notes, delivery hours…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
