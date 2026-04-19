'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, BookTemplate, Save, Zap } from 'lucide-react'
import { useLineItems } from '@/lib/hooks/useLineItems'
import { useCompanySettings } from '@/lib/hooks/useCompanySettings'
import { useTemplates } from '@/lib/hooks/useTemplates'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import type { EstimateLineItem, ServiceItem } from '@/lib/types'

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const CATEGORIES = ['All', 'Materials', 'Labor', 'Equipment', 'Other'] as const
type CategoryFilter = typeof CATEGORIES[number]

const STARTER_CATALOG = [
  { name: 'Mulch', category: 'Materials', unit: 'yard', default_cost: 30, default_price: 65 },
  { name: 'Topsoil', category: 'Materials', unit: 'yard', default_cost: 35, default_price: 75 },
  { name: 'Gravel', category: 'Materials', unit: 'yard', default_cost: 40, default_price: 85 },
  { name: 'Sod', category: 'Materials', unit: 'sq ft', default_cost: 0.5, default_price: 1.5 },
  { name: 'Seed & Fertilizer', category: 'Materials', unit: 'sq ft', default_cost: 0.1, default_price: 0.35 },
  { name: 'Mulch Fabric', category: 'Materials', unit: 'sq ft', default_cost: 0.08, default_price: 0.25 },
  { name: 'Pine Straw', category: 'Materials', unit: 'bale', default_cost: 7, default_price: 18 },
  { name: 'Labor', category: 'Labor', unit: 'hr', default_cost: 25, default_price: 65 },
  { name: 'Crew Lead', category: 'Labor', unit: 'hr', default_cost: 35, default_price: 85 },
  { name: 'Dump Truck', category: 'Equipment', unit: 'load', default_cost: 75, default_price: 200 },
  { name: 'Skid Steer', category: 'Equipment', unit: 'hr', default_cost: 85, default_price: 200 },
  { name: 'Debris Removal', category: 'Other', unit: 'load', default_cost: 50, default_price: 150 },
  { name: 'Irrigation', category: 'Other', unit: 'zone', default_cost: 150, default_price: 350 },
]

function LineItemRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: EstimateLineItem
  onUpdate: (updates: Partial<EstimateLineItem>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [desc, setDesc] = useState(item.description)
  const [qty, setQty] = useState(item.quantity.toString())
  const [price, setPrice] = useState(item.unit_price.toString())

  async function save() {
    await onUpdate({ description: desc, quantity: parseFloat(qty) || 0, unit_price: parseFloat(price) || 0 })
    setEditing(false)
  }

  const subtotal = item.quantity * item.unit_price

  if (editing) {
    return (
      <div className="border border-blue-200 rounded-xl p-3 bg-blue-50 space-y-2">
        <input
          autoFocus
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            value={qty}
            onChange={e => setQty(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="Qty"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="Unit price ($)"
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} className="flex-1">Save</Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 active:bg-gray-50"
      onClick={() => setEditing(true)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
        <p className="text-xs text-gray-400">
          {item.quantity} × {formatMoney(item.unit_price)}
          {item.tax_exempt && <span className="ml-1 text-amber-600">(tax exempt)</span>}
        </p>
      </div>
      <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{formatMoney(subtotal)}</p>
      <button
        onClick={e => { e.stopPropagation(); onDelete(item.id) }}
        className="p-1.5 text-gray-400 active:text-red-500 rounded-lg flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function LineItemsSection({ estimateId }: { estimateId: string }) {
  const { lineItems, serviceItems, loading, subtotal, addLineItem, updateLineItem, deleteLineItem, addServiceItem } = useLineItems(estimateId)
  const { settings } = useCompanySettings()
  const { templates, saveAsTemplate, deleteTemplate } = useTemplates()

  const defaultMarkup = settings?.default_markup ?? 30
  const taxRate = settings?.tax_rate ?? 0

  // Catalog state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [showCatalogForm, setShowCatalogForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catCategory, setCatCategory] = useState('Materials')
  const [catUnit, setCatUnit] = useState('each')
  const [catCost, setCatCost] = useState('')
  const [catMarkup, setCatMarkup] = useState(defaultMarkup.toString())
  const [catPrice, setCatPrice] = useState('')
  const [seedingCatalog, setSeedingCatalog] = useState(false)

  // Custom line item form
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('each')
  const [taxExempt, setTaxExempt] = useState(false)
  const [saving, setSaving] = useState(false)

  // Templates
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const taxableSubtotal = lineItems.filter(li => !li.tax_exempt).reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const taxAmount = taxableSubtotal * (taxRate / 100)
  const total = subtotal + taxAmount
  const totalCost = lineItems.reduce((sum, li) => sum + li.quantity * (li.unit_cost ?? 0), 0)
  const grossProfit = subtotal - totalCost
  const marginPct = subtotal > 0 ? (grossProfit / subtotal) * 100 : 0

  const filteredCatalog = useMemo(() => {
    if (categoryFilter === 'All') return serviceItems
    return serviceItems.filter(item => (item.category ?? 'Other').toLowerCase() === categoryFilter.toLowerCase())
  }, [serviceItems, categoryFilter])

  function calcAutoPrice(cost: string, markup: string) {
    const c = parseFloat(cost) || 0
    const m = parseFloat(markup) || 0
    return (c * (1 + m / 100)).toFixed(2)
  }

  function addFromCatalog(item: ServiceItem) {
    addLineItem({
      description: item.name,
      quantity: 1,
      unit_price: item.default_price,
      unit_cost: item.default_cost,
      unit: item.unit,
      tax_exempt: false,
      service_item_id: item.id,
      sort_order: lineItems.length,
    })
  }

  async function handleAddToCatalog(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    const cost = parseFloat(catCost) || 0
    const markupPct = parseFloat(catMarkup) || defaultMarkup
    const sellPrice = parseFloat(catPrice) || parseFloat(calcAutoPrice(catCost, catMarkup))
    await addServiceItem({
      name: catName.trim(),
      description: null,
      unit: catUnit,
      default_price: sellPrice,
      default_cost: cost,
      markup_pct: markupPct,
      category: catCategory,
    })
    setCatName(''); setCatCost(''); setCatMarkup(defaultMarkup.toString()); setCatPrice(''); setCatUnit('each')
    setShowCatalogForm(false)
  }

  async function seedStarterCatalog() {
    setSeedingCatalog(true)
    for (const item of STARTER_CATALOG) {
      await addServiceItem({
        name: item.name,
        description: null,
        unit: item.unit,
        default_price: item.default_price,
        default_cost: item.default_cost,
        markup_pct: null,
        category: item.category,
      })
    }
    setSeedingCatalog(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) return
    setSaving(true)
    await addLineItem({
      description: desc.trim(),
      quantity: parseFloat(qty) || 1,
      unit_price: parseFloat(price) || 0,
      unit_cost: 0,
      unit,
      tax_exempt: taxExempt,
      service_item_id: null,
      sort_order: lineItems.length,
    })
    setSaving(false)
    setDesc(''); setQty('1'); setPrice(''); setUnit('each'); setTaxExempt(false)
    setShowForm(false)
  }

  async function applyTemplate(templateId: string) {
    const tmpl = templates.find(t => t.id === templateId)
    if (!tmpl) return
    for (const item of tmpl.items) {
      await addLineItem({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        unit_cost: 0,
        unit: item.unit,
        tax_exempt: item.tax_exempt,
        service_item_id: null,
        sort_order: lineItems.length,
      })
    }
    setShowTemplates(false)
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!templateName.trim() || lineItems.length === 0) return
    setSavingTemplate(true)
    await saveAsTemplate(
      templateName.trim(),
      null,
      lineItems.map((li, i) => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        unit: li.unit,
        tax_exempt: li.tax_exempt,
        sort_order: i,
      }))
    )
    setSavingTemplate(false)
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  if (loading) return <div className="flex justify-center py-4"><Spinner /></div>

  return (
    <div className="space-y-3">

      {/* ── Service Catalog (always visible at top) ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <p className="text-sm font-semibold text-gray-800">Quick Add</p>
          <button
            type="button"
            onClick={() => { setShowCatalogForm(v => !v); setCatMarkup(defaultMarkup.toString()) }}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg active:bg-blue-100"
          >
            <Plus className="w-3.5 h-3.5" />
            New item
          </button>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {serviceItems.length === 0 && (
          <div className="px-4 pb-4 text-center">
            <p className="text-sm text-gray-400 mb-3">No catalog items yet.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={seedingCatalog}
              onClick={seedStarterCatalog}
              className="w-full"
            >
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Load starter landscaping catalog
            </Button>
          </div>
        )}

        {/* Catalog items */}
        {filteredCatalog.length > 0 && (
          <div className="divide-y divide-gray-100">
            {filteredCatalog.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.unit}
                    {item.default_cost > 0 && <> · cost {formatMoney(item.default_cost)}</>}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-700 flex-shrink-0">
                  {formatMoney(item.default_price)}
                </span>
                <button
                  type="button"
                  onClick={() => addFromCatalog(item)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white active:bg-blue-700 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No results for active filter */}
        {serviceItems.length > 0 && filteredCatalog.length === 0 && (
          <p className="text-xs text-gray-400 text-center px-4 pb-4">
            No {categoryFilter.toLowerCase()} items yet.
          </p>
        )}

        {/* Add new catalog item form */}
        {showCatalogForm && (
          <form onSubmit={handleAddToCatalog} className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New catalog item</p>
            <input
              autoFocus
              value={catName}
              onChange={e => setCatName(e.target.value)}
              placeholder="Item name (e.g. Mulch)"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Category</label>
                <select
                  value={catCategory}
                  onChange={e => setCatCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Unit</label>
                <input
                  value={catUnit}
                  onChange={e => setCatUnit(e.target.value)}
                  placeholder="yard, hr, each…"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Your cost ($)</label>
                <input
                  value={catCost}
                  onChange={e => {
                    setCatCost(e.target.value)
                    setCatPrice(calcAutoPrice(e.target.value, catMarkup))
                  }}
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Markup %</label>
                <input
                  value={catMarkup}
                  onChange={e => {
                    setCatMarkup(e.target.value)
                    setCatPrice(calcAutoPrice(catCost, e.target.value))
                  }}
                  type="number"
                  inputMode="decimal"
                  placeholder={defaultMarkup.toString()}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Selling price ($) — auto from cost + markup</label>
              <input
                value={catPrice}
                onChange={e => setCatPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" disabled={!catName.trim()}>Add to catalog</Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowCatalogForm(false)}>Cancel</Button>
            </div>
          </form>
        )}
      </div>

      {/* ── Added line items ── */}
      {lineItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Items on this estimate</p>
          {lineItems.map(li => (
            <LineItemRow
              key={li.id}
              item={li}
              onUpdate={(u) => updateLineItem(li.id, u)}
              onDelete={deleteLineItem}
            />
          ))}
        </div>
      )}

      {/* ── Totals ── */}
      {lineItems.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-1.5">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax ({taxRate}%)</span>
              <span>{formatMoney(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>

          {/* Profit metrics — only shown when cost data is available */}
          {totalCost > 0 && (
            <div className="pt-2 mt-1 border-t border-gray-200 space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Your cost</span>
                <span>{formatMoney(totalCost)}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-green-700">
                <span>Gross profit</span>
                <span>{formatMoney(grossProfit)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-green-800">
                <span>Margin</span>
                <span>{marginPct.toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${marginPct >= 30 ? 'bg-green-500' : marginPct >= 15 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(100, marginPct)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Custom line item ── */}
      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom item</p>
          <input
            autoFocus
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (e.g. Hedge trimming)"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Quantity" type="number" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} />
            <Input label="Unit price ($)" type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={taxExempt} onChange={e => setTaxExempt(e.target.checked)} className="rounded" />
            Tax exempt
          </label>
          <div className="flex gap-2">
            <Button type="submit" loading={saving} disabled={!desc.trim()} className="flex-1" size="sm">Add</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1" size="sm">Cancel</Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium active:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Add custom item
        </button>
      )}

      {/* ── Templates ── */}
      <button
        type="button"
        onClick={() => setShowTemplates(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <BookTemplate className="w-4 h-4 text-purple-500" />
          Templates
          {templates.length > 0 && (
            <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{templates.length}</span>
          )}
        </div>
        {showTemplates ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {showTemplates && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          {templates.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No templates yet. Add line items then save as a template.</p>
          )}
          {templates.map(tmpl => (
            <div key={tmpl.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => applyTemplate(tmpl.id)}
                className="flex-1 text-left px-3 py-2 rounded-lg bg-purple-50 text-sm font-medium text-purple-800 active:bg-purple-100"
              >
                {tmpl.name}
                <span className="ml-2 text-xs text-purple-500">{tmpl.items.length} items</span>
              </button>
              <button
                type="button"
                onClick={() => deleteTemplate(tmpl.id)}
                className="p-1.5 text-gray-400 active:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {lineItems.length > 0 && (
            showSaveTemplate ? (
              <form onSubmit={handleSaveTemplate} className="flex gap-2 pt-1">
                <input
                  autoFocus
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="Template name…"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-purple-400"
                />
                <Button type="submit" size="sm" loading={savingTemplate} disabled={!templateName.trim()}>Save</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowSaveTemplate(false)}>×</Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSaveTemplate(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-purple-600 font-medium border border-dashed border-purple-300 rounded-lg active:bg-purple-50"
              >
                <Save className="w-3.5 h-3.5" />
                Save current items as template
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
