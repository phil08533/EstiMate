'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, X, Search, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { useLineItems } from '@/lib/hooks/useLineItems'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { useEquipment } from '@/lib/hooks/useEquipment'
import { useCompanySettings } from '@/lib/hooks/useCompanySettings'
import { useTemplates } from '@/lib/hooks/useTemplates'
import Spinner from '@/components/ui/Spinner'
import type { EstimateLineItem, ServiceItem, LineItemCategory } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

type CatalogTab = 'labor' | 'equipment' | 'material' | 'subs' | 'other' | 'templates'

const CATEGORY_CFG: Record<LineItemCategory, { label: string; dot: string; header: string; text: string }> = {
  labor:     { label: 'Labor',     dot: 'bg-blue-500',   header: 'bg-blue-50 border-blue-200',   text: 'text-blue-700' },
  equipment: { label: 'Equipment', dot: 'bg-orange-500', header: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  material:  { label: 'Material',  dot: 'bg-green-500',  header: 'bg-green-50 border-green-200',  text: 'text-green-700' },
  subs:      { label: 'Subs',      dot: 'bg-purple-500', header: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  other:     { label: 'Other',     dot: 'bg-gray-400',   header: 'bg-gray-50 border-gray-200',    text: 'text-gray-600' },
}

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'labor',     label: 'Labor' },
  { id: 'equipment', label: 'Equip' },
  { id: 'material',  label: 'Material' },
  { id: 'subs',      label: 'Subs' },
  { id: 'other',     label: 'Other' },
  { id: 'templates', label: 'Templates' },
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// ─── Inline qty/price editor on a line item row ────────────────────────────────

function LineItemRow({ item, onUpdate, onDelete, defaultMarkup }: {
  item: EstimateLineItem
  onUpdate: (u: Partial<EstimateLineItem>) => Promise<void>
  onDelete: (id: string) => void
  defaultMarkup: number
}) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(item.quantity.toString())
  const [price, setPrice] = useState(item.unit_price.toString())
  const [cost, setCost] = useState(item.unit_cost > 0 ? item.unit_cost.toString() : '')
  const [markup, setMarkup] = useState(item.markup_pct > 0 ? item.markup_pct.toString() : defaultMarkup > 0 ? defaultMarkup.toString() : '')
  const [desc, setDesc] = useState(item.description)
  const cfg = CATEGORY_CFG[item.category] ?? CATEGORY_CFG.other

  const costNum = parseFloat(cost) || 0
  const markupNum = parseFloat(markup) || 0
  const priceNum = parseFloat(price) || 0
  const sellFromMarkup = costNum > 0 ? costNum * (1 + markupNum / 100) : 0
  const profitPerUnit = priceNum - costNum
  const marginPct = priceNum > 0 && costNum > 0 ? ((priceNum - costNum) / priceNum) * 100 : null

  function handleCostChange(v: string) {
    setCost(v)
    const c = parseFloat(v) || 0
    const m = parseFloat(markup) || 0
    if (c > 0 && m > 0) {
      setPrice((c * (1 + m / 100)).toFixed(2))
    }
  }

  function handleMarkupChange(v: string) {
    setMarkup(v)
    const c = parseFloat(cost) || 0
    const m = parseFloat(v) || 0
    if (c > 0 && m > 0) {
      setPrice((c * (1 + m / 100)).toFixed(2))
    }
  }

  function upcharge10() {
    const newMarkup = markupNum + 10
    setMarkup(newMarkup.toString())
    if (costNum > 0) setPrice((costNum * (1 + newMarkup / 100)).toFixed(2))
  }

  async function save() {
    await onUpdate({
      description: desc,
      quantity: parseFloat(qty) || 0,
      unit_price: parseFloat(price) || 0,
      unit_cost: parseFloat(cost) || 0,
      markup_pct: parseFloat(markup) || 0,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-white border border-blue-300 rounded-xl p-3 space-y-2">
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Qty</label>
            <input
              type="number" inputMode="decimal" value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Your cost ($)</label>
            <input
              type="number" inputMode="decimal" value={cost}
              onChange={e => handleCostChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Markup row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Markup (%)</label>
            <div className="flex gap-1">
              <input
                type="number" inputMode="decimal" value={markup}
                onChange={e => handleMarkupChange(e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={upcharge10}
                className="px-2 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold active:bg-amber-100 whitespace-nowrap"
              >+10%</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Sell price ($)</label>
            <input
              type="number" inputMode="decimal" value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Margin summary */}
        {costNum > 0 && priceNum > 0 && (
          <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${marginPct !== null && marginPct >= 30 ? 'bg-green-50 text-green-700' : marginPct !== null && marginPct >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
            <span>Cost {fmt(costNum)} → Sell {fmt(priceNum)}</span>
            <span className="font-bold">
              {marginPct !== null ? `${marginPct.toFixed(0)}% margin` : ''}
              {profitPerUnit > 0 ? ` (+${fmt(profitPerUnit)}/unit)` : ''}
            </span>
          </div>
        )}
        {costNum > 0 && markupNum > 0 && sellFromMarkup !== priceNum && (
          <button
            type="button"
            onClick={() => setPrice(sellFromMarkup.toFixed(2))}
            className="text-xs text-blue-600 underline"
          >
            Apply markup → {fmt(sellFromMarkup)}
          </button>
        )}

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg active:bg-blue-700">Save</button>
          <button onClick={() => setEditing(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg active:bg-gray-200">Cancel</button>
        </div>
      </div>
    )
  }

  const hasCost = item.unit_cost > 0
  const itemMargin = hasCost && item.unit_price > 0
    ? ((item.unit_price - item.unit_cost) / item.unit_price) * 100
    : null

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-gray-50"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.description}</p>
        <p className="text-xs text-gray-400">
          {item.quantity} {item.unit} × {fmt(item.unit_price)}
          {hasCost && (
            <span className="ml-1.5 text-gray-300">·</span>
          )}
          {hasCost && (
            <span className={`ml-1.5 font-medium ${itemMargin !== null && itemMargin >= 30 ? 'text-green-600' : itemMargin !== null && itemMargin >= 15 ? 'text-amber-500' : 'text-red-500'}`}>
              cost {fmt(item.unit_cost)} · {itemMargin !== null ? `${itemMargin.toFixed(0)}% margin` : ''}
            </span>
          )}
        </p>
      </div>
      <p className="text-sm font-bold text-gray-900 flex-shrink-0">{fmt(item.quantity * item.unit_price)}</p>
      <button
        onClick={e => { e.stopPropagation(); onDelete(item.id) }}
        className="p-1.5 text-gray-300 active:text-red-400 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </button>
  )
}

// ─── Catalog drawer ────────────────────────────────────────────────────────────

function CatalogDrawer({ open, onClose, onAdd, serviceItems, addServiceItem, templates, applyTemplate, saveAsTemplate, currentItemCount }: {
  open: boolean
  onClose: () => void
  onAdd: (item: { description: string; unit_price: number; unit: string; category: LineItemCategory; unit_cost?: number }) => void
  serviceItems: ServiceItem[]
  addServiceItem: (input: Omit<ServiceItem, 'id' | 'created_at' | 'team_id'>) => Promise<ServiceItem>
  templates: { id: string; name: string; items: { description: string; quantity: number; unit_price: number; unit: string; tax_exempt: boolean; sort_order: number }[] }[]
  applyTemplate: (id: string) => void
  saveAsTemplate: (name: string) => void
  currentItemCount: number
}) {
  const { employees } = useEmployees()
  const { equipment } = useEquipment()
  const [tab, setTab] = useState<CatalogTab>('labor')
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    if (!open) { setSearch(''); setShowNewForm(false); setShowSaveTemplate(false); setNewName(''); setNewCost(''); setNewPrice(''); setNewUnit('') }
  }, [open])

  const q = search.toLowerCase()

  // Labor: employees + service_items with category='labor'
  const laborItems = useMemo(() =>
    serviceItems.filter(i => i.category?.toLowerCase() === 'labor' && (!q || i.name.toLowerCase().includes(q))),
    [serviceItems, q]
  )
  const filteredEmployees = useMemo(() =>
    employees.filter(e => !q || `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)),
    [employees, q]
  )

  // Equipment: equipment table + service_items with category='equipment'
  const equipItems = useMemo(() =>
    serviceItems.filter(i => i.category?.toLowerCase() === 'equipment' && (!q || i.name.toLowerCase().includes(q))),
    [serviceItems, q]
  )
  const filteredEquipment = useMemo(() =>
    equipment.filter(e => e.status === 'active' && (!q || e.name.toLowerCase().includes(q))),
    [equipment, q]
  )

  const materialItems = useMemo(() =>
    serviceItems.filter(i => i.category?.toLowerCase() === 'material' && (!q || i.name.toLowerCase().includes(q))),
    [serviceItems, q]
  )
  const subsItems = useMemo(() =>
    serviceItems.filter(i => i.category?.toLowerCase() === 'subs' && (!q || i.name.toLowerCase().includes(q))),
    [serviceItems, q]
  )
  const otherItems = useMemo(() =>
    serviceItems.filter(i => {
      const cat = i.category?.toLowerCase()
      return (!cat || !['labor','equipment','material','subs'].includes(cat)) && (!q || i.name.toLowerCase().includes(q))
    }),
    [serviceItems, q]
  )

  const defaultUnit = tab === 'labor' ? 'hrs' : tab === 'equipment' ? 'days' : 'each'

  async function handleSaveNew() {
    if (!newName.trim()) return
    setSaving(true)
    const cat = (tab === 'templates' ? 'other' : tab) as LineItemCategory
    const item = await addServiceItem({
      name: newName.trim(),
      description: null,
      unit: newUnit || defaultUnit,
      default_price: parseFloat(newPrice) || 0,
      category: cat,
    })
    onAdd({ description: item.name, unit_price: item.default_price, unit: item.unit, category: cat, unit_cost: parseFloat(newCost) || 0 })
    setNewName(''); setNewCost(''); setNewPrice(''); setNewUnit('')
    setShowNewForm(false)
    setSaving(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" />
      {/* Sheet — takes up most of screen height */}
      <div
        className="bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <p className="font-bold text-gray-900 text-base">Add Items</p>
          <button onClick={onClose} className="p-1.5 text-gray-400 active:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search catalog…"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-2 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setShowNewForm(false) }}
              className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors ${
                tab === t.id ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 pb-6">

          {/* ── LABOR ── */}
          {tab === 'labor' && (
            <>
              {filteredEmployees.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 py-1">Your Team</p>
                  {filteredEmployees.map(emp => (
                    <button
                      key={emp.id}
                      onClick={() => onAdd({ description: `${emp.first_name} ${emp.last_name}`, unit_price: emp.pay_rate ?? 0, unit: 'hrs', category: 'labor' })}
                      className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-blue-50"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-gray-400 capitalize">{emp.role.replace('_', ' ')} · {emp.pay_rate ? `${fmt(emp.pay_rate)}/hr` : 'No rate set'}</p>
                      </div>
                      <Plus className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    </button>
                  ))}
                  {laborItems.length > 0 && <div className="border-t border-gray-100 my-1" />}
                </>
              )}
              {laborItems.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 py-1">Labor Catalog</p>
                  {laborItems.map(item => <CatalogItemRow key={item.id} item={item} onAdd={onAdd} />)}
                </>
              )}
              {filteredEmployees.length === 0 && laborItems.length === 0 && (
                <EmptyState label="No labor items" sub="Add generic labor rates below or go to Employees to set up your team." />
              )}
            </>
          )}

          {/* ── EQUIPMENT ── */}
          {tab === 'equipment' && (
            <>
              {filteredEquipment.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 py-1">Your Fleet</p>
                  {filteredEquipment.map(eq => (
                    <button
                      key={eq.id}
                      onClick={() => onAdd({ description: eq.name + (eq.model ? ` (${eq.model})` : ''), unit_price: 0, unit: 'days', category: 'equipment' })}
                      className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-orange-50"
                    >
                      <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 ml-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{eq.name}</p>
                        <p className="text-xs text-gray-400">{[eq.make, eq.model].filter(Boolean).join(' ') || 'Equipment'} · days</p>
                      </div>
                      <Plus className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    </button>
                  ))}
                  {equipItems.length > 0 && <div className="border-t border-gray-100 my-1" />}
                </>
              )}
              {equipItems.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 py-1">Equipment Catalog</p>
                  {equipItems.map(item => <CatalogItemRow key={item.id} item={item} onAdd={onAdd} />)}
                </>
              )}
              {filteredEquipment.length === 0 && equipItems.length === 0 && (
                <EmptyState label="No equipment" sub="Add equipment to your fleet in the Equipment section, or add catalog items below." />
              )}
            </>
          )}

          {/* ── MATERIAL ── */}
          {tab === 'material' && (
            <>
              {materialItems.length === 0 && <EmptyState label="No materials" sub="Add mulch, rock, soil, and other materials to your catalog below." />}
              {materialItems.map(item => <CatalogItemRow key={item.id} item={item} onAdd={onAdd} />)}
            </>
          )}

          {/* ── SUBS ── */}
          {tab === 'subs' && (
            <>
              {subsItems.length === 0 && <EmptyState label="No subcontractors" sub="Add sub services like hauling, electrical, or concrete below." />}
              {subsItems.map(item => <CatalogItemRow key={item.id} item={item} onAdd={onAdd} />)}
            </>
          )}

          {/* ── OTHER ── */}
          {tab === 'other' && (
            <>
              {otherItems.length === 0 && !showNewForm && <EmptyState label="No other items" sub="Add fees, permits, disposal charges, or anything else below." />}
              {otherItems.map(item => <CatalogItemRow key={item.id} item={item} onAdd={onAdd} />)}
            </>
          )}

          {/* ── TEMPLATES ── */}
          {tab === 'templates' && (
            <>
              {templates.length === 0 && (
                <EmptyState label="No templates yet" sub="Close this panel, build your line items, then save them as a reusable template." />
              )}
              {templates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => { applyTemplate(tmpl.id); onClose() }}
                  className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-purple-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tmpl.name}</p>
                    <p className="text-xs text-gray-400">{tmpl.items.length} item{tmpl.items.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Plus className="w-5 h-5 text-purple-400" />
                </button>
              ))}
              {currentItemCount > 0 && (
                <div className="pt-2">
                  {showSaveTemplate ? (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="Template name…"
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <button
                        onClick={() => { if (templateName.trim()) { saveAsTemplate(templateName.trim()); setTemplateName(''); setShowSaveTemplate(false) } }}
                        className="px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl active:bg-purple-700"
                      >Save</button>
                      <button onClick={() => setShowSaveTemplate(false)} className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl">×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSaveTemplate(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-purple-300 rounded-xl text-sm text-purple-600 font-medium active:bg-purple-50"
                    >
                      <Save className="w-4 h-4" />
                      Save current items as template
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── New item form (all non-template tabs) ── */}
          {tab !== 'templates' && (
            <div className="pt-2">
              {showNewForm ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Name (e.g. Brown Mulch)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={newCost}
                      onChange={e => setNewCost(e.target.value)}
                      type="number" inputMode="decimal"
                      placeholder="Cost ($)"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      type="number" inputMode="decimal"
                      placeholder={`Sell (${tab === 'labor' ? '$/hr' : tab === 'equipment' ? '$/day' : '$'})`}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      placeholder={`Unit (${defaultUnit})`}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 px-1">Saves to your catalog and adds to this estimate.</p>
                  <div className="flex gap-2">
                    <button onClick={handleSaveNew} disabled={saving || !newName.trim()} className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg active:bg-blue-700 disabled:opacity-50">
                      {saving ? 'Saving…' : 'Add & Save to Catalog'}
                    </button>
                    <button onClick={() => setShowNewForm(false)} className="px-3 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium active:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                  New {tab === 'other' ? 'item' : tab} item
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CatalogItemRow({ item, onAdd }: { item: ServiceItem; onAdd: (i: { description: string; unit_price: number; unit: string; category: LineItemCategory }) => void }) {
  const cat = (item.category?.toLowerCase() ?? 'other') as LineItemCategory
  const cfg = CATEGORY_CFG[cat] ?? CATEGORY_CFG.other
  return (
    <button
      onClick={() => onAdd({ description: item.name, unit_price: item.default_price, unit: item.unit, category: cat })}
      className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-blue-50"
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <p className="text-xs text-gray-400">{item.unit} · {fmt(item.default_price)}</p>
      </div>
      <Plus className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </button>
  )
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="text-center py-8 px-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

// ─── Main section ──────────────────────────────────────────────────────────────

export default function LineItemsSection({ estimateId }: { estimateId: string }) {
  const { lineItems, serviceItems, loading, subtotal, addLineItem, updateLineItem, deleteLineItem, addServiceItem } = useLineItems(estimateId)
  const { settings } = useCompanySettings()
  const { templates, saveAsTemplate } = useTemplates()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showTotals, setShowTotals] = useState(true)

  const taxRate = settings?.tax_rate ?? 0
  const defaultMarkup = settings?.default_markup_pct ?? 0
  const taxableSubtotal = lineItems.filter(li => !li.tax_exempt).reduce((s, li) => s + li.quantity * li.unit_price, 0)
  const taxAmount = taxableSubtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  const totalCost = lineItems.reduce((s, li) => s + (li.unit_cost ?? 0) * li.quantity, 0)
  const grossProfit = subtotal - totalCost
  const overallMargin = subtotal > 0 && totalCost > 0 ? (grossProfit / subtotal) * 100 : null

  // Group line items by category
  const grouped = useMemo(() => {
    const order: LineItemCategory[] = ['labor', 'equipment', 'material', 'subs', 'other']
    const map = new Map<LineItemCategory, EstimateLineItem[]>()
    for (const cat of order) map.set(cat, [])
    for (const li of lineItems) {
      const cat = (li.category ?? 'other') as LineItemCategory
      map.get(cat)?.push(li)
    }
    return order.map(cat => ({ cat, items: map.get(cat)! })).filter(g => g.items.length > 0)
  }, [lineItems])

  async function handleAdd({ description, unit_price, unit, category, unit_cost }: { description: string; unit_price: number; unit: string; category: LineItemCategory; unit_cost?: number }) {
    const cost = unit_cost ?? 0
    const sell = cost > 0 && defaultMarkup > 0 ? parseFloat((cost * (1 + defaultMarkup / 100)).toFixed(2)) : unit_price
    await addLineItem({
      description,
      quantity: 1,
      unit_price: sell,
      unit_cost: cost,
      markup_pct: cost > 0 && defaultMarkup > 0 ? defaultMarkup : 0,
      unit,
      tax_exempt: false,
      service_item_id: null,
      sort_order: lineItems.length,
      category,
    })
  }

  async function applyTemplate(templateId: string) {
    const tmpl = templates.find(t => t.id === templateId)
    if (!tmpl) return
    for (const item of tmpl.items) {
      await addLineItem({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit: item.unit,
        tax_exempt: item.tax_exempt,
        service_item_id: null,
        sort_order: lineItems.length,
        category: 'other',
      })
    }
  }

  async function handleSaveTemplate(name: string) {
    await saveAsTemplate(name, null, lineItems.map((li, i) => ({
      description: li.description,
      quantity: li.quantity,
      unit_price: li.unit_price,
      unit: li.unit,
      tax_exempt: li.tax_exempt,
      sort_order: i,
    })))
  }

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>

  return (
    <div className="space-y-3">
      {/* Grouped line items */}
      {grouped.map(({ cat, items }) => {
        const cfg = CATEGORY_CFG[cat]
        return (
          <div key={cat}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-1.5 ${cfg.header}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
              <span className={`ml-auto text-xs font-semibold ${cfg.text}`}>
                {fmt(items.reduce((s, li) => s + li.quantity * li.unit_price, 0))}
              </span>
            </div>
            <div className="space-y-1.5">
              {items.map(li => (
                <LineItemRow
                  key={li.id}
                  item={li}
                  onUpdate={u => updateLineItem(li.id, u)}
                  onDelete={deleteLineItem}
                  defaultMarkup={defaultMarkup}
                />
              ))}
            </div>
          </div>
        )
      })}

      {lineItems.length === 0 && (
        <div className="text-center py-10 bg-white border border-dashed border-gray-300 rounded-2xl">
          <p className="text-gray-400 text-sm font-medium">No items yet</p>
          <p className="text-gray-300 text-xs mt-1">Tap below to add labor, equipment, and materials</p>
        </div>
      )}

      {/* Totals */}
      {lineItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowTotals(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-bold text-gray-900">Total {fmt(total)}</span>
            {showTotals ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showTotals && (
            <div className="px-4 pb-3 space-y-1 border-t border-gray-200 pt-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax ({taxRate}%)</span><span>{fmt(taxAmount)}</span>
                </div>
              )}
              {grouped.map(({ cat, items }) => {
                const cfg = CATEGORY_CFG[cat]
                const catTotal = items.reduce((s, li) => s + li.quantity * li.unit_price, 0)
                return (
                  <div key={cat} className={`flex justify-between text-xs ${cfg.text}`}>
                    <span>{cfg.label}</span><span>{fmt(catTotal)}</span>
                  </div>
                )
              })}
              {totalCost > 0 && overallMargin !== null && (
                <div className={`flex justify-between text-xs font-semibold pt-1 border-t border-gray-100 ${overallMargin >= 30 ? 'text-green-600' : overallMargin >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                  <span>Total cost {fmt(totalCost)} · Profit {fmt(grossProfit)}</span>
                  <span>{overallMargin.toFixed(0)}% margin</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Items button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-semibold rounded-2xl active:bg-blue-700 shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Add Items
      </button>

      {/* Catalog drawer */}
      <CatalogDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAdd={async item => { await handleAdd(item) }}
        serviceItems={serviceItems}
        addServiceItem={addServiceItem}
        templates={templates}
        applyTemplate={applyTemplate}
        saveAsTemplate={handleSaveTemplate}
        currentItemCount={lineItems.length}
      />
    </div>
  )
}
