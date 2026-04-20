'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Plus, Trash2, ArrowRight, UserCheck, ClipboardList } from 'lucide-react'
import { useLeads, useContactLogs } from '@/lib/hooks/useCRM'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import type { LeadStage, ContactLogType } from '@/lib/types'

const STAGES: { value: LeadStage; label: string; color: string }[] = [
  { value: 'new_lead',           label: 'New Lead',           color: 'bg-gray-100 text-gray-700' },
  { value: 'estimate_scheduled', label: 'Estimate Scheduled', color: 'bg-blue-100 text-blue-700' },
  { value: 'proposal_sent',      label: 'Proposal Sent',      color: 'bg-purple-100 text-purple-700' },
  { value: 'won',                label: 'Won',                color: 'bg-green-100 text-green-700' },
  { value: 'lost',               label: 'Lost',               color: 'bg-red-100 text-red-700' },
]

const LOG_TYPES: { value: ContactLogType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
  { value: 'visit', label: 'Visit' },
  { value: 'note', label: 'Note' },
]

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { leads, loading, moveLead, updateLead, convertToCustomer, deleteLead } = useLeads()
  const { logs, loading: logsLoading, addLog, deleteLog } = useContactLogs(undefined, id)
  const { createEstimate } = useEstimates()
  const router = useRouter()
  const [logType, setLogType] = useState<ContactLogType>('call')
  const [logText, setLogText] = useState('')
  const [adding, setAdding] = useState(false)
  const [creatingEst, setCreatingEst] = useState(false)

  const lead = leads.find(l => l.id === id)

  if (loading || logsLoading) return <><TopBar title="Lead" backHref="/crm" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>
  if (!lead) return <><TopBar title="Lead" backHref="/crm" /><div className="p-4 text-center text-gray-500">Not found</div></>

  async function handleConvert() {
    const customer = await convertToCustomer(lead!)
    if (customer) router.replace(`/crm/customers/${customer.id}`)
  }

  async function handleCreateEstimate() {
    setCreatingEst(true)
    const est = await createEstimate({
      customer_name: lead!.full_name,
      customer_phone: lead!.phone ?? null,
      customer_email: lead!.email ?? null,
      customer_address: lead!.address ?? null,
      comments: lead!.service_interest ?? null,
      status: 'need_to_estimate',
      assigned_to: null,
      follow_up_date: null,
      service_date: null,
      customer_id: null,
    })
    // Advance lead stage to estimate_scheduled
    await moveLead(id, 'estimate_scheduled')
    router.push(`/estimates/${est.id}`)
  }

  async function handleDelete() {
    if (!confirm('Delete this lead?')) return
    await deleteLead(id)
    router.replace('/crm')
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    if (!logText.trim()) return
    setAdding(true)
    await addLog({ log_type: logType, summary: logText.trim(), customer_id: null, lead_id: id })
    setAdding(false)
    setLogText('')
  }

  const stageCfg = STAGES.find(s => s.value === lead.stage)!

  return (
    <>
      <TopBar
        title={lead.full_name}
        backHref="/crm"
        right={
          <button onClick={handleDelete} className="p-1.5 text-red-400 active:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />
      <div className="p-4 space-y-4 pb-28">

        {/* Info card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${stageCfg.color}`}>{stageCfg.label}</span>
            {lead.estimated_value && (
              <span className="text-sm font-semibold text-green-700">${lead.estimated_value.toLocaleString()}</span>
            )}
          </div>
          {lead.service_interest && <p className="text-sm text-gray-600">{lead.service_interest}</p>}
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Phone className="w-4 h-4" />{lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-blue-600 text-sm">
              <Mail className="w-4 h-4" />{lead.email}
            </a>
          )}
          {lead.address && (
            <p className="flex items-start gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />{lead.address}
            </p>
          )}
          {lead.source && <p className="text-xs text-gray-400">Source: {lead.source}</p>}
          {lead.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{lead.notes}</p>}
        </div>

        {/* Stage pipeline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Pipeline Stage</p>
          <div className="flex flex-wrap gap-2">
            {STAGES.map(s => (
              <button
                key={s.value}
                onClick={() => moveLead(id, s.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                  lead.stage === s.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300'
                }`}
              >
                {lead.stage !== s.value && <ArrowRight className="w-3 h-3" />}
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <Button onClick={handleCreateEstimate} loading={creatingEst} className="w-full">
              <ClipboardList className="w-4 h-4 mr-2" />
              Create Estimate
            </Button>
            {lead.stage !== 'won' && (
              <Button onClick={handleConvert} className="w-full" variant="secondary">
                <UserCheck className="w-4 h-4 mr-2" />
                Convert to Client
              </Button>
            )}
          </div>
        </div>

        {/* Follow-up date */}
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 px-4 py-3">
          <span className="text-sm text-gray-600 flex-shrink-0">Follow-up</span>
          <input
            type="date"
            value={lead.follow_up_date ?? ''}
            onChange={e => updateLead(id, { follow_up_date: e.target.value || null })}
            className="flex-1 text-sm text-gray-800 outline-none bg-transparent"
          />
        </div>

        {/* Contact log */}
        <div>
          <h3 className="font-semibold text-gray-900 px-1 mb-2">Contact History</h3>
          <form onSubmit={handleAddLog} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 mb-2">
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setLogType(t.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    logType === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={logText}
                onChange={e => setLogText(e.target.value)}
                placeholder="What happened?"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="submit" size="sm" loading={adding} disabled={!logText.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </form>

          <div className="space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 flex-shrink-0 capitalize">
                  {log.log_type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{log.summary}</p>
                  <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteLog(log.id)} className="p-1.5 text-gray-300 active:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No contact history yet</p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
