'use client'

import { useState, useMemo } from 'react'
import { Clock, Plus, ChevronDown, Download } from 'lucide-react'
import { useEmployees, useTimeEntries } from '@/lib/hooks/useEmployees'
import { useEstimates } from '@/lib/hooks/useEstimates'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

function fmtHours(h: number) {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function fmtDt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export default function TimePage() {
  const { employees, loading: eLoad } = useEmployees()
  const { entries, loading: tLoad, clockIn, clockOut, totalHours } = useTimeEntries()
  const { estimates, loading: estLoad } = useEstimates()
  const [modalOpen, setModalOpen] = useState(false)
  const [empId, setEmpId] = useState('')
  const [estId, setEstId] = useState('')
  const [clockInTime, setClockInTime] = useState(() => new Date().toISOString().slice(0, 16))
  const [clockOutTime, setClockOutTime] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterEmp, setFilterEmp] = useState('')

  const loading = eLoad || tLoad || estLoad

  const filtered = filterEmp
    ? entries.filter(e => e.employee_id === filterEmp)
    : entries

  function exportCSV() {
    const rows = [
      ['Date', 'Employee', 'Job / Customer', 'Hours', 'Break (min)', 'Pay Rate', 'Labor Cost', 'Notes'],
    ]
    for (const e of filtered) {
      if (!e.clock_out) continue
      const emp = empMap[e.employee_id]
      const est = e.estimate_id ? estMap[e.estimate_id] : null
      const ms = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
      const hrs = Math.max(0, (ms / 3_600_000) - (e.break_mins / 60))
      const payRate = emp?.pay_rate ?? 0
      const laborCost = emp?.pay_type === 'hourly' ? hrs * payRate : 0
      rows.push([
        new Date(e.clock_in).toLocaleDateString('en-US'),
        emp ? `${emp.first_name} ${emp.last_name}` : e.employee_id,
        est ? est.customer_name : '',
        hrs.toFixed(2),
        String(e.break_mins),
        payRate ? `$${payRate}` : '',
        laborCost ? `$${laborCost.toFixed(2)}` : '',
        e.notes ?? '',
      ])
    }
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees])
  const estMap = useMemo(() => Object.fromEntries(estimates.map(e => [e.id, e])), [estimates])

  // Group by employee for summary
  const empSummary = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      if (!e.clock_out) continue
      const ms = new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()
      const h = (ms / 3_600_000) - (e.break_mins / 60)
      map[e.employee_id] = (map[e.employee_id] ?? 0) + h
    }
    return map
  }, [entries])

  async function handleLog() {
    if (!empId || !clockInTime) return
    setSaving(true)
    const entry = await clockIn({
      employee_id: empId,
      estimate_id: estId || null,
      clock_in: new Date(clockInTime).toISOString(),
      break_mins: 0,
      notes: notes || null,
    })
    if (entry && clockOutTime) {
      await clockOut(entry.id, 0)
    }
    setSaving(false)
    setModalOpen(false)
    setEmpId(''); setEstId(''); setNotes(''); setClockOutTime('')
    setClockInTime(new Date().toISOString().slice(0, 16))
  }

  if (loading) return <><TopBar title="Time Tracking" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar
        title="Time Tracking"
        right={
          <div className="flex items-center gap-2">
            {filtered.some(e => e.clock_out) && (
              <button onClick={exportCSV} className="p-1.5 text-gray-500 rounded-lg active:bg-gray-100" title="Export CSV">
                <Download className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setModalOpen(true)} className="p-1.5 bg-blue-600 text-white rounded-lg active:bg-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="p-4 space-y-4 pb-28">

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{fmtHours(totalHours)}</p>
            <p className="text-xs text-gray-400">Total hours logged</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <Clock className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{entries.filter(e => !e.clock_out).length}</p>
            <p className="text-xs text-gray-400">Currently clocked in</p>
          </div>
        </div>

        {/* Employee breakdown */}
        {Object.keys(empSummary).length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">Hours by Employee</p>
            </div>
            {Object.entries(empSummary).map(([id, hrs]) => {
              const emp = empMap[id]
              if (!emp) return null
              return (
                <div key={id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-400">{emp.role.replace('_', ' ')}</p>
                  </div>
                  <p className="font-bold text-gray-900 text-sm">{fmtHours(hrs)}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Filter + entries */}
        <div className="relative">
          <select
            value={filterEmp}
            onChange={e => setFilterEmp(e.target.value)}
            className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No time entries yet.</p>
            <button onClick={() => setModalOpen(true)} className="mt-2 text-blue-600 text-sm font-medium">+ Log time</button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(entry => {
              const emp = empMap[entry.employee_id]
              const est = entry.estimate_id ? estMap[entry.estimate_id] : null
              const ms = entry.clock_out
                ? new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()
                : null
              const hrs = ms ? (ms / 3_600_000) - (entry.break_mins / 60) : null

              return (
                <div key={entry.id} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown'}
                      </p>
                      {est && <p className="text-xs text-gray-500 mt-0.5">Job: {est.customer_name}</p>}
                      {entry.notes && <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {hrs !== null ? (
                        <p className="font-bold text-gray-900 text-sm">{fmtHours(hrs)}</p>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {fmtDt(entry.clock_in)}
                    {entry.clock_out && ` → ${fmtDt(entry.clock_out)}`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Log Time Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log Time">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Employee *</label>
            <select
              value={empId}
              onChange={e => setEmpId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select employee…</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Job (optional)</label>
            <select
              value={estId}
              onChange={e => setEstId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Not linked to a job</option>
              {estimates.filter(e => e.status === 'sold').map(e => (
                <option key={e.id} value={e.id}>{e.customer_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Clock in *</label>
              <input
                type="datetime-local"
                value={clockInTime}
                onChange={e => setClockInTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">Clock out</label>
              <input
                type="datetime-local"
                value={clockOutTime}
                onChange={e => setClockOutTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was worked on…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleLog} disabled={saving || !empId}>
              {saving ? 'Saving…' : 'Log Time'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
