'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimate } from '@/lib/hooks/useEstimate'
import { useServiceCategories } from '@/lib/hooks/useServiceCategories'
import { useCrews } from '@/lib/hooks/useCrews'
import TopBar from '@/components/layout/TopBar'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function EditEstimatePage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const { estimate, loading, updateEstimate } = useEstimate(id)
  const { categories } = useServiceCategories()
  const { crews } = useCrews()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    comments: '',
    category_id: '',
    crew_id: '',
    estimated_hours: '',
    service_date: '',
    follow_up_date: '',
  })

  useEffect(() => {
    if (estimate) {
      setForm({
        customer_name: estimate.customer_name,
        customer_phone: estimate.customer_phone ?? '',
        customer_email: estimate.customer_email ?? '',
        customer_address: estimate.customer_address ?? '',
        comments: estimate.comments ?? '',
        category_id: estimate.category_id ?? '',
        crew_id: estimate.crew_id ?? '',
        estimated_hours: estimate.estimated_hours != null ? String(estimate.estimated_hours) : '',
        service_date: estimate.service_date ?? '',
        follow_up_date: estimate.follow_up_date ?? '',
      })
    }
  }, [estimate])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name.trim()) { setError('Customer name is required'); return }
    setSaving(true)
    setError('')
    try {
      await updateEstimate({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone || null,
        customer_email: form.customer_email || null,
        customer_address: form.customer_address || null,
        comments: form.comments || null,
        category_id: form.category_id || null,
        crew_id: form.crew_id || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        service_date: form.service_date || null,
        follow_up_date: form.follow_up_date || null,
      })
      router.push(`/estimates/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  return (
    <>
      <TopBar title="Edit Estimate" backHref={`/estimates/${id}`} />
      <form onSubmit={handleSubmit} className="space-y-4 p-4 pb-28">
        <Input label="Customer name *" value={form.customer_name} onChange={set('customer_name')} />
        <Input label="Phone number" type="tel" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" />
        <Input label="Email" type="email" value={form.customer_email} onChange={set('customer_email')} inputMode="email" />
        <Input label="Address" value={form.customer_address} onChange={set('customer_address')} />
        <Textarea label="Notes / what they want" value={form.comments} onChange={set('comments')} rows={4} />

        {/* Scheduling & categorization */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Scheduling</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Service date</label>
              <input type="date" value={form.service_date} onChange={e => setForm(f => ({ ...f, service_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Follow-up date</label>
              <input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Est. hours</label>
              <input type="number" value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))}
                placeholder="e.g. 8" step="0.5"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Assign crew</label>
              <select value={form.crew_id} onChange={e => setForm(f => ({ ...f, crew_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">No crew</option>
                {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {categories.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Service category</label>
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full" size="lg">Save changes</Button>
      </form>
    </>
  )
}
