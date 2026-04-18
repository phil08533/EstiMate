'use client'

import { useState } from 'react'
import { Wrench, Trash2, Plus, DollarSign } from 'lucide-react'
import { useEquipment, useEquipmentLogs } from '@/lib/hooks/useEquipment'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { EquipmentStatus, EquipmentLogType } from '@/lib/types'

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'In Maintenance' },
  { value: 'retired', label: 'Retired' },
]

const LOG_TYPES: { value: EquipmentLogType; label: string; color: string }[] = [
  { value: 'maintenance', label: 'Maintenance', color: 'bg-blue-100 text-blue-800' },
  { value: 'repair', label: 'Repair', color: 'bg-red-100 text-red-800' },
  { value: 'fuel', label: 'Fuel', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'note', label: 'Note', color: 'bg-gray-100 text-gray-600' },
]

export default function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { equipment, loading: eLoading, updateEquipment, deleteEquipment } = useEquipment()
  const { logs, loading: lLoading, totalCost, addLog, deleteLog } = useEquipmentLogs(id)
  const router = useRouter()
  const [showLog, setShowLog] = useState(false)
  const [logType, setLogType] = useState<EquipmentLogType>('maintenance')
  const [logDesc, setLogDesc] = useState('')
  const [logCost, setLogCost] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const item = equipment.find(e => e.id === id)

  if (eLoading || lLoading) return <><TopBar title="Equipment" backHref="/equipment" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>
  if (!item) return <><TopBar title="Equipment" backHref="/equipment" /><div className="p-4 text-center text-gray-500">Not found</div></>

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    if (!logDesc.trim()) return
    setSaving(true)
    await addLog({
      log_type: logType,
      description: logDesc.trim(),
      cost: logCost ? parseFloat(logCost) : null,
      log_date: logDate,
    })
    setSaving(false)
    setLogDesc(''); setLogCost('')
    setShowLog(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this equipment?')) return
    await deleteEquipment(id)
    router.replace('/equipment')
  }

  return (
    <>
      <TopBar
        title={item.name}
        backHref="/equipment"
        right={
          <button onClick={handleDelete} className="p-1.5 text-red-400 active:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />
      <div className="p-4 space-y-4 pb-28">

        {/* Equipment info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900">{item.name}</h2>
              <p className="text-sm text-gray-400">{[item.year, item.make, item.model].filter(Boolean).join(' ')}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Status</p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateEquipment(id, { status: opt.value })}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                    item.status === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {item.serial_number && (
            <p className="text-sm text-gray-600">Serial: <span className="font-medium">{item.serial_number}</span></p>
          )}
          {item.purchase_date && (
            <p className="text-sm text-gray-600">Purchased: <span className="font-medium">{item.purchase_date}</span>
              {item.purchase_price && <span className="ml-2 text-gray-900 font-semibold">${item.purchase_price.toLocaleString()}</span>}
            </p>
          )}
          {item.notes && <p className="text-sm text-gray-600">{item.notes}</p>}

          {totalCost > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              <DollarSign className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                ${totalCost.toLocaleString()} in logged costs
              </span>
            </div>
          )}
        </div>

        {/* Depreciation card */}
        {item.purchase_price && item.purchase_date && (() => {
          const lifeYears = item.useful_life_years ?? 8
          const salvage = item.salvage_value ?? 0
          const purchaseYear = parseInt(item.purchase_date!.slice(0, 4))
          const ageYears = new Date().getFullYear() - purchaseYear
          const annualDepr = (item.purchase_price - salvage) / lifeYears
          const bookValue = Math.max(salvage, item.purchase_price - annualDepr * ageYears)
          const pctDepreciated = Math.min(100, Math.round((ageYears / lifeYears) * 100))
          const replaceYear = purchaseYear + lifeYears
          const shouldReplace = ageYears >= lifeYears * 0.85

          return (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Depreciation</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Book Value</p>
                  <p className="font-bold text-gray-900">${Math.round(bookValue).toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Age / Life</p>
                  <p className="font-bold text-gray-900">{ageYears}yr / {lifeYears}yr</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Depreciated</span>
                  <span>{pctDepreciated}%</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${pctDepreciated >= 85 ? 'bg-red-500' : pctDepreciated >= 60 ? 'bg-amber-400' : 'bg-green-500'}`}
                    style={{ width: `${pctDepreciated}%` }}
                  />
                </div>
              </div>
              {shouldReplace ? (
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <p className="text-xs font-semibold text-red-700">⚠️ Recommend replacing — past {pctDepreciated}% of useful life</p>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Est. replacement year: {replaceYear}</p>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Useful life (yrs)</p>
                  <input
                    type="number"
                    defaultValue={lifeYears}
                    onBlur={e => updateEquipment(id, { useful_life_years: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">Salvage value ($)</p>
                  <input
                    type="number"
                    defaultValue={salvage}
                    onBlur={e => updateEquipment(id, { salvage_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )
        })()}

        {/* Log entries */}
        <div className="flex items-center justify-between px-1">
          <h3 className="font-semibold text-gray-900">Activity Log</h3>
          <Button size="sm" variant="secondary" onClick={() => setShowLog(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add entry
          </Button>
        </div>

        {logs.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">No log entries yet</p>
        )}

        {logs.map(log => {
          const typeCfg = LOG_TYPES.find(t => t.value === log.log_type)
          return (
            <div key={log.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${typeCfg?.color}`}>
                    {typeCfg?.label}
                  </span>
                  <span className="text-xs text-gray-400">{log.log_date}</span>
                </div>
                <p className="text-sm text-gray-800">{log.description}</p>
                {log.cost && <p className="text-xs font-semibold text-red-600 mt-0.5">${log.cost.toLocaleString()}</p>}
              </div>
              <button onClick={() => deleteLog(log.id)} className="p-1.5 text-gray-400 active:text-red-500 rounded-lg flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Add log entry">
        <form onSubmit={handleAddLog} className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {LOG_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLogType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                  logType === t.value ? 'bg-blue-600 text-white border-blue-600' : `${t.color} border-transparent`
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea
            autoFocus
            value={logDesc}
            onChange={e => setLogDesc(e.target.value)}
            placeholder="Describe the work or note…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={logCost}
              onChange={e => setLogCost(e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="Cost (optional)"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={logDate}
              onChange={e => setLogDate(e.target.value)}
              type="date"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" loading={saving} disabled={!logDesc.trim()} className="w-full">Save entry</Button>
        </form>
      </Modal>
    </>
  )
}
