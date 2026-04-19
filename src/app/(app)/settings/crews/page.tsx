'use client'

import { useState } from 'react'
import { Plus, Trash2, Pencil, Users } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { useCrews } from '@/lib/hooks/useCrews'
import { useEmployees } from '@/lib/hooks/useEmployees'

const PRESET_COLORS = [
  '#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899',
]

export default function CrewsPage() {
  const { crews, crewMembers, loading, addCrew, updateCrew, deleteCrew, setCrewMembers } = useCrews()
  const { employees } = useEmployees()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [saving, setSaving] = useState(false)
  const [managingCrew, setManagingCrew] = useState<string | null>(null)
  const [selectedEmps, setSelectedEmps] = useState<string[]>([])

  const activeEmployees = employees.filter(e => e.is_active)

  function startAdd() { setName(''); setColor(PRESET_COLORS[0]); setEditId(null); setShowForm(true) }
  function startEdit(crew: typeof crews[0]) { setName(crew.name); setColor(crew.color); setEditId(crew.id); setShowForm(true) }
  function cancel() { setShowForm(false); setEditId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    if (editId) await updateCrew(editId, { name: name.trim(), color })
    else await addCrew({ name: name.trim(), color, is_active: true })
    setSaving(false)
    cancel()
  }

  function openMembers(crewId: string) {
    const current = crewMembers.filter(m => m.crew_id === crewId).map(m => m.employee_id)
    setSelectedEmps(current)
    setManagingCrew(crewId)
  }

  async function saveMembers() {
    if (!managingCrew) return
    setSaving(true)
    await setCrewMembers(managingCrew, selectedEmps)
    setSaving(false)
    setManagingCrew(null)
  }

  function toggleEmp(id: string) {
    setSelectedEmps(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  if (loading) return <><TopBar title="Crews" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Crews" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Create named crews and assign employees. Then assign crews to jobs for scheduling.
          </p>
        </div>

        {showForm ? (
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-gray-900">{editId ? 'Edit Crew' : 'New Crew'}</p>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Crew A"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} disabled={!name.trim()} className="flex-1">Save</Button>
              <Button type="button" variant="secondary" onClick={cancel} className="flex-1">Cancel</Button>
            </div>
          </form>
        ) : (
          <button onClick={startAdd}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium active:bg-gray-50">
            <Plus className="w-5 h-5" />Add crew
          </button>
        )}

        {crews.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {crews.map((crew, i) => {
              const members = crewMembers.filter(m => m.crew_id === crew.id)
              const memberNames = members.map(m => {
                const emp = activeEmployees.find(e => e.id === m.employee_id)
                return emp ? `${emp.first_name} ${emp.last_name}` : null
              }).filter(Boolean)

              return (
                <div key={crew.id} className={`px-4 py-3.5 space-y-2 ${i < crews.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: crew.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{crew.name}</p>
                      <p className="text-xs text-gray-400">{memberNames.length > 0 ? memberNames.join(', ') : 'No members'}</p>
                    </div>
                    <button onClick={() => openMembers(crew.id)} className="text-xs text-blue-600 font-medium px-2 py-1 rounded-lg border border-blue-200 active:bg-blue-50">
                      Members
                    </button>
                    <button onClick={() => startEdit(crew)} className="p-1.5 text-gray-400 active:text-blue-500">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteCrew(crew.id)} className="p-1.5 text-gray-400 active:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {crews.length === 0 && !showForm && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No crews yet</p>
            <p className="text-gray-400 text-sm mt-1">Add crews to assign jobs and track work by team</p>
          </div>
        )}
      </div>

      {/* Member management modal */}
      {managingCrew && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setManagingCrew(null)}>
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4 max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-gray-900">Crew Members</p>
            <div className="flex-1 overflow-y-auto space-y-2">
              {activeEmployees.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No active employees. Add them in the Employees section.</p>}
              {activeEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => toggleEmp(emp.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
                    selectedEmps.includes(emp.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedEmps.includes(emp.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {selectedEmps.includes(emp.id) && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-400 capitalize">{emp.role.replace('_', ' ')}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button onClick={saveMembers} loading={saving} className="w-full">
              Save ({selectedEmps.length} member{selectedEmps.length !== 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
