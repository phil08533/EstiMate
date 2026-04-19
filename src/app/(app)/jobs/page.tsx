'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, Clock, Users, ChevronRight, Filter } from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCrews } from '@/lib/hooks/useCrews'
import { useEmployees } from '@/lib/hooks/useEmployees'
import { useAuth } from '@/lib/hooks/useAuth'

type JobTab = 'my' | 'crew' | 'unscheduled' | 'all'

const STATUS_DOT: Record<string, string> = {
  need_to_estimate: 'bg-amber-400',
  sent:  'bg-blue-400',
  sold:  'bg-green-400',
  lost:  'bg-red-400',
}

export default function JobsPage() {
  const { estimates, loading: eLoad } = useEstimates()
  const { crews, loading: crewLoad } = useCrews()
  const { employees } = useEmployees()
  const { user } = useAuth()
  const [tab, setTab] = useState<JobTab>('my')
  const [selectedCrew, setSelectedCrew] = useState<string>('all')

  const myEmployee = useMemo(() =>
    employees.find(e => e.profile_id === user?.id),
  [employees, user?.id])

  const jobs = useMemo(() => {
    switch (tab) {
      case 'my':
        return estimates.filter(e =>
          e.status === 'sold' && (e.assigned_to === user?.id || e.assigned_to === myEmployee?.profile_id)
        )
      case 'crew':
        return estimates.filter(e =>
          e.status === 'sold' &&
          (selectedCrew === 'all' || e.crew_id === selectedCrew)
        )
      case 'unscheduled':
        return estimates.filter(e =>
          (e.status === 'sold' || e.status === 'need_to_estimate') && !e.service_date
        )
      case 'all':
      default:
        return estimates.filter(e => e.status !== 'lost')
    }
  }, [tab, estimates, user?.id, myEmployee, selectedCrew])

  const sortedJobs = useMemo(() =>
    [...jobs].sort((a, b) => {
      if (a.service_date && b.service_date) return a.service_date.localeCompare(b.service_date)
      if (a.service_date) return -1
      if (b.service_date) return 1
      return b.created_at.localeCompare(a.created_at)
    }),
  [jobs])

  if (eLoad || crewLoad) return <><TopBar title="Jobs" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  const today = new Date().toISOString().split('T')[0]

  function crewName(crewId: string | null) {
    if (!crewId) return null
    return crews.find(c => c.id === crewId)?.name ?? null
  }

  return (
    <>
      <TopBar title="Jobs" />
      <div className="pb-28">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {([
            ['my', 'My Jobs'],
            ['crew', 'By Crew'],
            ['unscheduled', 'Unscheduled'],
            ['all', 'All'],
          ] as [JobTab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Crew filter (only on crew tab) */}
        {tab === 'crew' && crews.length > 0 && (
          <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-gray-100">
            <button
              onClick={() => setSelectedCrew('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 transition-colors ${
                selectedCrew === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              All Crews
            </button>
            {crews.map(crew => (
              <button
                key={crew.id}
                onClick={() => setSelectedCrew(crew.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 transition-colors ${
                  selectedCrew === crew.id ? 'text-white border-transparent' : 'bg-white text-gray-600 border-gray-300'
                }`}
                style={selectedCrew === crew.id ? { backgroundColor: crew.color } : {}}
              >
                {crew.name}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 space-y-2">
          {sortedJobs.length === 0 && (
            <div className="text-center py-16">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {tab === 'my' ? 'No jobs assigned to you' :
                 tab === 'unscheduled' ? 'All jobs are scheduled' :
                 'No jobs found'}
              </p>
              {tab === 'unscheduled' && (
                <p className="text-gray-400 text-sm mt-1">Great work — everything has a date!</p>
              )}
            </div>
          )}

          {sortedJobs.map(job => {
            const isToday = job.service_date === today
            const isPast = job.service_date && job.service_date < today
            const crew = crewName(job.crew_id)

            return (
              <Link
                key={job.id}
                href={`/estimates/${job.id}`}
                className="flex items-start gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3.5 active:bg-gray-50"
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[job.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
                  {job.customer_address && (
                    <p className="text-xs text-gray-400 truncate">{job.customer_address}</p>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {job.service_date && (
                      <span className={`text-xs font-medium ${isToday ? 'text-green-600' : isPast ? 'text-red-500' : 'text-gray-500'}`}>
                        {isToday ? 'Today' : new Date(job.service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {job.estimated_hours && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />{job.estimated_hours}h
                      </span>
                    )}
                    {crew && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Users className="w-3 h-3" />{crew}
                      </span>
                    )}
                    {!job.service_date && (
                      <span className="text-xs font-medium text-amber-500 flex items-center gap-0.5">
                        <Filter className="w-3 h-3" />Unscheduled
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
