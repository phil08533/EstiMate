'use client'

import { useState, useMemo, useRef } from 'react'
import {
  ClipboardList, Camera, CheckCircle, MapPin,
  Play, Square, ChevronDown, BookOpen, ChevronRight, Users,
  TrendingUp, DollarSign, Award, X, CheckCircle2, LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/lib/hooks/useAuth'
import { useEmployees, useTimeEntries } from '@/lib/hooks/useEmployees'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useCrews } from '@/lib/hooks/useCrews'
import { useMedia } from '@/lib/hooks/useMedia'
import { useTraining } from '@/lib/hooks/useTraining'
import { useTeam } from '@/lib/hooks/useTeam'
import { createClient } from '@/lib/supabase/client'
import type { Estimate, Employee } from '@/lib/types'

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

// ─── Job card ──────────────────────────────────────────────────────────────────
function JobCard({ job, activeEntry, onClockIn, onClockOut, onComplete, isCompleted }: {
  job: Estimate
  activeEntry: { id: string; estimate_id: string | null } | null
  onClockIn: (estimateId: string) => void
  onClockOut: (entryId: string) => void
  onComplete: (job: Estimate) => void
  isCompleted?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isClockedIn = activeEntry?.estimate_id === job.id
  const today = new Date().toISOString().split('T')[0]
  const isToday = job.service_date === today

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${
      isCompleted ? 'border-green-300 opacity-75' : isClockedIn ? 'border-green-400' : 'border-gray-200'
    }`}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isCompleted ? 'bg-green-500' : isClockedIn ? 'bg-green-500' : isToday ? 'bg-blue-500' : 'bg-gray-300'
            }`} />
            <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
            {isCompleted && <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Done</span>}
            {isClockedIn && !isCompleted && <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">Clocked in</span>}
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

          {!isCompleted && (
            <>
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

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">After photos</p>
                <AfterPhotoUploader estimateId={job.id} />
              </div>

              <button
                onClick={() => onComplete(job)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl active:bg-blue-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark Job Complete
              </button>
            </>
          )}

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

// ─── Profitability grade ───────────────────────────────────────────────────────
function profitGrade(margin: number) {
  if (margin >= 50) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' }
  if (margin >= 35) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' }
  if (margin >= 20) return { label: 'Tight', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' }
  return { label: 'Below Target', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
}

interface JobStats {
  revenue: number
  laborCost: number
  laborHours: number
  profit: number
  margin: number
}

// ─── Portal page ───────────────────────────────────────────────────────────────
export default function PortalPage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { employees, loading: empLoading } = useEmployees()
  const { estimates, loading: estLoading, updateEstimate } = useEstimates()
  const { crews, crewMembers, loading: crewLoad } = useCrews()
  const { modules: trainingModules } = useTraining()
  const [tab, setTab] = useState<'today' | 'upcoming' | 'training'>('today')
  const [completingJob, setCompletingJob] = useState<Estimate | null>(null)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [completing, setCompleting] = useState(false)

  const myEmployee = useMemo(
    () => employees.find(e => e.profile_id === user?.id),
    [employees, user?.id]
  )

  const myCrewIds = useMemo(() => {
    if (!myEmployee) return []
    return crewMembers.filter(m => m.employee_id === myEmployee.id).map(m => m.crew_id)
  }, [myEmployee, crewMembers])

  const { entries, clockIn, clockOut } = useTimeEntries(myEmployee?.id)

  const activeEntry = useMemo(
    () => entries.find(e => !e.clock_out) ?? null,
    [entries]
  )

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
  const activeJobs = myJobs.filter(j => !j.completed_at)
  const completedJobs = myJobs.filter(j => !!j.completed_at)
  const todayJobs = activeJobs.filter(j => j.service_date === today)
  const upcomingJobs = activeJobs.filter(j => j.service_date && j.service_date > today)
  const unscheduledJobs = activeJobs.filter(j => !j.service_date)
  const publicModules = trainingModules.filter(m => m.is_public)

  async function handleClockIn(estimateId: string) {
    if (!myEmployee) return
    await clockIn({ employee_id: myEmployee.id, estimate_id: estimateId, clock_in: new Date().toISOString(), break_mins: 0, notes: null })
  }

  async function handleClockOut(entryId: string) {
    await clockOut(entryId)
  }

  async function openCompleteModal(job: Estimate) {
    setCompletingJob(job)
    setJobStats(null)
    setStatsLoading(true)
    const supabase = createClient()
    const [{ data: timeEntries }, { data: payments }] = await Promise.all([
      supabase.from('time_entries').select('*').eq('estimate_id', job.id),
      supabase.from('payments').select('*').eq('estimate_id', job.id),
    ])

    const revenue = (payments ?? []).reduce((s: number, p: { amount: number }) => s + p.amount, 0)

    let laborCost = 0
    let laborHours = 0
    for (const entry of (timeEntries ?? []) as { clock_in: string; clock_out: string | null; break_mins: number; employee_id: string }[]) {
      if (!entry.clock_out) continue
      const hrs = (new Date(entry.clock_out).getTime() - new Date(entry.clock_in).getTime()) / 3_600_000 - (entry.break_mins / 60)
      laborHours += hrs
      const emp = employees.find((e: Employee) => e.id === entry.employee_id)
      if (emp?.pay_rate) laborCost += hrs * emp.pay_rate
    }

    const profit = revenue - laborCost
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0

    setJobStats({ revenue, laborCost, laborHours, profit, margin })
    setStatsLoading(false)
  }

  async function handleConfirmComplete() {
    if (!completingJob) return
    setCompleting(true)
    await updateEstimate(completingJob.id, { completed_at: new Date().toISOString() })
    setCompleting(false)
    setCompletingJob(null)
    setJobStats(null)
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  function getCrewName(crewId: string | null) {
    if (!crewId) return null
    return crews.find(c => c.id === crewId)?.name ?? null
  }

  function fmt(n: number) {
    return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  }

  const loading = empLoading || estLoading || crewLoad
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <>
      {/* Standalone top bar — no nav links */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <span className="font-bold text-gray-900 text-base">EstiMate</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 active:text-red-500 px-2 py-1.5 rounded-lg active:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="pb-10">

          {/* Welcome hero */}
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
            {/* TODAY */}
            {tab === 'today' && (
              <>
                {todayJobs.length === 0 && unscheduledJobs.length === 0 && completedJobs.length === 0 && (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No jobs scheduled for today</p>
                    <p className="text-gray-400 text-sm mt-1">Check the Upcoming tab for future work</p>
                  </div>
                )}
                {todayJobs.map(job => (
                  <JobCard key={job.id} job={job} activeEntry={activeEntry}
                    onClockIn={handleClockIn} onClockOut={handleClockOut} onComplete={openCompleteModal} />
                ))}
                {unscheduledJobs.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-2">Unscheduled</p>
                    {unscheduledJobs.map(job => (
                      <JobCard key={job.id} job={job} activeEntry={activeEntry}
                        onClockIn={handleClockIn} onClockOut={handleClockOut} onComplete={openCompleteModal} />
                    ))}
                  </>
                )}
                {completedJobs.length > 0 && (
                  <>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 pt-2">Completed</p>
                    {completedJobs.map(job => (
                      <JobCard key={job.id} job={job} activeEntry={activeEntry}
                        onClockIn={handleClockIn} onClockOut={handleClockOut} onComplete={openCompleteModal} isCompleted />
                    ))}
                  </>
                )}
              </>
            )}

            {/* UPCOMING */}
            {tab === 'upcoming' && (
              <>
                {upcomingJobs.length === 0 && (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No upcoming scheduled jobs</p>
                  </div>
                )}
                {upcomingJobs.map(job => (
                  <JobCard key={job.id} job={job} activeEntry={activeEntry}
                    onClockIn={handleClockIn} onClockOut={handleClockOut} onComplete={openCompleteModal} />
                ))}
              </>
            )}

            {/* TRAINING */}
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

            {myCrewIds.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">
                  Your crew{myCrewIds.length > 1 ? 's' : ''}: <span className="font-semibold text-gray-700">
                    {myCrewIds.map(cid => getCrewName(cid)).filter(Boolean).join(', ')}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Job Modal */}
      {completingJob && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => !completing && setCompletingJob(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">Complete Job</p>
                <p className="text-sm text-gray-500">{completingJob.customer_name}</p>
              </div>
              <button onClick={() => setCompletingJob(null)} className="p-2 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {statsLoading && <div className="flex justify-center py-8"><Spinner size="lg" /></div>}

            {!statsLoading && jobStats && (
              <>
                {jobStats.revenue > 0 ? (() => {
                  const grade = profitGrade(jobStats.margin)
                  return (
                    <div className={`rounded-2xl border p-4 ${grade.bg} ${grade.border}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <Award className={`w-5 h-5 ${grade.color}`} />
                        <span className={`font-bold text-lg ${grade.color}`}>{grade.label}</span>
                        <span className={`ml-auto text-2xl font-bold ${grade.color}`}>{Math.round(jobStats.margin)}%</span>
                      </div>
                      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${jobStats.margin >= 35 ? 'bg-green-500' : jobStats.margin >= 20 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.min(100, Math.max(2, jobStats.margin))}%` }}
                        />
                      </div>
                      <p className={`text-xs mt-1.5 ${grade.color} opacity-70`}>Profit margin</p>
                    </div>
                  )
                })() : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
                    <p className="text-sm text-gray-500">No payments recorded — margin unavailable</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-xl p-3">
                    <TrendingUp className="w-4 h-4 text-green-600 mb-1" />
                    <p className="text-xs text-green-700 font-medium">Revenue</p>
                    <p className="font-bold text-green-800">{fmt(jobStats.revenue)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <DollarSign className="w-4 h-4 text-red-500 mb-1" />
                    <p className="text-xs text-red-600 font-medium">Labor Cost</p>
                    <p className="font-bold text-red-700">{fmt(jobStats.laborCost)}</p>
                  </div>
                  <div className={`rounded-xl p-3 col-span-2 ${jobStats.profit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                    <p className={`text-xs font-medium ${jobStats.profit >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>Gross Profit</p>
                    <p className={`font-bold text-lg ${jobStats.profit >= 0 ? 'text-blue-800' : 'text-orange-700'}`}>{fmt(jobStats.profit)}</p>
                    {jobStats.laborHours > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{jobStats.laborHours.toFixed(1)} hours logged · {fmt(jobStats.laborHours > 0 ? jobStats.revenue / jobStats.laborHours : 0)}/hr</p>
                    )}
                  </div>
                </div>

                {jobStats.laborCost === 0 && jobStats.laborHours === 0 && (
                  <p className="text-xs text-gray-400 text-center">No time entries found — clock in/out to track labor cost</p>
                )}
              </>
            )}

            <button
              onClick={handleConfirmComplete}
              disabled={completing || statsLoading}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-2xl active:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {completing ? 'Completing…' : 'Confirm Job Complete'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
