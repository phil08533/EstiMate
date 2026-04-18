'use client'

import { useState, useEffect, useMemo } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { PaymentLink } from '@/lib/types'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function PaymentForm({ link }: { link: PaymentLink }) {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setStatus('loading')
    setErrorMsg('')

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {},
      redirect: 'if_required',
    })

    if (result.error) {
      setErrorMsg(result.error.message ?? 'Payment failed')
      setStatus('error')
      return
    }

    if (result.paymentIntent?.status === 'succeeded') {
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: link.token, payment_intent_id: result.paymentIntent.id }),
      })
      setStatus(res.ok ? 'success' : 'error')
      if (!res.ok) setErrorMsg('Payment recorded but confirmation had an issue. Please contact us.')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Payment Received!</h2>
        <p className="text-gray-500 mt-1">Your deposit of {fmt(link.deposit_amount)} has been processed.</p>
        <p className="text-sm text-gray-400 mt-2">You will receive a receipt by email.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Payment details</p>
        <PaymentElement />
      </div>
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{errorMsg}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || status === 'loading'}
        className="w-full py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl disabled:opacity-50 transition-opacity"
      >
        {status === 'loading' ? 'Processing…' : `Pay Deposit ${fmt(link.deposit_amount)}`}
      </button>
      <p className="text-xs text-center text-gray-400">
        Secured by Stripe. Your card info is never stored on our servers.
      </p>
    </form>
  )
}

interface Props {
  link: PaymentLink
  lineItems: { description: string; quantity: number; unit_price: number }[]
  stripeKey: string | null
}

export default function PaymentClient({ link, lineItems, stripeKey }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [initError, setInitError] = useState('')

  const alreadyPaid = link.status === 'paid'

  const stripePromise = useMemo(
    () => (stripeKey ? loadStripe(stripeKey) : null),
    [stripeKey]
  )

  useEffect(() => {
    if (!stripeKey || alreadyPaid) return
    fetch('/api/payments/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: link.token }),
    })
      .then(r => r.json())
      .then(d => { if (d.error) setInitError(d.error); else setClientSecret(d.client_secret) })
      .catch(() => setInitError('Failed to initialize payment'))
  }, [stripeKey, alreadyPaid, link.token])

  if (alreadyPaid) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Deposit Paid</h2>
        <p className="text-gray-500">Your {fmt(link.deposit_amount)} deposit has been received. Thank you!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quote summary */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quote Summary</p>
        {lineItems.length > 0 ? (
          <div className="space-y-2">
            {lineItems.map((li, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700">{li.description}</span>
                <span className="font-medium text-gray-900">{fmt(li.quantity * li.unit_price)}</span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{fmt(link.total_amount)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Quote total: {fmt(link.total_amount)}</p>
        )}
      </div>

      {/* Deposit callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm text-blue-700 mb-1">Deposit required ({link.deposit_pct}%)</p>
        <p className="text-3xl font-bold text-blue-900">{fmt(link.deposit_amount)}</p>
        <p className="text-xs text-blue-600 mt-1">
          Balance of {fmt(link.total_amount - link.deposit_amount)} due on completion
        </p>
      </div>

      {initError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{initError}</div>
      )}

      {stripePromise && clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe', variables: { colorPrimary: '#2563eb', borderRadius: '12px' } },
          }}
        >
          <PaymentForm link={link} />
        </Elements>
      ) : !stripeKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
          <p className="font-semibold text-amber-800 mb-1">Online payments not configured</p>
          <p className="text-sm text-amber-700">Please contact us directly to arrange your deposit payment.</p>
        </div>
      ) : !clientSecret && !initError ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : null}
    </div>
  )
}
