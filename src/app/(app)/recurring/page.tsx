'use client'

import { useState } from 'react'
import { Plus, RefreshCw, Trash2, ChevronDown, ClipboardList } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { useRecurringJobs, advanceDate } from '@/lib/hooks/useRecurringJobs'
import { useEstimates } from '@/lib/hooks/useEstimates'
import type { RecurrenceFrequency } from '@/lib/types'

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
}

const FREQ_COLORS: Record<RecurrenceFrequency, string> = {
  weekly:    'bg-blue-100 text-blue-700',
  biweekly:  'bg-indigo-100 text-indigo-700',
  monthly:   'bg-purple-100 text-purple-700',
  quarterly: 'bg-amber-100 text-amber-700',
  annually:  'bg-gray-100 text-gray-600',
}

export default function RecurringPage() {
  const { jobs, loading, addJob, updateJob, deleteJob } = useRecurringJobs()
  const { createEstimate } = useEstimates()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [freq, setFreq] = useState<RecurrenceFrequency>('monthly')
  const [nextDate, setNextDate] = useState(new Date().toISOString().split('T')[0])

  function resetForm() {
    setName(''); setPhone(''); setEmail(''); setAddress('')
    setTitle(''); setDesc(''); setFreq('monthly')
    setNextDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !title.trim()) return
    setSaving(true)
    await addJob({
      customer_name: name.trim(),
      customer_phone: phone || null,
      customer_email: email || null,
      customer_address: address || null,
      customer_id: null,
      title: title.trim(),
      description: desc || null,
      frequency: freq,
      next_date: nextDate,
      assigned_to: null,
      is_active: true,
    })
    setSaving(false)
    resetForm()
  }

  async function handleGenerate(job: typeof jobs[0]) {
    setGenerating(job.id)
    await createEstimate({
      customer_name: job.customer_name,
      customer_phone: job.customer_phone,
      customer_email: job.customer_email,
      customer_address: job.customer_address,
      customer_id: job.customer_id,
      comments: job.description,
      status: 'need_to_estimate',
      service_date: job.next_date,
      follow_up_date: null,
      assigned_to: job.assigned_to,
    })
    // Advance next_date
    await updateJob(job.id, { next_date: advanceDate(job.next_date, job.frequency) })
    setGenerating(null)
  }

  if (loading) return <><TopBar title="Recurring Jobs" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  const today = new Date().toISOString().split('T')[0]
  const overdue = jobs.filter(j => j.is_active && j.next_date <= today)
  const upcoming = jobs.filter(j => j.is_active && j.next_date > today)
  const inactive = jobs.filter(j => !j.is_active)

  return (
    <>
      <TopBar title="Recurring Jobs" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Maintenance contracts and recurring services. Tap <strong>Generate Job</strong> to create a new estimate and auto-advance the next due date.</p>
        </div>

        {/* Add form */}
        {showForm ? (
          <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="font-semibold text-gray-900">New Recurring Job</p>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Customer Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone"
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Job Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Lawn Mowing"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Notes / scope (optional)" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Frequency</label>
                <div className="relative">
                  <select value={freq} onChange={e => setFreq(e.target.value as RecurrenceFrequency)}
                    className="w-full appearance-none border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white pr-8 outline-none focus:ring-2 focus:ring-blue-500">
                    {(Object.keys(FREQ_LABELS) as RecurrenceFrequency[]).map(f => (
                      <option key={f} value={f}>{FREQ_LABELS[f]}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">First Date</label>
                <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving} disabled={!name.trim() || !title.trim()} className="flex-1">Save</Button>
              <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">Cancel</Button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium active:bg-gray-50"
          >
            <Plus className="w-5 h-5" />Add recurring job
          </button>
        )}

        {/* Overdue */}
        {overdue.length > 0 && (
          <Section title="Due / Overdue" accent="text-red-600" jobs={overdue}
            generating={generating} onGenerate={handleGenerate} onDelete={deleteJob} onToggle={id => updateJob(id, { is_active: false })} />
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <Section title="Upcoming" accent="text-gray-700" jobs={upcoming}
            generating={generating} onGenerate={handleGenerate} onDelete={deleteJob} onToggle={id => updateJob(id, { is_active: false })} />
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <Section title="Paused" accent="text-gray-400" jobs={inactive}
            generating={generating} onGenerate={handleGenerate} onDelete={deleteJob} onToggle={id => updateJob(id, { is_active: true })} inactive />
        )}

        {jobs.length === 0 && !showForm && (
          <div className="text-center py-16">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No recurring jobs yet</p>
            <p className="text-gray-400 text-sm mt-1">Add maintenance contracts, regular mowing, cleanups, and more</p>
          </div>
        )}
      </div>
    </>
  )
}

function Section({
  title, accent, jobs, generating, onGenerate, onDelete, onToggle, inactive,
}: {
  title: string
  accent: string
  jobs: ReturnType<typeof useRecurringJobs>['jobs']
  generating: string | null
  onGenerate: (job: ReturnType<typeof useRecurringJobs>['jobs'][0]) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  inactive?: boolean
}) {
  return (
    <div>
      <h3 className={`font-semibold px-1 mb-2 ${accent}`}>{title}</h3>
      <div className="space-y-2">
        {jobs.map(job => (
          <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{job.customer_name}</p>
                <p className="text-xs text-gray-500 truncate">{job.title}</p>
                {job.customer_address && <p className="text-xs text-gray-400 truncate">{job.customer_address}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${FREQ_COLORS[job.frequency]}`}>
                {FREQ_LABELS[job.frequency]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Next: <span className="font-semibold text-gray-700">
                  {new Date(job.next_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggle(job.id)}
                  className="text-xs text-gray-400 underline underline-offset-2"
                >
                  {inactive ? 'Resume' : 'Pause'}
                </button>
                <button onClick={() => onDelete(job.id)} className="p-1.5 text-gray-300 active:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {!inactive && (
                  <button
                    onClick={() => onGenerate(job)}
                    disabled={generating === job.id}
                    className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg px-3 py-1.5 active:bg-blue-700 disabled:opacity-50"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    {generating === job.id ? 'Creating…' : 'Generate Job'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
