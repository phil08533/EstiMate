'use client'

import { useState, useMemo, useRef } from 'react'
import {
  ClipboardList, Camera, CheckCircle, MapPin,
  Play, Square, ChevronDown, BookOpen, ChevronRight, Users,
} from 'lucide-react'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEmployees, useTimeEntries } from '@/lib/hooks/useEmployees'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCrews } from '@/lib/hooks/useCrews'
import { useMedia } from '@/lib/hooks/useMedia'
import { useTraining } from '@/lib/hooks/useTraining'
import { useTeam } from '@/lib/hooks/useTeam'
import type { Estimate } from '@/lib/types'

// ─── Mini after-photo uploader ─────────────────────────────────────────────────
function AfterPhotoUploader({ estimateId }: { estimateId: string }) {
  const { team } = useTeam()
  const { addMedia, media } = useMedia(estimateId)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const afterPhotos = media.filter(m => m.media_type === 'photo')

  async function handleFiles(files: FileList | null) {
    if (!files || !team?.id) return
    setUploading(true)
    for (const file of Array.from(files)) {
      await addMedia(file, team.id, estimateId)
    }
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      {afterPhotos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {afterPhotos.slice(-6).map(m => (
            <div key={m.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/estimate-media/${m.storage_path}`}
                alt="After photo"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 font-medium active:bg-gray-50 disabled:opacity-50"
      >
        <Camera className="w-4 h-4" />
        {uploading ? 'Uploading…' : `Add photo${afterPhotos.length > 0 ? ` (${afterPhotos.length} added)` : ''}`}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}

// ─── Job card with clock in/out ────────────────────────────────────────────────
function JobCard({ job, activeEntry, onClockIn, onClockOut }: {
  job: Estimate
  activeEntry: { id: string; estimate_id: string | null } | null
  onClockIn: (estimateId: string) => void
  onClockOut: (entryId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isClockedIn = activeEntry?.estimate_id === job.id
  const today = new Date().toISOString().split('T')[0]
  const isToday = job.service_date === today

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${isClockedIn ? 'border-green-400' : 'border-gray-200'}`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isClockedIn ? 'bg-green-500' : isToday ? 'bg-blue-500' : 'bg-gray-300'}`} />
            <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
            {isClockedIn && <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Clocked in</span>}
          </div>
          {job.customer_address && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 ml-4">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{job.customer_address}</span>
            </p>
          )}
          {job.service_date && (
            <p className={`text-xs font-medium mt-0.5 ml-4 ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
              {isToday ? 'Today' : new Date(job.service_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {job.estimated_hours ? ` · ${job.estimated_hours}h` : ''}
            </p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50">
          {job.comments && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Job notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.comments}</p>
            </div>
          )}

          {/* Clock in/out */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Time</p>
            {isClockedIn ? (
              <button
                onClick={() => onClockOut(activeEntry!.id)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 text-white font-semibold rounded-xl active:bg-red-700"
              >
                <Square className="w-4 h-4" />
                Clock Out
              </button>
            ) : (
              <button
                onClick={() => onClockIn(job.id)}
                disabled={!!activeEntry}
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-semibold rounded-xl active:bg-green-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {activeEntry ? 'Clock out of other job first' : 'Clock In'}
              </button>
            )}
          </div>

          {/* After photos */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">After photos</p>
            <AfterPhotoUploader estimateId={job.id} />
          </div>

          <Link
            href={`/estimates/${job.id}`}
            className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-medium bg-white active:bg-gray-100"
          >
            <ClipboardList className="w-4 h-4" />
            View full estimate
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Main portal page ──────────────────────────────────────────────────────────
export default function PortalPage() {
  const { user, profile } = useAuth()
  const { employees, loading: empLoading } = useEmployees()
  const { estimates, loading: estLoading } = useEstimates()
  const { crews, crewMembers, loading: crewLoad } = useCrews()
  const { modules: trainingModules } = useTraining()
  const [tab, setTab] = useState<'today' | 'upcoming' | 'training'>('today')

  const myEmployee = useMemo(
    () => employees.find(e => e.profile_id === user?.id),
    [employees, user?.id]
  )

  const myCrewIds = useMemo(() => {
    if (!myEmployee) return []
    return crewMembers.filter(m => m.employee_id === myEmployee.id).map(m => m.crew_id)
  }, [myEmployee, crewMembers])

  const { entries, clockIn, clockOut } = useTimeEntries(myEmployee?.id)

  // Active (clocked-in) time entry — no clock_out yet
  const activeEntry = useMemo(
    () => entries.find(e => !e.clock_out) ?? null,
    [entries]
  )

  // My jobs: assigned directly or via crew
  const myJobs = useMemo(() => {
    return estimates.filter(e =>
      e.status === 'sold' &&
      (e.assigned_to === user?.id || (e.crew_id && myCrewIds.includes(e.crew_id)))
    ).sort((a, b) => {
      if (a.service_date && b.service_date) return a.service_date.localeCompare(b.service_date)
      if (a.service_date) return -1
      if (b.service_date) return 1
      return 0
    })
  }, [estimates, user?.id, myCrewIds])

  const today = new Date().toISOString().split('T')[0]
  const todayJobs = myJobs.filter(j => j.service_date === today)
  const upcomingJobs = myJobs.filter(j => j.service_date && j.service_date > today)
  const unscheduledJobs = myJobs.filter(j => !j.service_date)
  const publicModules = trainingModules.filter(m => m.is_public)

  async function handleClockIn(estimateId: string) {
    if (!myEmployee) return
    await clockIn({ employee_id: myEmployee.id, estimate_id: estimateId, clock_in: new Date().toISOString(), break_mins: 0, notes: null })
  }

  async function handleClockOut(entryId: string) {
    await clockOut(entryId)
  }

  const loading = empLoading || estLoading || crewLoad
  if (loading) return <><TopBar title="My Portal" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  function getCrewName(crewId: string | null) {
    if (!crewId) return null
    return crews.find(c => c.id === crewId)?.name ?? null
  }

  return (
    <>
      <TopBar title="My Portal" />
      <div className="pb-28">

        {/* Welcome + status bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-5 text-white">
          <p className="text-blue-200 text-sm">Welcome back,</p>
          <p className="text-xl font-bold">{firstName}</p>
          {myEmployee && (
            <p className="text-blue-200 text-sm mt-0.5 capitalize">{myEmployee.role.replace('_', ' ')}</p>
          )}
          {activeEntry && (
            <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse flex-shrink-0" />
              <p className="text-sm font-semibold">
                Clocked in since {new Date(activeEntry.clock_in).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
          )}
          {!myEmployee && (
            <div className="mt-3 bg-white/20 rounded-xl px-3 py-2">
              <p className="text-sm text-blue-100">No employee profile linked. Ask your manager to link your account.</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white">
          {([
            ['today', `Today${todayJobs.length > 0 ? ` (${todayJobs.length})` : ''}`],
            ['upcoming', `Upcoming${upcomingJobs.length > 0 ? ` (${upcomingJobs.length})` : ''}`],
            ['training', `Training${publicModules.length > 0 ? ` (${publicModules.length})` : ''}`],
          ] as ['today' | 'upcoming' | 'training', string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-semibold transition-colors ${tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-3">
          {/* ── TODAY ── */}
          {tab === 'today' && (
            <>
              {todayJobs.length === 0 && unscheduledJobs.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No jobs scheduled for today</p>
                  <p className="text-gray-400 text-sm mt-1">Check the Upcoming tab for future work</p>
                </div>
              )}

              {todayJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  activeEntry={activeEntry}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                />
              ))}

              {unscheduledJobs.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-2">Unscheduled</p>
                  {unscheduledJobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                          activeEntry={activeEntry}
                      onClockIn={handleClockIn}
                      onClockOut={handleClockOut}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* ── UPCOMING ── */}
          {tab === 'upcoming' && (
            <>
              {upcomingJobs.length === 0 && (
                <div className="text-center py-12">
                  <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No upcoming scheduled jobs</p>
                </div>
              )}
              {upcomingJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  activeEntry={activeEntry}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                />
              ))}
            </>
          )}

          {/* ── TRAINING ── */}
          {tab === 'training' && (
            <>
              {publicModules.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No training available yet</p>
                  <p className="text-gray-400 text-sm mt-1">Your manager will post guides here</p>
                </div>
              )}
              {publicModules.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {publicModules.map((mod, i) => (
                    <Link
                      key={mod.id}
                      href={`/training/${mod.id}`}
                      className={`flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 ${i < publicModules.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{mod.title}</p>
                        {mod.description && <p className="text-xs text-gray-400 truncate">{mod.description}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* My crew info */}
          {myCrewIds.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">
                Your crew{myCrewIds.length > 1 ? 's' : ''}: <span className="font-semibold text-gray-700">
                  {myCrewIds.map(id => getCrewName(id)).filter(Boolean).join(', ')}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
