'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Plus, X, Info } from 'lucide-react'
import { useReminderSettings } from '@/lib/hooks/useReminderSettings'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const PRESET_DAYS = [1, 2, 3, 7, 14]

export default function RemindersSettingsPage() {
  const { settings, loading, save } = useReminderSettings()
  const [enabled, setEnabled] = useState(true)
  const [days, setDays] = useState<number[]>([1])
  const [sendEmail, setSendEmail] = useState(true)
  const [sendSms, setSendSms] = useState(false)
  const [template, setTemplate] = useState('')
  const [customDay, setCustomDay] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setEnabled(settings.is_enabled)
      setDays(settings.reminder_days_before)
      setSendEmail(settings.send_email)
      setSendSms(settings.send_sms)
      setTemplate(settings.message_template ?? '')
    }
  }, [settings])

  function toggleDay(d: number) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort((a, b) => a - b))
  }

  function addCustomDay() {
    const n = parseInt(customDay)
    if (!isNaN(n) && n > 0 && !days.includes(n)) {
      setDays(prev => [...prev, n].sort((a, b) => a - b))
    }
    setCustomDay('')
  }

  async function handleSave() {
    setSaving(true)
    await save({
      is_enabled: enabled,
      reminder_days_before: days.length > 0 ? days : [1],
      send_email: sendEmail,
      send_sms: sendSms,
      message_template: template.trim() || null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <><TopBar title="Reminder Settings" backHref="/settings" /><div className="flex justify-center py-12"><Spinner size="lg" /></div></>

  return (
    <>
      <TopBar title="Auto Reminders" backHref="/settings" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Automatically remind customers about upcoming jobs via email or SMS. Reminders are sent based on the <strong>service date</strong> on each estimate.
          </p>
        </div>

        {/* Enable toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Auto Reminders</p>
              <p className="text-xs text-gray-400 mt-0.5">Send reminders automatically before service dates</p>
            </div>
            <button
              onClick={() => setEnabled(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {enabled && (
          <>
            {/* When to send */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-gray-900 text-sm">When to Send</p>
              <p className="text-xs text-gray-500">Select how many days before the service date to send the reminder:</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_DAYS.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      days.includes(d)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {d === 1 ? '1 day before' : `${d} days before`}
                  </button>
                ))}
              </div>
              {/* Custom day */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customDay}
                  onChange={e => setCustomDay(e.target.value)}
                  placeholder="Custom days…"
                  min={1}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addCustomDay}
                  className="px-3 py-2 bg-gray-100 rounded-xl text-gray-700 active:bg-gray-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Selected days summary */}
              {days.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {days.map(d => (
                    <span key={d} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-2 py-1 rounded-full">
                      {d === 1 ? '1 day before' : `${d} days before`}
                      <button onClick={() => toggleDay(d)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Delivery method */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-gray-900 text-sm">Delivery Method</p>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-xs text-gray-400">Requires RESEND_API_KEY in environment</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={sendEmail} onChange={e => setSendEmail(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">SMS Text</p>
                      <p className="text-xs text-gray-400">Requires Twilio integration (coming soon)</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={sendSms} onChange={e => setSendSms(e.target.checked)} disabled className="w-4 h-4 accent-blue-600 opacity-40" />
                </label>
              </div>
            </div>

            {/* Custom message */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
              <p className="font-semibold text-gray-900 text-sm">Custom Message</p>
              <p className="text-xs text-gray-500">Optional. Leave blank to use the default message.</p>
              <textarea
                value={template}
                onChange={e => setTemplate(e.target.value)}
                placeholder={`Hi [customer name], this is a reminder that your service is scheduled for [date] at [address]. We'll see you then!`}
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Cron info */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Reminders run daily at 8:00 AM. For production: add a Vercel Cron Job pointing to{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">/api/reminders/send</code>{' '}
                with schedule <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700">0 13 * * *</code>.
              </p>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
        </Button>
      </div>
    </>
  )
}
