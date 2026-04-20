'use client'

import { useState } from 'react'
import { Phone, Mail, MapPin, Plus, Trash2, ClipboardList, ChevronRight } from 'lucide-react'
import { useCustomers, useContactLogs } from '@/lib/hooks/useCRM'
import { useCustomerEstimates } from '@/lib/hooks/useCustomerEstimates'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import { getStatusColor } from '@/lib/utils/status'
import type { ContactLogType } from '@/lib/types'

const LOG_TYPES: { value: ContactLogType; label: string }[] = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
  { value: 'visit', label: 'Visit' },
  { value: 'note', label: 'Note' },
]

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const { customers, loading, updateCustomer, deleteCustomer } = useCustomers()
  const { logs, loading: logsLoading, addLog, deleteLog } = useContactLogs(id)
  const { estimates: jobHistory, loading: jobsLoading } = useCustomerEstimates(id)
  const { createEstimate } = useEstimates()
  const router = useRouter()
  const [logType, setLogType] = useState<ContactLogType>('call')
  const [logText, setLogText] = useState('')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [creatingEst, setCreatingEst] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const customer = customers.find(c => c.id === id)

  if (loading || logsLoading || jobsLoading) return <><TopBar title="Client" backHref="/crm" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>
  if (!customer) return <><TopBar title="Client" backHref="/crm" /><div className="p-4 text-center text-gray-500">Not found</div></>

  function startEdit() {
    setEditName(customer!.full_name)
    setEditPhone(customer!.phone ?? '')
    setEditEmail(customer!.email ?? '')
    setEditAddress(customer!.address ?? '')
    setEditNotes(customer!.notes ?? '')
    setEditing(true)
  }

  async function saveEdit() {
    await updateCustomer(id, {
      full_name: editName.trim() || customer!.full_name,
      phone: editPhone || null, email: editEmail || null,
      address: editAddress || null, notes: editNotes || null,
    })
    setEditing(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this client?')) return
    await deleteCustomer(id)
    router.replace('/crm')
  }

  async function handleCreateEstimate() {
    setCreatingEst(true)
    const est = await createEstimate({
      customer_name: customer!.full_name,
      customer_phone: customer!.phone ?? null,
      customer_email: customer!.email ?? null,
      customer_address: customer!.address ?? null,
      comments: customer!.notes ?? null,
      status: 'need_to_estimate',
      assigned_to: null,
      follow_up_date: null,
      service_date: null,
      customer_id: id,
    })
    router.push(`/estimates/${est.id}`)
  }

  async function handleAddLog(e: React.FormEvent) {
    e.preventDefault()
    if (!logText.trim()) return
    setAdding(true)
    await addLog({ log_type: logType, summary: logText.trim(), customer_id: id, lead_id: null })
    setAdding(false)
    setLogText('')
  }

  return (
    <>
      <TopBar
        title={customer.full_name}
        backHref="/crm"
        right={
          <button onClick={handleDelete} className="p-1.5 text-red-400 active:bg-red-50 rounded-lg">
            <Trash2 className="w-5 h-5" />
          </button>
        }
      />
      <div className="p-4 space-y-4 pb-28">

        {/* Info card */}
        {editing ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full name"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="grid grid-cols-2 gap-2">
              <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone"
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email"
                className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <input value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Address"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes" rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <div className="flex gap-2">
              <Button onClick={saveEdit} className="flex-1">Save</Button>
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {customer.full_name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{customer.full_name}</h2>
                  {customer.source && <p className="text-xs text-gray-400">via {customer.source}</p>}
                </div>
              </div>
              <button onClick={startEdit} className="text-xs text-blue-600 font-medium px-3 py-1.5 rounded-lg border border-blue-200 active:bg-blue-50">
                Edit
              </button>
            </div>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-blue-600 text-sm">
                <Phone className="w-4 h-4" />{customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-blue-600 text-sm">
                <Mail className="w-4 h-4" />{customer.email}
              </a>
            )}
            {customer.address && (
              <p className="flex items-start gap-2 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />{customer.address}
              </p>
            )}
            {customer.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{customer.notes}</p>}
          </div>
        )}

        {/* Job History */}
        <div>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="font-semibold text-gray-900">Job History</h3>
            <button
              onClick={handleCreateEstimate}
              disabled={creatingEst}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1.5 rounded-lg active:bg-blue-100 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {creatingEst ? 'Creating…' : 'New Estimate'}
            </button>
          </div>
          {jobHistory.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No linked estimates yet</p>
              <p className="text-xs text-gray-400 mt-1">Tap &ldquo;New Estimate&rdquo; above to create one for this client</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {jobHistory.map((est, i) => (
                <Link
                  key={est.id}
                  href={`/estimates/${est.id}`}
                  className={`flex items-center gap-3 px-4 py-3 active:bg-gray-50 ${i < jobHistory.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{est.customer_name}</p>
                    <p className="text-xs text-gray-400">
                      {est.service_date
                        ? new Date(est.service_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : new Date(est.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusColor(est.status)}`}>
                    {est.status.replace('_', ' ')}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Contact log */}
        <div>
          <h3 className="font-semibold text-gray-900 px-1 mb-2">Contact History</h3>
          <form onSubmit={handleAddLog} className="bg-white border border-gray-200 rounded-xl p-3 space-y-2 mb-2">
            <div className="flex flex-wrap gap-2">
              {LOG_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setLogType(t.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    logType === t.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={logText} onChange={e => setLogText(e.target.value)} placeholder="What happened?"
                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
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
            {logs.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No contact history yet</p>}
          </div>
        </div>
      </div>
    </>
  )
}
