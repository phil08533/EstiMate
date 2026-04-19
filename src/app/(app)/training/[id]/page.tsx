'use client'

import { useState } from 'react'
import { Plus, Trash2, CheckSquare, Square, Eye, EyeOff, Type, Link as LinkIcon } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { useTraining, useTrainingItems } from '@/lib/hooks/useTraining'
import { useEmployees } from '@/lib/hooks/useEmployees'
import type { TrainingItemType } from '@/lib/types'

const TYPE_ICONS: Record<TrainingItemType, React.ReactNode> = {
  checklist:  <CheckSquare className="w-4 h-4" />,
  text:       <Type className="w-4 h-4" />,
  video_url:  <LinkIcon className="w-4 h-4" />,
}

export default function TrainingModulePage({ params }: { params: { id: string } }) {
  const { modules, loading: modLoading, updateModule } = useTraining()
  const { items, completions, loading: itemsLoading, addItem, deleteItem, toggleCompletion } = useTrainingItems(params.id)
  const { employees } = useEmployees()

  const [content, setContent] = useState('')
  const [itemType, setItemType] = useState<TrainingItemType>('checklist')
  const [adding, setAdding] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')

  const mod = modules.find(m => m.id === params.id)

  if (modLoading || itemsLoading) return <><TopBar title="Training" backHref="/training" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>
  if (!mod) return <><TopBar title="Training" backHref="/training" /><div className="p-4 text-center text-gray-500">Module not found</div></>

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) return
    setAdding(true)
    await addItem({ module_id: params.id, content: content.trim(), item_type: itemType })
    setAdding(false)
    setContent('')
  }

  function isCompleted(itemId: string, empId: string) {
    return completions.some(c => c.item_id === itemId && c.employee_id === empId)
  }

  const activeEmployees = employees.filter(e => e.is_active)

  return (
    <>
      <TopBar
        title={mod.title}
        backHref="/training"
        right={
          <button
            onClick={() => updateModule(params.id, { is_public: !mod.is_public })}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              mod.is_public ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
          >
            {mod.is_public ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {mod.is_public ? 'Public' : 'Private'}
          </button>
        }
      />
      <div className="p-4 space-y-4 pb-28">
        {mod.description && (
          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{mod.description}</p>
        )}

        {/* Add item */}
        <form onSubmit={handleAddItem} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Item</p>
          <div className="flex gap-2">
            {(['checklist', 'text', 'video_url'] as TrainingItemType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setItemType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  itemType === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {TYPE_ICONS[t]}
                {t === 'checklist' ? 'Checkbox' : t === 'text' ? 'Note' : 'Video URL'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={content} onChange={e => setContent(e.target.value)}
              placeholder={itemType === 'video_url' ? 'https://...' : itemType === 'checklist' ? 'e.g. Review safety guidelines' : 'Add a note or instruction'}
              className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="submit" size="sm" loading={adding} disabled={!content.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Employee selector for tracking completions */}
        {activeEmployees.length > 0 && items.some(i => i.item_type === 'checklist') && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Track completions for</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedEmployee('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  !selectedEmployee ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                View only
              </button>
              {activeEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(selectedEmployee === emp.id ? '' : emp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selectedEmployee === emp.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {emp.first_name} {emp.last_name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items list */}
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">No items yet — add checklists, notes, or video links above</div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const done = selectedEmployee ? isCompleted(item.id, selectedEmployee) : false
              return (
                <div key={item.id} className={`flex items-start gap-3 bg-white border rounded-xl px-4 py-3 transition-colors ${done ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                  {item.item_type === 'checklist' && selectedEmployee ? (
                    <button
                      onClick={() => toggleCompletion(item.id, selectedEmployee)}
                      className={`flex-shrink-0 mt-0.5 ${done ? 'text-green-600' : 'text-gray-300'}`}
                    >
                      {done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  ) : (
                    <span className="flex-shrink-0 mt-0.5 text-gray-400">{TYPE_ICONS[item.item_type]}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    {item.item_type === 'video_url' ? (
                      <a href={item.content} target="_blank" rel="noopener noreferrer"
                        className="text-sm text-blue-600 underline underline-offset-2 break-all">
                        {item.content}
                      </a>
                    ) : (
                      <p className={`text-sm ${done ? 'text-green-700 line-through' : 'text-gray-800'}`}>{item.content}</p>
                    )}
                    {/* completion count */}
                    {item.item_type === 'checklist' && !selectedEmployee && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {completions.filter(c => c.item_id === item.id).length} / {activeEmployees.length} completed
                      </p>
                    )}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-300 active:text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
