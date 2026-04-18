'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, Minus, Plus } from 'lucide-react'
import { useCompanySettings } from '@/lib/hooks/useCompanySettings'
import TopBar from '@/components/layout/TopBar'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'

export default function CompanySettingsPage() {
  const { settings, loading, saveSettings, uploadLogo } = useCompanySettings()
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    company_name: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    license_number: '',
    tax_rate: '',
    payment_terms: 'Due on receipt',
    footer_notes: '',
    logo_scale: 1.0,
  })

  useEffect(() => {
    if (!settings) return
    setForm({
      company_name: settings.company_name ?? '',
      phone: settings.phone ?? '',
      email: settings.email ?? '',
      address: settings.address ?? '',
      website: settings.website ?? '',
      license_number: settings.license_number ?? '',
      tax_rate: settings.tax_rate?.toString() ?? '0',
      payment_terms: settings.payment_terms ?? 'Due on receipt',
      footer_notes: settings.footer_notes ?? '',
      logo_scale: settings.logo_scale ?? 1.0,
    })
    if (settings.logo_path) {
      createClient().storage.from('estimate-media')
        .createSignedUrl(settings.logo_path, 3600)
        .then(({ data }) => setLogoUrl(data?.signedUrl ?? null))
    }
  }, [settings])

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const path = await uploadLogo(file)
      await saveSettings({ logo_path: path })
      const { data } = await createClient().storage.from('estimate-media').createSignedUrl(path, 3600)
      setLogoUrl(data?.signedUrl ?? null)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSettings({
        company_name: form.company_name || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        website: form.website || null,
        license_number: form.license_number || null,
        tax_rate: parseFloat(form.tax_rate) || 0,
        payment_terms: form.payment_terms || null,
        footer_notes: form.footer_notes || null,
        logo_scale: form.logo_scale,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>

  return (
    <>
      <TopBar title="Company Settings" backHref="/settings" />
      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-28">

        {/* Logo */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Company Logo</p>
          <div className="flex items-start gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="rounded-xl border border-gray-200 object-contain bg-gray-50"
                style={{ width: `${Math.round(120 * form.logo_scale)}px`, maxHeight: 80 }}
              />
            ) : (
              <div className="w-24 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl bg-blue-50 active:bg-blue-100 disabled:opacity-50"
              >
                {uploadingLogo ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-gray-400">PNG or JPG recommended</p>
              {/* Logo scale */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">Size:</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, logo_scale: Math.max(0.5, p.logo_scale - 0.1) }))}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-gray-700 w-10 text-center">{Math.round(form.logo_scale * 100)}%</span>
                <button type="button" onClick={() => setForm(p => ({ ...p, logo_scale: Math.min(2.0, p.logo_scale + 0.1) }))}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>

        {/* Company info */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Company Info</p>
          <Input label="Company name" value={form.company_name} onChange={set('company_name')} placeholder="Smith Landscaping LLC" />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 555-5555" inputMode="tel" />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="info@smithlandscaping.com" inputMode="email" />
          <Textarea label="Address" value={form.address} onChange={set('address')} rows={2} placeholder="123 Main St&#10;City, ST 12345" />
          <Input label="Website" value={form.website} onChange={set('website')} placeholder="www.smithlandscaping.com" />
          <Input label="License / contractor number" value={form.license_number} onChange={set('license_number')} />
        </div>

        {/* Billing defaults */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">Billing Defaults</p>
          <div className="relative">
            <Input
              label="Default tax rate (%)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="30"
              value={form.tax_rate}
              onChange={set('tax_rate')}
              placeholder="0"
            />
          </div>
          <Input label="Payment terms" value={form.payment_terms} onChange={set('payment_terms')} placeholder="Due on receipt" />
          <Textarea label="Footer note (appears on PDF)" value={form.footer_notes} onChange={set('footer_notes')} rows={3}
            placeholder="Thank you for your business! Payment is due within 30 days." />
        </div>

        <Button type="submit" loading={saving} className="w-full" size="lg">Save settings</Button>
      </form>
    </>
  )
}
