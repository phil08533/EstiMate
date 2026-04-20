'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ClipboardList, CalendarPlus, Clock, Users, X, Plus } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCrews, useScheduleBlocks } from '@/lib/hooks/useCrews'
import { useServiceCategories } from '@/lib/hooks/useServiceCategories'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import type { EstimateWithProfiles, ScheduleBlock } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  need_to_estimate: 'bg-amber-400',
  sent:  'bg-blue-400',
  sold:  'bg-green-400',
  lost:  'bg-red-400',
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

type ScheduleTab = 'calendar' | 'unscheduled'

export default function SchedulePage() {
  const { estimates, loading, updateEstimate } = useEstimates()
  const { crews } = useCrews()
  const { categories } = useServiceCategories()
  const { blocks, addBlock, deleteBlock } = useScheduleBlocks()
  const today = new Date()
  const [tab, setTab] = useState<ScheduleTab>('calendar')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [schedulingJob, setSchedulingJob] = useState<EstimateWithProfiles | null>(null)
  const [schedDate, setSchedDate] = useState('')
  const [schedCrew, setSchedCrew] = useState('')
  const [schedHours, setSchedHours] = useState('')
  const [saving, setSaving] = useState(false)
  // Block form state
  const [blockDate, setBlockDate] = useState('')
  const [blockHours, setBlockHours] = useState('')
  const [addingBlock, setAddingBlock] = useState(false)

  const dateMap = useMemo(() => {
    const map: Record<string, EstimateWithProfiles[]> = {}
    for (const e of estimates) {
      const dates = [e.service_date, e.follow_up_date].filter(Boolean) as string[]
      for (const d of dates) {
        if (!map[d]) map[d] = []
        if (!map[d].find(x => x.id === e.id)) map[d].push(e)
      }
    }
    return map
  }, [estimates])

  // Map block_date → blocks, also aggregate hours per date
  const blocksByDate = useMemo(() => {
    const map: Record<string, ScheduleBlock[]> = {}
    for (const b of blocks) {
      if (!map[b.block_date]) map[b.block_date] = []
      map[b.block_date].push(b)
    }
    return map
  }, [blocks])

  const unscheduled = useMemo(() =>
    estimates.filter(e =>
      !e.service_date && (e.status === 'sold' || e.status === 'need_to_estimate')
    ).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  [estimates])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedJobs = selectedDate ? (dateMap[selectedDate] ?? []) : []
  const selectedBlocks = selectedDate ? (blocksByDate[selectedDate] ?? []) : []

  // Blocks for the job currently being scheduled
  const jobBlocks = useMemo(() =>
    schedulingJob ? blocks.filter(b => b.estimate_id === schedulingJob.id) : [],
  [blocks, schedulingJob])

  const allocatedHours = jobBlocks.reduce((s, b) => s + b.hours, 0)
  const totalHours = schedulingJob?.estimated_hours ?? null

  function openScheduler(job: EstimateWithProfiles) {
    setSchedulingJob(job)
    setSchedDate(job.service_date ?? todayStr)
    setSchedCrew(job.crew_id ?? '')
    setSchedHours(String(job.estimated_hours ?? ''))
    setBlockDate(todayStr)
    setBlockHours('')
  }

  async function saveSchedule() {
    if (!schedulingJob || !schedDate) return
    setSaving(true)
    await updateEstimate(schedulingJob.id, {
      service_date: schedDate,
      crew_id: schedCrew || null,
      estimated_hours: schedHours ? parseFloat(schedHours) : null,
    })
    setSaving(false)
    setSchedulingJob(null)
  }

  async function handleAddBlock() {
    if (!schedulingJob || !blockDate || !blockHours) return
    setAddingBlock(true)
    await addBlock({
      estimate_id: schedulingJob.id,
      crew_id: schedCrew || null,
      block_date: blockDate,
      hours: parseFloat(blockHours),
      notes: null,
    })
    setBlockHours('')
    // Advance blockDate by 1 day for convenience
    const next = new Date(blockDate + 'T12:00:00')
    next.setDate(next.getDate() + 1)
    setBlockDate(next.toISOString().split('T')[0])
    setAddingBlock(false)
  }

  function catColor(catId: string | null) {
    if (!catId) return undefined
    return categories.find(c => c.id === catId)?.color
  }

  if (loading) return <><TopBar title="Schedule" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Schedule" />
      <div className="pb-28">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setTab('calendar')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
          >
            Calendar
          </button>
          <button
            onClick={() => setTab('unscheduled')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors relative ${tab === 'unscheduled' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
          >
            Unscheduled
            {unscheduled.length > 0 && (
              <span className="absolute top-2 right-6 w-4 h-4 bg-amber-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unscheduled.length > 9 ? '9+' : unscheduled.length}
              </span>
            )}
          </button>
        </div>

        {/* ── CALENDAR TAB ── */}
        {tab === 'calendar' && (
          <>
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
              <button onClick={prevMonth} className="p-2 rounded-xl active:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="font-bold text-gray-900">
                {new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-xl active:bg-gray-100">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 bg-white border-b border-gray-200">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 bg-white border-b border-gray-200">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-16 border-b border-r border-gray-100" />
                const dateStr = isoDate(viewYear, viewMonth, day)
                const jobs = dateMap[dateStr] ?? []
                const dayBlocks = blocksByDate[dateStr] ?? []
                const blockHrs = dayBlocks.reduce((s, b) => s + b.hours, 0)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`h-16 border-b border-r border-gray-100 p-1 flex flex-col items-center transition-colors ${
                      isSelected ? 'bg-blue-50' : isToday ? 'bg-amber-50' : 'active:bg-gray-50'
                    }`}
                  >
                    <span className={`text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-blue-600 text-white' : isSelected ? 'text-blue-600' : 'text-gray-700'
                    }`}>{day}</span>
                    {jobs.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {jobs.slice(0, 3).map(j => (
                          <span key={j.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[j.status] ?? 'bg-gray-400'}`}
                            style={catColor(j.category_id) ? { backgroundColor: catColor(j.category_id) } : undefined} />
                        ))}
                        {jobs.length > 3 && <span className="text-[9px] text-gray-400">+{jobs.length - 3}</span>}
                      </div>
                    )}
                    {blockHrs > 0 && (
                      <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 rounded px-0.5 mt-0.5 leading-tight">
                        {blockHrs}h
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-4 space-y-2">
              {selectedDate && (
                <p className="text-sm font-semibold text-gray-500 px-1">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' '}— {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}
                  {selectedBlocks.length > 0 && `, ${selectedBlocks.reduce((s,b) => s + b.hours, 0)}h blocked`}
                </p>
              )}

              {/* Hour blocks for selected date */}
              {selectedBlocks.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Work Blocks</p>
                  {selectedBlocks.map(b => {
                    const est = estimates.find(e => e.id === b.estimate_id)
                    const crew = crews.find(c => c.id === b.crew_id)
                    return (
                      <div key={b.id} className="flex items-center gap-2 text-sm">
                        <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="flex-1 text-gray-700 truncate">{est?.customer_name ?? 'Unknown job'}</span>
                        {crew && <span className="text-xs text-gray-400">{crew.name}</span>}
                        <span className="font-semibold text-blue-700 flex-shrink-0">{b.hours}h</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {selectedDate && selectedJobs.length === 0 && selectedBlocks.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No jobs or work blocks for this day</p>
              )}
              {(selectedDate ? selectedJobs : []).map(est => (
                <div
                  key={est.id}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLOR[est.status]}`}
                    style={catColor(est.category_id) ? { backgroundColor: catColor(est.category_id) } : undefined} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{est.customer_name}</p>
                    <div className="flex gap-3">
                      {est.customer_address && <p className="text-xs text-gray-400 truncate">{est.customer_address}</p>}
                      {est.estimated_hours && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                          <Clock className="w-3 h-3" />{est.estimated_hours}h
                        </span>
                      )}
                    </div>
                    {est.crew_id && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        {crews.find(c => c.id === est.crew_id)?.name ?? 'Crew'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openScheduler(est)}
                      className="text-xs text-blue-600 font-medium px-2 py-1 border border-blue-200 rounded-lg active:bg-blue-50"
                    >
                      Edit
                    </button>
                    <Link href={`/estimates/${est.id}`}>
                      <ClipboardList className="w-4 h-4 text-gray-300" />
                    </Link>
                  </div>
                </div>
              ))}

              {!selectedDate && (
                <>
                  <p className="text-sm font-semibold text-gray-500 px-1">Upcoming this month</p>
                  {Object.entries(dateMap)
                    .filter(([d]) => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(0, 10)
                    .map(([date, jobs]) => {
                      const dayBlocks = blocksByDate[date] ?? []
                      const blockHrs = dayBlocks.reduce((s, b) => s + b.hours, 0)
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className="w-full flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left active:bg-gray-50"
                        >
                          <div className="w-10 text-center flex-shrink-0">
                            <p className="text-xs text-gray-400 uppercase">
                              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </p>
                            <p className="text-lg font-bold text-gray-900 leading-none">
                              {new Date(date + 'T12:00:00').getDate()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            {jobs.slice(0, 2).map(j => (
                              <p key={j.id} className="text-sm text-gray-700 truncate">{j.customer_name}</p>
                            ))}
                            {jobs.length > 2 && <p className="text-xs text-gray-400">+{jobs.length - 2} more</p>}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-1">
                              {jobs.map(j => (
                                <span key={j.id} className={`w-2 h-2 rounded-full ${STATUS_COLOR[j.status]}`}
                                  style={catColor(j.category_id) ? { backgroundColor: catColor(j.category_id) } : undefined} />
                              ))}
                            </div>
                            {blockHrs > 0 && (
                              <span className="text-xs font-semibold text-blue-600">{blockHrs}h</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  {Object.keys(dateMap).filter(d =>
                    d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)
                  ).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">
                      No jobs scheduled this month.
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── UNSCHEDULED TAB ── */}
        {tab === 'unscheduled' && (
          <div className="p-4 space-y-3">
            {unscheduled.length === 0 ? (
              <div className="text-center py-16">
                <CalendarPlus className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">All jobs have a service date</p>
                <p className="text-gray-400 text-sm mt-1">Nice work!</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 px-1">{unscheduled.length} job{unscheduled.length !== 1 ? 's' : ''} need a date</p>
                {unscheduled.map(job => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
                        {job.customer_address && <p className="text-xs text-gray-400 truncate">{job.customer_address}</p>}
                        {job.estimated_hours && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />{job.estimated_hours} hours estimated
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openScheduler(job)}
                          className="text-xs text-blue-600 font-medium px-2 py-1 border border-blue-200 rounded-lg active:bg-blue-50"
                        >
                          Plan hours
                        </button>
                        <Link href={`/estimates/${job.id}`} className="text-xs text-gray-500 font-medium">
                          Open
                        </Link>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Service date</p>
                        <input
                          type="date"
                          defaultValue=""
                          onChange={e => {
                            setSchedDate(e.target.value)
                            setSchedulingJob(job)
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Crew</p>
                        <select
                          defaultValue={job.crew_id ?? ''}
                          onChange={e => {
                            setSchedulingJob(job)
                            setSchedCrew(e.target.value)
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">No crew</option>
                          {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!schedDate || schedulingJob?.id !== job.id) return
                        setSaving(true)
                        await updateEstimate(job.id, {
                          service_date: schedDate,
                          crew_id: schedCrew || null,
                        })
                        setSaving(false)
                        setSchedulingJob(null)
                        setSchedDate('')
                        setSchedCrew('')
                      }}
                      disabled={saving || schedulingJob?.id !== job.id || !schedDate}
                      className="w-full py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl active:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      Schedule this job
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Scheduling modal (calendar + "Plan hours" button) ── */}
      {schedulingJob && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSchedulingJob(null)}>
          <div className="bg-white w-full rounded-t-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 pt-5 pb-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{schedulingJob.customer_name}</p>
                {schedulingJob.customer_address && (
                  <p className="text-xs text-gray-400 truncate">{schedulingJob.customer_address}</p>
                )}
              </div>
              <button onClick={() => setSchedulingJob(null)} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Date + Crew + Total hours */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Service date</label>
                  <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold mb-1 block">Total est. hours</label>
                  <input type="number" value={schedHours} onChange={e => setSchedHours(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Assign crew</label>
                <select value={schedCrew} onChange={e => setSchedCrew(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">No crew</option>
                  {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <button
                onClick={saveSchedule}
                disabled={saving || !schedDate}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl active:bg-blue-700 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Date & Crew'}
              </button>

              {/* ── Work Days (hour blocking) ── */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">Work Days</p>
                  {totalHours && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      allocatedHours >= totalHours ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {allocatedHours}h / {totalHours}h
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {totalHours && totalHours > 0 && (
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all ${allocatedHours >= totalHours ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (allocatedHours / totalHours) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Existing blocks */}
                {jobBlocks.length === 0 && (
                  <p className="text-xs text-gray-400 mb-3">No work days blocked yet. Add days below to split the hours across your schedule.</p>
                )}
                {jobBlocks.map(block => (
                  <div key={block.id} className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-700">
                      {new Date(block.block_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-sm font-bold text-blue-600">{block.hours}h</span>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 text-gray-300 active:text-red-400 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Add block form */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="date"
                    value={blockDate}
                    onChange={e => setBlockDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={blockHours}
                    onChange={e => setBlockHours(e.target.value)}
                    placeholder="hrs"
                    min="0.5"
                    step="0.5"
                    className="w-20 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  />
                  <button
                    onClick={handleAddBlock}
                    disabled={!blockDate || !blockHours || addingBlock}
                    className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl active:bg-blue-700 disabled:opacity-40 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {totalHours && allocatedHours > totalHours && (
                  <p className="text-xs text-amber-600 mt-2">
                    Over-allocated by {(allocatedHours - totalHours).toFixed(1)}h — adjust or increase total hours
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
