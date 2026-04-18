'use client'

import { useState } from 'react'
import { Plus, Phone, Mail, MapPin, Trash2, ChevronRight, UserCheck, ArrowRight, Search } from 'lucide-react'
import { useCustomers, useLeads } from '@/lib/hooks/useCRM'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Link from 'next/link'
import type { LeadStage } from '@/lib/types'

type CRMTab = 'leads' | 'customers'

const STAGES: { value: LeadStage; label: string; color: string; bg: string }[] = [
  { value: 'new_lead',           label: 'New Lead',           color: 'text-gray-700',   bg: 'bg-gray-100' },
  { value: 'estimate_scheduled', label: 'Estimate Scheduled', color: 'text-blue-700',   bg: 'bg-blue-100' },
  { value: 'proposal_sent',      label: 'Proposal Sent',      color: 'text-purple-700', bg: 'bg-purple-100' },
  { value: 'won',                label: 'Won',                color: 'text-green-700',  bg: 'bg-green-100' },
  { value: 'lost',               label: 'Lost',               color: 'text-red-700',    bg: 'bg-red-100' },
]

const SOURCES = ['Referral', 'Google', 'Facebook', 'Mailer', 'Door hanger', 'Drive by', 'Other']

export default function CRMPage() {
  const { customers, loading: cLoading, addCustomer, deleteCustomer } = useCustomers()
  const { leads, loading: lLoading, addLead, moveLead, convertToCustomer } = useLeads()
  const [tab, setTab] = useState<CRMTab>('leads')
  const [search, setSearch] = useState('')
  const [showAddLead, setShowAddLead] = useState(false)
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  // Lead form
  const [lName, setLName] = useState('')
  const [lPhone, setLPhone] = useState('')
  const [lEmail, setLEmail] = useState('')
  const [lAddress, setLAddress] = useState('')
  const [lService, setLService] = useState('')
  const [lValue, setLValue] = useState('')
  const [lSource, setLSource] = useState('')
  const [lNotes, setLNotes] = useState('')
  const [lSaving, setLSaving] = useState(false)

  // Customer form
  const [cName, setCName] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cAddress, setCAddress] = useState('')
  const [cSource, setCSource] = useState('')
  const [cNotes, setCNotes] = useState('')
  const [cSaving, setCSaving] = useState(false)

  const loading = cLoading || lLoading

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    if (!lName.trim()) return
    setLSaving(true)
    await addLead({
      full_name: lName.trim(), phone: lPhone || null, email: lEmail || null,
      address: lAddress || null, service_interest: lService || null,
      estimated_value: lValue ? parseFloat(lValue) : null,
      source: lSource || null, notes: lNotes || null,
      stage: 'new_lead', assigned_to: null, follow_up_date: null, customer_id: null,
    })
    setLSaving(false)
    setLName(''); setLPhone(''); setLEmail(''); setLAddress(''); setLService(''); setLValue(''); setLSource(''); setLNotes('')
    setShowAddLead(false)
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!cName.trim()) return
    setCSaving(true)
    await addCustomer({
      full_name: cName.trim(), phone: cPhone || null, email: cEmail || null,
      address: cAddress || null, source: cSource || null, notes: cNotes || null,
      tags: null, city: null, state: null, zip: null, is_active: true,
    })
    setCSaving(false)
    setCName(''); setCPhone(''); setCEmail(''); setCAddress(''); setCSource(''); setCNotes('')
    setShowAddCustomer(false)
  }

  const filteredLeads = leads.filter(l =>
    l.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.phone ?? '').includes(search) ||
    (l.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Kanban groups for leads
  const byStage = STAGES.reduce<Record<LeadStage, typeof leads>>((acc, s) => {
    acc[s.value] = filteredLeads.filter(l => l.stage === s.value)
    return acc
  }, {} as Record<LeadStage, typeof leads>)

  if (loading) return <><TopBar title="CRM" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar
        title="CRM"
        right={
          <button
            onClick={() => tab === 'leads' ? setShowAddLead(true) : setShowAddCustomer(true)}
            className="p-1.5 rounded-lg text-blue-600 active:bg-blue-50"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <div className="pb-28">
        {/* Tabs */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
          {(['leads', 'customers'] as CRMTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
              }`}
            >
              {t === 'leads' ? `Leads (${leads.length})` : `Clients (${customers.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'leads' ? 'Search leads…' : 'Search clients…'}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* ── LEADS pipeline ── */}
          {tab === 'leads' && (
            <>
              {leads.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="text-gray-500 font-medium">No leads yet</p>
                  <p className="text-gray-400 text-sm mt-1">Track prospects through your sales pipeline</p>
                  <Button className="mt-4 mx-auto" onClick={() => setShowAddLead(true)}>Add first lead</Button>
                </div>
              )}

              {STAGES.filter(s => s.value !== 'won' && s.value !== 'lost' ? true : byStage[s.value].length > 0).map(stage => {
                const items = byStage[stage.value]
                if (!items.length && (stage.value === 'won' || stage.value === 'lost')) return null
                return (
                  <div key={stage.value}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${stage.bg} ${stage.color}`}>
                        {stage.label}
                      </span>
                      <span className="text-xs text-gray-400">{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-300 px-2 pb-2">No leads in this stage</p>
                    ) : (
                      <div className="space-y-2">
                        {items.map(lead => (
                          <Link
                            key={lead.id}
                            href={`/crm/leads/${lead.id}`}
                            className="block bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="font-semibold text-gray-900">{lead.full_name}</p>
                              <div className="flex items-center gap-1">
                                {lead.estimated_value && (
                                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg">
                                    ${lead.estimated_value.toLocaleString()}
                                  </span>
                                )}
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                            </div>
                            {lead.service_interest && <p className="text-xs text-gray-500 mb-1">{lead.service_interest}</p>}
                            {lead.phone && (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Phone className="w-3 h-3" />{lead.phone}
                              </p>
                            )}

                            {/* Quick stage advance */}
                            <div className="mt-2 flex items-center gap-2">
                              {STAGES.filter(s => s.value !== lead.stage && s.value !== 'lost').slice(0, 2).map(s => (
                                <button
                                  key={s.value}
                                  onClick={e => { e.preventDefault(); moveLead(lead.id, s.value) }}
                                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium ${s.bg} ${s.color}`}
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  {s.label}
                                </button>
                              ))}
                              {stage.value !== 'won' && (
                                <button
                                  onClick={e => { e.preventDefault(); convertToCustomer(lead) }}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium bg-green-100 text-green-700 ml-auto"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Convert
                                </button>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* ── CUSTOMERS ── */}
          {tab === 'customers' && (
            <>
              {customers.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👥</div>
                  <p className="text-gray-500 font-medium">No clients yet</p>
                  <p className="text-gray-400 text-sm mt-1">Add clients directly or convert a won lead</p>
                  <Button className="mt-4 mx-auto" onClick={() => setShowAddCustomer(true)}>Add first client</Button>
                </div>
              )}
              <div className="space-y-2">
                {filteredCustomers.map(customer => (
                  <Link
                    key={customer.id}
                    href={`/crm/customers/${customer.id}`}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 active:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {customer.full_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{customer.full_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {customer.phone && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3" /><span className="truncate">{customer.email}</span>
                          </span>
                        )}
                      </div>
                      {customer.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{customer.address}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={e => { e.preventDefault(); if (confirm('Delete client?')) deleteCustomer(customer.id) }}
                        className="p-1.5 text-gray-400 active:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <Modal open={showAddLead} onClose={() => setShowAddLead(false)} title="New Lead">
        <form onSubmit={handleAddLead} className="space-y-3">
          <input value={lName} onChange={e => setLName(e.target.value)} placeholder="Name *" autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            <input value={lPhone} onChange={e => setLPhone(e.target.value)} placeholder="Phone"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="Email"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input value={lAddress} onChange={e => setLAddress(e.target.value)} placeholder="Address"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <input value={lService} onChange={e => setLService(e.target.value)} placeholder="Service interest (e.g. Lawn care)"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            <input value={lValue} onChange={e => setLValue(e.target.value)} type="number" placeholder="Est. value ($)"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={lSource} onChange={e => setLSource(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Source…</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea value={lNotes} onChange={e => setLNotes(e.target.value)} placeholder="Notes" rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <Button type="submit" loading={lSaving} className="w-full" disabled={!lName.trim()}>Add lead</Button>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal open={showAddCustomer} onClose={() => setShowAddCustomer(false)} title="New Client">
        <form onSubmit={handleAddCustomer} className="space-y-3">
          <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Full name *" autoFocus
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="grid grid-cols-2 gap-2">
            <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="Phone"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            <input value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="Email"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input value={cAddress} onChange={e => setCAddress(e.target.value)} placeholder="Address"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={cSource} onChange={e => setCSource(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Lead source…</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Notes" rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <Button type="submit" loading={cSaving} className="w-full" disabled={!cName.trim()}>Add client</Button>
        </form>
      </Modal>
    </>
  )
}
