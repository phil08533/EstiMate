'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Tag, BookTemplate, Save } from 'lucide-react'
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

  const [showForm, setShowForm] = useState(false)
  const [showCatalog, setShowCatalog] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [desc, setDesc] = useState('')
  const [qty, setQty] = useState('1')
  const [price, setPrice] = useState('')
  const [unit, setUnit] = useState('each')
  const [taxExempt, setTaxExempt] = useState(false)
  const [saving, setSaving] = useState(false)

  // Catalog add form
  const [showCatalogForm, setShowCatalogForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [catPrice, setCatPrice] = useState('')
  const [catUnit, setCatUnit] = useState('each')

  const taxRate = settings?.tax_rate ?? 0
  const taxableSubtotal = lineItems
    .filter(li => !li.tax_exempt)
    .reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const taxAmount = taxableSubtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) return
    setSaving(true)
    await addLineItem({
      description: desc.trim(),
      quantity: parseFloat(qty) || 1,
      unit_price: parseFloat(price) || 0,
      unit,
      tax_exempt: taxExempt,
      service_item_id: null,
      sort_order: lineItems.length,
    })
    setSaving(false)
    setDesc(''); setQty('1'); setPrice(''); setUnit('each'); setTaxExempt(false)
    setShowForm(false)
  }

  function addFromCatalog(item: ServiceItem) {
    addLineItem({
      description: item.name,
      quantity: 1,
      unit_price: item.default_price,
      unit: item.unit,
      tax_exempt: false,
      service_item_id: item.id,
      sort_order: lineItems.length,
    })
  }

  async function handleAddToCatalog(e: React.FormEvent) {
    e.preventDefault()
    if (!catName.trim()) return
    await addServiceItem({
      name: catName.trim(),
      description: null,
      unit: catUnit,
      default_price: parseFloat(catPrice) || 0,
      category: null,
    })
    setCatName(''); setCatPrice(''); setCatUnit('each')
    setShowCatalogForm(false)
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
      {/* Line items */}
      {lineItems.map(li => (
        <LineItemRow
          key={li.id}
          item={li}
          onUpdate={(u) => updateLineItem(li.id, u)}
          onDelete={deleteLineItem}
        />
      ))}

      {/* Totals */}
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
        </div>
      )}

      {/* Templates panel */}
      <button
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
            <p className="text-xs text-gray-400 text-center py-2">No templates yet. Add line items and save as a template below.</p>
          )}
          {templates.map(tmpl => (
            <div key={tmpl.id} className="flex items-center gap-2">
              <button
                onClick={() => applyTemplate(tmpl.id)}
                className="flex-1 text-left px-3 py-2 rounded-lg bg-purple-50 text-sm font-medium text-purple-800 active:bg-purple-100"
              >
                {tmpl.name}
                <span className="ml-2 text-xs text-purple-500">{tmpl.items.length} items</span>
              </button>
              <button
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

      {/* Service catalog */}
      <button
        onClick={() => setShowCatalog(v => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-50"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          Service catalog
          {serviceItems.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{serviceItems.length}</span>
          )}
        </div>
        {showCatalog ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {showCatalog && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {serviceItems.map(item => (
            <button
              key={item.id}
              onClick={() => addFromCatalog(item)}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 text-left active:bg-blue-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
              </div>
              <span className="text-sm font-semibold text-blue-600">{formatMoney(item.default_price)}</span>
            </button>
          ))}

          {showCatalogForm ? (
            <form onSubmit={handleAddToCatalog} className="p-3 space-y-2 border-t border-gray-100">
              <input
                autoFocus
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="Service name"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={catPrice}
                  onChange={e => setCatPrice(e.target.value)}
                  type="number"
                  inputMode="decimal"
                  placeholder="Default price ($)"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={catUnit}
                  onChange={e => setCatUnit(e.target.value)}
                  placeholder="Unit (e.g. hr)"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={!catName.trim()}>Add to catalog</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowCatalogForm(false)}>Cancel</Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCatalogForm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs text-blue-600 font-medium border-t border-gray-100 active:bg-blue-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Add to catalog
            </button>
          )}
        </div>
      )}

      {/* Custom line item form */}
      {showForm ? (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <input
            autoFocus
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Description (e.g. Mulch installation)"
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
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium active:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Add line item
        </button>
      )}
    </div>
  )
}
