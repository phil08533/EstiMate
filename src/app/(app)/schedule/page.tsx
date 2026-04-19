'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ClipboardList, CalendarPlus, Clock, Users } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCrews } from '@/lib/hooks/useCrews'
import { useServiceCategories } from '@/lib/hooks/useServiceCategories'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Link from 'next/link'
import type { EstimateWithProfiles } from '@/lib/types'

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

  function openScheduler(job: EstimateWithProfiles) {
    setSchedulingJob(job)
    setSchedDate(todayStr)
    setSchedCrew(job.crew_id ?? '')
    setSchedHours(String(job.estimated_hours ?? ''))
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
                if (!day) return <div key={`empty-${i}`} className="h-14 border-b border-r border-gray-100" />
                const dateStr = isoDate(viewYear, viewMonth, day)
                const jobs = dateMap[dateStr] ?? []
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`h-14 border-b border-r border-gray-100 p-1 flex flex-col items-center transition-colors ${
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
                  </button>
                )
              })}
            </div>

            <div className="p-4 space-y-2">
              {selectedDate && (
                <p className="text-sm font-semibold text-gray-500 px-1">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  {' '}— {selectedJobs.length} job{selectedJobs.length !== 1 ? 's' : ''}
                </p>
              )}
              {selectedDate && selectedJobs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No jobs scheduled for this day</p>
              )}
              {(selectedDate ? selectedJobs : []).map(est => (
                <Link
                  key={est.id}
                  href={`/estimates/${est.id}`}
                  className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 active:bg-gray-50"
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
                  <ClipboardList className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}

              {!selectedDate && (
                <>
                  <p className="text-sm font-semibold text-gray-500 px-1">Upcoming this month</p>
                  {Object.entries(dateMap)
                    .filter(([d]) => d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(0, 10)
                    .map(([date, jobs]) => (
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
                        <div className="flex gap-1">
                          {jobs.map(j => (
                            <span key={j.id} className={`w-2 h-2 rounded-full ${STATUS_COLOR[j.status]}`}
                              style={catColor(j.category_id) ? { backgroundColor: catColor(j.category_id) } : undefined} />
                          ))}
                        </div>
                      </button>
                    ))}
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
                      <Link href={`/estimates/${job.id}`} className="text-xs text-blue-600 font-medium flex-shrink-0">
                        Open
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Service date</p>
                        <input
                          type="date"
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) openScheduler({ ...job, service_date: null })
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

      {/* Scheduling modal (for calendar tap → schedule) */}
      {schedulingJob && tab === 'calendar' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={() => setSchedulingJob(null)}>
          <div className="bg-white w-full rounded-t-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-gray-900">Schedule: {schedulingJob.customer_name}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Service date</label>
                <input type="date" value={schedDate} onChange={e => setSchedDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold mb-1 block">Est. hours</label>
                <input type="number" value={schedHours} onChange={e => setSchedHours(e.target.value)}
                  placeholder="e.g. 8"
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
              {saving ? 'Saving…' : 'Save Schedule'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
