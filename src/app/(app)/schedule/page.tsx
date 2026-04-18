'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import PageHelp from '@/components/ui/PageHelp'
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

export default function SchedulePage() {
  const { estimates, loading } = useEstimates()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Map date string → estimates (service_date or follow_up_date)
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

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate())

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedJobs = selectedDate ? (dateMap[selectedDate] ?? []) : []

  if (loading) return <><TopBar title="Schedule" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Schedule" />
      <div className="pb-28">
        {/* Month nav */}
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

        {/* Day labels */}
        <div className="grid grid-cols-7 bg-white border-b border-gray-200">
          {DAY_LABELS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
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
                }`}>
                  {day}
                </span>
                {jobs.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {jobs.slice(0, 3).map(j => (
                      <span key={j.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[j.status] ?? 'bg-gray-400'}`} />
                    ))}
                    {jobs.length > 3 && <span className="text-[9px] text-gray-400">+{jobs.length - 3}</span>}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected date jobs */}
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
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_COLOR[est.status]}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{est.customer_name}</p>
                {est.customer_address && (
                  <p className="text-xs text-gray-400 truncate">{est.customer_address}</p>
                )}
              </div>
              <ClipboardList className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}

          {/* Upcoming overview */}
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
                    <div className="w-10 text-center">
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
                        <span key={j.id} className={`w-2 h-2 rounded-full ${STATUS_COLOR[j.status]}`} />
                      ))}
                    </div>
                  </button>
                ))}
              {Object.keys(dateMap).filter(d =>
                d.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`)
              ).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No jobs scheduled this month. Set service dates on your estimates to see them here.
                </p>
              )}
            </>
          )}
        </div>

        <div className="px-4">
          <PageHelp
            title="Schedule"
            intro="The schedule shows all jobs that have a service date or follow-up date set. Color dots match job status: amber = needs estimate, blue = sent, green = sold, red = lost."
            steps={[
              'Open any estimate and set the service date or follow-up date.',
              'Come back to Schedule — the job appears on that date.',
              'Tap a date on the calendar to see all jobs for that day.',
              'Tap any job row to open the full estimate detail.',
            ]}
            tips={[
              'Set service dates when you book a job so your whole team can see the calendar.',
              'Follow-up dates also appear on the calendar as reminders.',
            ]}
          />
        </div>
      </div>
    </>
  )
}
