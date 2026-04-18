'use client'

import { useState } from 'react'
import { Plus, Trash2, Ruler, Pencil, Check, X, ChevronDown } from 'lucide-react'
import { useMeasurements } from '@/lib/hooks/useMeasurements'
import MeasurementForm from './MeasurementForm'
import TotalAreaDisplay from './TotalAreaDisplay'
import Spinner from '@/components/ui/Spinner'
import { formatArea } from '@/lib/utils/format'
import type { Measurement, MeasurementGroup } from '@/lib/types'

function MeasurementRow({
  m,
  groups,
  onDelete,
  onMove,
}: {
  m: Measurement
  groups: MeasurementGroup[]
  onDelete: (id: string) => Promise<void>
  onMove: (id: string, groupId: string | null) => Promise<void>
}) {
  const [showMove, setShowMove] = useState(false)

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
      <Ruler className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        {m.label && <p className="text-sm font-medium text-gray-700 truncate">{m.label}</p>}
        <p className="text-xs text-gray-400">
          {m.length} × {m.width} ft = <span className="font-semibold text-gray-600">{formatArea(m.area)}</span>
        </p>
      </div>
      {/* Move to group */}
      {groups.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMove(v => !v)}
            className="p-1.5 text-gray-400 active:text-blue-500 rounded-lg"
            title="Move to group"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {showMove && (
            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg min-w-36 py-1">
              <button
                onClick={() => { onMove(m.id, null); setShowMove(false) }}
                className={`w-full text-left px-4 py-2 text-sm ${!m.group_id ? 'font-semibold text-blue-600' : 'text-gray-700'} active:bg-gray-50`}
              >
                Ungrouped
              </button>
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => { onMove(m.id, g.id); setShowMove(false) }}
                  className={`w-full text-left px-4 py-2 text-sm ${m.group_id === g.id ? 'font-semibold text-blue-600' : 'text-gray-700'} active:bg-gray-50`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        onClick={() => onDelete(m.id)}
        className="p-1.5 text-gray-400 active:text-red-500 rounded-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function GroupCard({
  group,
  measurements,
  allGroups,
  onRename,
  onDelete,
  onAddMeasurement,
  onDeleteMeasurement,
  onMoveMeasurement,
}: {
  group: MeasurementGroup
  measurements: Measurement[]
  allGroups: MeasurementGroup[]
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAddMeasurement: (m: Omit<Measurement, 'id' | 'area' | 'created_at' | 'estimate_id'>) => Promise<void>
  onDeleteMeasurement: (id: string) => Promise<void>
  onMoveMeasurement: (id: string, groupId: string | null) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const subtotal = measurements.reduce((sum, m) => sum + (m.area ?? 0), 0)

  async function handleRename() {
    if (!name.trim()) return
    await onRename(group.id, name.trim())
    setEditing(false)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
      {/* Group header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-white">
        {editing ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setEditing(false); setName(group.name) } }}
              className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleRename} className="p-1 text-green-600 rounded"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setName(group.name) }} className="p-1 text-gray-400 rounded"><X className="w-4 h-4" /></button>
          </>
        ) : (
          <>
            <span className="flex-1 font-semibold text-gray-800 text-sm">{group.name}</span>
            {subtotal > 0 && (
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                {formatArea(subtotal)}
              </span>
            )}
            <button onClick={() => setEditing(true)} className="p-1 text-gray-400 active:text-gray-600 rounded">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(group.id)} className="p-1 text-gray-400 active:text-red-500 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Measurements in this group */}
      <div className="p-3 space-y-2">
        {measurements.map(m => (
          <MeasurementRow
            key={m.id}
            m={m}
            groups={allGroups}
            onDelete={onDeleteMeasurement}
            onMove={onMoveMeasurement}
          />
        ))}
        <MeasurementForm onAdd={(m) => onAddMeasurement({ ...m, group_id: group.id })} compact />
      </div>
    </div>
  )
}

export default function MeasurementsSection({
  estimateId,
  onImportToQuote,
}: {
  estimateId: string
  onImportToQuote?: (items: { description: string; quantity: number; unit: string }[]) => Promise<void>
}) {
  const {
    measurements, groups, loading, totalArea,
    addMeasurement, deleteMeasurement, moveMeasurement,
    addGroup, renameGroup, deleteGroup,
  } = useMeasurements(estimateId)

  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [importing, setImporting] = useState(false)

  if (loading) {
    return <div className="flex justify-center py-4"><Spinner /></div>
  }

  const ungrouped = measurements.filter(m => !m.group_id)

  async function handleImport() {
    if (!onImportToQuote || !measurements.length) return
    setImporting(true)
    const items = measurements.map(m => ({
      description: m.label ? `${m.label} (${m.length} × ${m.width} ft)` : `Area (${m.length} × ${m.width} ft)`,
      quantity: m.area,
      unit: 'sq ft',
    }))
    await onImportToQuote(items)
    setImporting(false)
  }

  async function handleAddGroup() {
    if (!newGroupName.trim()) return
    await addGroup(newGroupName.trim())
    setNewGroupName('')
    setAddingGroup(false)
  }

  return (
    <div className="space-y-3">
      <TotalAreaDisplay totalArea={totalArea} count={measurements.length} />

      {/* Groups */}
      {groups.map(group => (
        <GroupCard
          key={group.id}
          group={group}
          measurements={measurements.filter(m => m.group_id === group.id)}
          allGroups={groups}
          onRename={renameGroup}
          onDelete={deleteGroup}
          onAddMeasurement={async (m) => { await addMeasurement(m) }}
          onDeleteMeasurement={deleteMeasurement}
          onMoveMeasurement={moveMeasurement}
        />
      ))}

      {/* Ungrouped measurements */}
      {(ungrouped.length > 0 || groups.length === 0) && (
        <div className="space-y-2">
          {groups.length > 0 && ungrouped.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Ungrouped</p>
          )}
          {ungrouped.map(m => (
            <MeasurementRow
              key={m.id}
              m={m}
              groups={groups}
              onDelete={deleteMeasurement}
              onMove={moveMeasurement}
            />
          ))}
        </div>
      )}

      {/* Add measurement (ungrouped) */}
      {groups.length === 0 && (
        <MeasurementForm onAdd={async (m) => { await addMeasurement({ ...m, group_id: null }) }} />
      )}

      {/* Import to quote */}
      {onImportToQuote && measurements.length > 0 && (
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-semibold active:bg-green-100 disabled:opacity-60"
        >
          <Ruler className="w-4 h-4" />
          {importing ? 'Importing…' : `Import ${measurements.length} measurement${measurements.length > 1 ? 's' : ''} to Quote`}
        </button>
      )}

      {/* Add group */}
      {addingGroup ? (
        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50">
          <input
            autoFocus
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') setAddingGroup(false) }}
            placeholder="Group name (e.g. Mulch)"
            className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
          <button onClick={handleAddGroup} className="p-1.5 text-green-600 rounded-lg active:bg-green-100">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => setAddingGroup(false)} className="p-1.5 text-gray-400 rounded-lg active:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingGroup(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-sm font-medium active:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          Add group
        </button>
      )}
    </div>
  )
}
