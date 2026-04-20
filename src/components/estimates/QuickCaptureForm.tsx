'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { createClient } from '@/lib/supabase/client'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

const FREE_LIMIT = 25

export default function QuickCaptureForm() {
  const router = useRouter()
  const { createEstimate } = useEstimates()
  const { subscription, loading: subLoading } = useSubscription()
  const [estimateCount, setEstimateCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchCount() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
      if (!member) return
      const { count } = await supabase
        .from('estimates').select('id', { count: 'exact', head: true }).eq('team_id', member.team_id)
      setEstimateCount(count ?? 0)
    }
    fetchCount()
  }, [])

  const isLimited = !subLoading && subscription?.plan === 'free' && estimateCount !== null && estimateCount >= FREE_LIMIT

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
        service_date: null,
        customer_id: null,
        status: 'need_to_estimate',
      })
      router.push(`/estimates/${est.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setLoading(false)
    }
  }

  if (isLimited) {
    return (
      <div className="p-6 flex flex-col items-center text-center gap-4 pt-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">Free plan limit reached</p>
          <p className="text-sm text-gray-500 mt-1">
            You&apos;ve used all {FREE_LIMIT} estimates on the Free plan.<br />
            Upgrade to Pro for unlimited estimates.
          </p>
        </div>
        <Button
          onClick={() => router.push('/settings/billing')}
          size="lg"
          className="w-full max-w-xs"
        >
          Upgrade to Pro
        </Button>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 underline"
        >
          Go back
        </button>
      </div>
    )
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
