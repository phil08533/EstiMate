'use client'

import { useState } from 'react'
import { Plus, BookOpen, Trash2, ChevronRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { useTraining } from '@/lib/hooks/useTraining'

export default function TrainingPage() {
  const { modules, loading, addModule, deleteModule } = useTraining()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    await addModule({ title: title.trim(), description: desc || null, is_public: isPublic })
    setSaving(false)
    setTitle(''); setDesc(''); setIsPublic(false); setShowForm(false)
  }

  if (loading) return <><TopBar title="Training" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Employee Training" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Create training modules with checklists. Mark as <strong>Employee Visible</strong> so field staff can view and check off items.
          </p>
        </div>

        {showForm ? (
          <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-gray-900">New Training Module</p>
            <input
              autoFocus value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. New Hire Orientation"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Description (optional)" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <button
              type="button"
              onClick={() => setIsPublic(p => !p)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                isPublic ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              {isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isPublic ? 'Visible to employees' : 'Manager only'}
            </button>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} disabled={!title.trim()} className="flex-1">Create</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium active:bg-gray-50">
            <Plus className="w-5 h-5" />New training module
          </button>
        )}

        {modules.length === 0 && !showForm && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No training modules yet</p>
            <p className="text-gray-400 text-sm mt-1">Create onboarding guides, safety checklists, and SOPs</p>
          </div>
        )}

        {modules.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {modules.map((mod, i) => (
              <div key={mod.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < modules.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <Link href={`/training/${mod.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${mod.is_public ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <BookOpen className={`w-4 h-4 ${mod.is_public ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{mod.title}</p>
                    <p className="text-xs text-gray-400">
                      {mod.is_public ? 'Employee visible' : 'Manager only'}
                      {mod.description && ` · ${mod.description.slice(0, 40)}`}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
                <button onClick={() => deleteModule(mod.id)} className="p-1.5 text-gray-300 active:text-red-400 flex-shrink-0">
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
