'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimates } from '@/lib/hooks/useEstimates'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

export default function QuickCaptureForm() {
  const router = useRouter()
  const { createEstimate } = useEstimates()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    comments: '',
  })

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.customer_name.trim()) { setError('Customer name is required'); return }
    setLoading(true)
    setError('')
    try {
      const est = await createEstimate({
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone || null,
        customer_email: form.customer_email || null,
        customer_address: form.customer_address || null,
        comments: form.comments || null,
        assigned_to: null,
        follow_up_date: null,
        status: 'need_to_estimate',
      })
      router.push(`/estimates/${est.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <Input
        label="Customer name *"
        placeholder="Jane Smith"
        value={form.customer_name}
        onChange={set('customer_name')}
        autoFocus
        autoComplete="name"
        inputMode="text"
      />
      <Input
        label="Phone number"
        placeholder="(555) 555-5555"
        type="tel"
        value={form.customer_phone}
        onChange={set('customer_phone')}
        inputMode="tel"
        autoComplete="tel"
      />
      <Input
        label="Email"
        placeholder="jane@example.com"
        type="email"
        value={form.customer_email}
        onChange={set('customer_email')}
        inputMode="email"
        autoComplete="email"
      />
      <Input
        label="Address"
        placeholder="123 Main St, City, ST"
        value={form.customer_address}
        onChange={set('customer_address')}
        autoComplete="street-address"
      />
      <Textarea
        label="What do they want? (notes)"
        placeholder="Describe the job, scope of work, customer requests..."
        value={form.comments}
        onChange={set('comments')}
        rows={6}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Save estimate
      </Button>
    </form>
  )
}
