'use client'

import { useState } from 'react'
import { Check, Zap, Crown, Building2 } from 'lucide-react'
import { useSubscription } from '@/lib/hooks/useSubscription'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    price: '$0',
    period: 'forever',
    color: 'border-gray-200',
    badge: '',
    features: [
      'Up to 25 estimates',
      'Photos & annotations',
      'Measurements',
      'Notes',
      'Shared links',
      'Basic analytics',
    ],
    unavailable: [
      'CRM & leads pipeline',
      'Auto reminders',
      'Quote email flow',
      'Employee management',
      'Equipment tracking',
      'Stripe payment links',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: Crown,
    price: '$49',
    period: '/month',
    color: 'border-blue-500',
    badge: 'Most Popular',
    features: [
      'Unlimited estimates',
      'Full CRM (leads + customers)',
      'Auto reminders (email)',
      'Quote email with Accept/Decline',
      'Employee org tree',
      'Equipment & depreciation',
      'Stripe payment links',
      'P&L dashboard',
      'Analytics & win rate',
      'Priority support',
    ],
    unavailable: [],
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building2,
    price: '$149',
    period: '/month',
    color: 'border-violet-500',
    badge: 'Enterprise',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'SMS reminders (Twilio)',
      'Custom branding',
      'API access',
      'Dedicated onboarding',
      'SLA support',
    ],
    unavailable: [],
  },
]

export default function BillingPage() {
  const { subscription, loading, isProOrBusiness, isTrialing, trialDaysLeft } = useSubscription()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  if (loading) return <><TopBar title="Billing" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  const currentPlan = subscription?.plan ?? 'free'

  async function openPortal(plan?: string) {
    setUpgrading(plan ?? 'portal')
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else setUpgrading(null)
  }

  return (
    <>
      <TopBar title="Billing & Plans" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        {/* Current plan banner */}
        <div className={`rounded-2xl p-4 border ${isProOrBusiness ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Plan</p>
              <p className="font-bold text-gray-900 text-lg capitalize mt-0.5">{currentPlan}</p>
              {isTrialing && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">
                  {trialDaysLeft > 0 ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''}` : 'Trial expired'}
                </p>
              )}
            </div>
            {subscription?.stripe_subscription_id && (
              <button
                onClick={() => openPortal()}
                disabled={!!upgrading}
                className="text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl active:bg-blue-100 disabled:opacity-50"
              >
                {upgrading === 'portal' ? 'Loading…' : 'Manage'}
              </button>
            )}
          </div>
        </div>

        {/* Plan cards */}
        {PLANS.map(plan => {
          const Icon = plan.icon
          const isCurrent = currentPlan === plan.id
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border-2 overflow-hidden ${isCurrent ? plan.color : 'border-gray-100'}`}
            >
              {plan.badge && (
                <div className={`px-4 py-1.5 text-xs font-bold text-white text-center ${plan.id === 'pro' ? 'bg-blue-600' : 'bg-violet-600'}`}>
                  {plan.badge}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.id === 'free' ? 'bg-gray-100' : plan.id === 'pro' ? 'bg-blue-100' : 'bg-violet-100'}`}>
                      <Icon className={`w-4 h-4 ${plan.id === 'free' ? 'text-gray-600' : plan.id === 'pro' ? 'text-blue-600' : 'text-violet-600'}`} />
                    </div>
                    <p className="font-bold text-gray-900">{plan.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xs text-gray-400">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-4">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{f}</span>
                    </div>
                  ))}
                  {plan.unavailable.map(f => (
                    <div key={f} className="flex items-start gap-2 opacity-40">
                      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5 text-gray-300">—</span>
                      <span className="text-sm text-gray-400">{f}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="w-full py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-xl text-center">
                    Current Plan
                  </div>
                ) : plan.id === 'free' ? (
                  <button
                    onClick={() => openPortal()}
                    disabled={!!upgrading}
                    className="w-full py-2.5 text-sm font-semibold rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 disabled:opacity-50"
                  >
                    {upgrading === plan.id ? 'Loading…' : 'Downgrade to Free'}
                  </button>
                ) : (
                  <button
                    onClick={() => openPortal(plan.id)}
                    disabled={!!upgrading}
                    className={`w-full py-2.5 text-sm font-semibold rounded-xl disabled:opacity-50 ${
                      plan.id === 'pro'
                        ? 'bg-blue-600 text-white active:bg-blue-700'
                        : 'bg-violet-600 text-white active:bg-violet-700'
                    }`}
                  >
                    {upgrading === plan.id ? 'Loading…' : `${currentPlan === 'free' ? 'Upgrade' : 'Switch'} to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}

        <p className="text-xs text-gray-400 text-center px-4">
          Billing is handled securely by Stripe. Cancel anytime from the billing portal.
          Questions? Email support@esti-mate.vercel.app
        </p>
      </div>
    </>
  )
}
