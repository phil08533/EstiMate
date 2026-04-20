'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Tag } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { useServiceCategories } from '@/lib/hooks/useServiceCategories'

const PRESET_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#84cc16','#ec4899','#6366f1',
]

const PRESETS = [
  'Landscaping', 'Lawn Mowing', 'Landscape Lighting', 'Snow Plowing',
  'Hardscaping', 'Tree Service', 'Irrigation', 'Fertilization', 'Aeration', 'Mulching',
]

export default function CategoriesPage() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useServiceCategories()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)

  function startAdd() { setName(''); setColor(PRESET_COLORS[0]); setEditId(null); setShowForm(true) }
  function startEdit(cat: typeof categories[0]) { setName(cat.name); setColor(cat.color); setEditId(cat.id); setShowForm(true) }
  function cancel() { setShowForm(false); setEditId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    if (editId) {
      await updateCategory(editId, { name: name.trim(), color })
    } else {
      await addCategory({ name: name.trim(), color, is_active: true })
    }
    setSaving(false)
    cancel()
  }

  if (loading) return <><TopBar title="Service Categories" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Service Categories" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Tag className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Define your work types (e.g. Mowing, Landscaping, Snow Plowing). Assign a category to each estimate to track revenue and profit by work type.
          </p>
        </div>

        {showForm ? (
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-gray-900">{editId ? 'Edit Category' : 'New Category'}</p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Lawn Mowing"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Quick presets */}
            {!editId && (
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.filter(p => !categories.find(c => c.name === p)).slice(0, 6).map(p => (
                  <button key={p} type="button" onClick={() => setName(p)}
                    className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg active:bg-gray-200">
                    {p}
                  </button>
                ))}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} disabled={!name.trim()} className="flex-1">Save</Button>
              <Button type="button" variant="secondary" onClick={cancel} className="flex-1">Cancel</Button>
            </div>
          </form>
        ) : (
          <button
            onClick={startAdd}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium active:bg-gray-50"
          >
            <Plus className="w-5 h-5" />Add category
          </button>
        )}

        {categories.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-gray-400 text-sm mt-1">Add categories to track revenue by work type</p>
          </div>
        )}

        {categories.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {categories.map((cat, i) => (
              <div key={cat.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < categories.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <p className="flex-1 font-medium text-gray-900">{cat.name}</p>
                <button onClick={() => startEdit(cat)} className="p-1.5 text-gray-400 active:text-blue-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteCategory(cat.id)} className="p-1.5 text-gray-400 active:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
