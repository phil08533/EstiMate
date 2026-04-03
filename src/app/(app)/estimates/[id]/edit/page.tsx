'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimate } from '@/lib/hooks/useEstimate'
import TopBar from '@/components/layout/TopBar'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'

export default function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { estimate, loading, updateEstimate } = useEstimate(id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    comments: '',
  })

  useEffect(() => {
    if (estimate) {
      setForm({
        customer_name: estimate.customer_name,
        customer_phone: estimate.customer_phone ?? '',
        customer_email: estimate.customer_email ?? '',
        customer_address: estimate.customer_address ?? '',
        comments: estimate.comments ?? '',
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
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <Input label="Customer name *" value={form.customer_name} onChange={set('customer_name')} />
        <Input label="Phone number" type="tel" value={form.customer_phone} onChange={set('customer_phone')} inputMode="tel" />
        <Input label="Email" type="email" value={form.customer_email} onChange={set('customer_email')} inputMode="email" />
        <Input label="Address" value={form.customer_address} onChange={set('customer_address')} />
        <Textarea label="Notes / what they want" value={form.comments} onChange={set('comments')} rows={8} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <Button type="submit" loading={saving} className="w-full" size="lg">Save changes</Button>
      </form>
    </>
  )
}
