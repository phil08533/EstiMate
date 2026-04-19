'use client'

import { useState, useRef } from 'react'
import { Upload, AlertTriangle, CheckCircle, XCircle, ChevronDown, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import Button from '@/components/ui/Button'
import { useCustomers } from '@/lib/hooks/useCRM'
import type { Customer } from '@/lib/types'

// ─── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  function splitLine(line: string): string[] {
    const cells: string[] = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cells.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    return cells
  }

  const headers = splitLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim())
  const rows = lines.slice(1).map(line => {
    const vals = splitLine(line)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (vals[i] ?? '').replace(/^"|"$/g, '').trim() })
    return row
  }).filter(row => Object.values(row).some(v => v))

  return { headers, rows }
}

// ─── Column mappings per software ─────────────────────────────────────────────
type ColMap = {
  full_name?: string[]
  first_name?: string[]
  last_name?: string[]
  email?: string[]
  phone?: string[]
  address?: string[]
  city?: string[]
  state?: string[]
  zip?: string[]
  notes?: string[]
  tags?: string[]
}

const PRESETS: Record<string, { label: string; map: ColMap }> = {
  lmn: {
    label: 'LMN',
    map: {
      full_name:  ['Client Name', 'Name', 'Full Name'],
      first_name: ['First Name', 'First'],
      last_name:  ['Last Name', 'Last'],
      email:      ['Email', 'Email Address'],
      phone:      ['Phone', 'Phone Number', 'Primary Phone'],
      address:    ['Address', 'Street', 'Street Address'],
      city:       ['City'],
      state:      ['State', 'Province'],
      zip:        ['Zip', 'Postal Code', 'ZIP'],
      notes:      ['Notes', 'Comments'],
      tags:       ['Tags', 'Category'],
    },
  },
  service_autopilot: {
    label: 'Service Autopilot',
    map: {
      full_name:  ['Name', 'Full Name', 'Client Name'],
      first_name: ['First Name', 'First'],
      last_name:  ['Last Name', 'Last', 'Surname'],
      email:      ['Email', 'Email Address', 'E-mail'],
      phone:      ['Phone', 'Phone Number', 'Primary Phone', 'Mobile Phone', 'Cell Phone'],
      address:    ['Address', 'Street', 'Address 1', 'Street Address'],
      city:       ['City'],
      state:      ['State'],
      zip:        ['ZIP', 'Zip Code', 'Postal Code'],
      notes:      ['Notes', 'Comments', 'Internal Notes'],
      tags:       ['Tags', 'Client Tags'],
    },
  },
  generic: {
    label: 'Generic CSV',
    map: {
      full_name:  ['Name', 'Full Name', 'Customer Name', 'Client Name', 'Contact Name'],
      first_name: ['First Name', 'First', 'Given Name'],
      last_name:  ['Last Name', 'Last', 'Surname', 'Family Name'],
      email:      ['Email', 'Email Address', 'E-mail'],
      phone:      ['Phone', 'Phone Number', 'Mobile', 'Cell', 'Primary Phone'],
      address:    ['Address', 'Street', 'Street Address', 'Address Line 1'],
      city:       ['City', 'Town'],
      state:      ['State', 'Province', 'Region'],
      zip:        ['Zip', 'ZIP', 'Postal Code', 'Postcode'],
      notes:      ['Notes', 'Comments', 'Description'],
      tags:       ['Tags', 'Labels', 'Categories'],
    },
  },
}

function resolveCol(headers: string[], candidates: string[] = []): string | null {
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase() === c.toLowerCase())
    if (found) return found
  }
  return null
}

interface ParsedRow {
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  notes: string
  tags: string[]
  // detection
  status: 'new' | 'duplicate' | 'skipped'
  matchedCustomer?: Customer
  include: boolean
}

function normalizePhone(p: string) {
  return p.replace(/\D/g, '')
}

function detectDuplicates(rows: Omit<ParsedRow, 'status' | 'matchedCustomer' | 'include'>[], existing: Customer[]): ParsedRow[] {
  return rows.map(row => {
    const matchByEmail = row.email
      ? existing.find(c => c.email?.toLowerCase() === row.email.toLowerCase())
      : undefined
    const matchByPhone = row.phone
      ? existing.find(c => normalizePhone(c.phone ?? '') === normalizePhone(row.phone) && normalizePhone(row.phone).length >= 7)
      : undefined
    const matchByName = existing.find(c =>
      c.full_name.toLowerCase() === row.full_name.toLowerCase() &&
      row.full_name.length > 0
    )
    const match = matchByEmail ?? matchByPhone ?? matchByName
    return {
      ...row,
      status: match ? 'duplicate' : 'new',
      matchedCustomer: match,
      include: !match,
    }
  })
}

export default function ImportPage() {
  const { customers, addCustomer, loading } = useCustomers()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preset, setPreset] = useState<keyof typeof PRESETS>('lmn')
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: rawRows } = parseCSV(text)
      setHeaders(h)
      const map = PRESETS[preset].map

      const firstNameCol  = resolveCol(h, map.first_name)
      const lastNameCol   = resolveCol(h, map.last_name)
      const fullNameCol   = resolveCol(h, map.full_name)
      const emailCol      = resolveCol(h, map.email)
      const phoneCol      = resolveCol(h, map.phone)
      const addressCol    = resolveCol(h, map.address)
      const cityCol       = resolveCol(h, map.city)
      const stateCol      = resolveCol(h, map.state)
      const zipCol        = resolveCol(h, map.zip)
      const notesCol      = resolveCol(h, map.notes)
      const tagsCol       = resolveCol(h, map.tags)

      const parsed: Omit<ParsedRow, 'status' | 'matchedCustomer' | 'include'>[] = rawRows.map(row => {
        let name = fullNameCol ? row[fullNameCol] : ''
        if (!name && firstNameCol) name = [row[firstNameCol], lastNameCol ? row[lastNameCol] : ''].filter(Boolean).join(' ')
        return {
          full_name: name.trim(),
          email:     emailCol   ? row[emailCol]   : '',
          phone:     phoneCol   ? row[phoneCol]   : '',
          address:   addressCol ? row[addressCol] : '',
          city:      cityCol    ? row[cityCol]    : '',
          state:     stateCol   ? row[stateCol]   : '',
          zip:       zipCol     ? row[zipCol]     : '',
          notes:     notesCol   ? row[notesCol]   : '',
          tags:      tagsCol && row[tagsCol] ? row[tagsCol].split(/[,;|]/).map(t => t.trim()).filter(Boolean) : [],
        }
      }).filter(r => r.full_name)

      setRows(detectDuplicates(parsed, customers))
    }
    reader.readAsText(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function toggleRow(i: number) {
    setRows(prev => prev!.map((r, idx) => idx === i ? { ...r, include: !r.include } : r))
  }

  async function handleImport() {
    if (!rows) return
    setImporting(true)
    const toImport = rows.filter(r => r.include)
    let count = 0
    for (const row of toImport) {
      const fullAddress = [row.address, row.city, row.state, row.zip].filter(Boolean).join(', ')
      await addCustomer({
        full_name:  row.full_name,
        email:      row.email  || null,
        phone:      row.phone  || null,
        address:    fullAddress || null,
        city:       row.city   || null,
        state:      row.state  || null,
        zip:        row.zip    || null,
        notes:      row.notes  || null,
        tags:       row.tags.length ? row.tags : null,
        source:     preset,
        is_active:  true,
      })
      count++
    }
    setImportedCount(count)
    setImporting(false)
    setDone(true)
  }

  const newCount  = rows?.filter(r => r.status === 'new').length ?? 0
  const dupCount  = rows?.filter(r => r.status === 'duplicate').length ?? 0
  const inclCount = rows?.filter(r => r.include).length ?? 0

  if (done) {
    return (
      <>
        <TopBar title="Import Clients" backHref="/crm" />
        <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500" />
          <p className="text-2xl font-bold text-gray-900">{importedCount} clients imported</p>
          <p className="text-gray-500 text-sm">They&apos;ve been added to your CRM.</p>
          <Button onClick={() => router.push('/crm')}>Go to CRM</Button>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Import Clients" backHref="/crm" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Upload a CSV export from LMN, Service Autopilot, or any software. We&apos;ll auto-detect columns and flag duplicates before importing.
          </p>
        </div>

        {/* Preset selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Software Source</label>
            <div className="relative">
              <select
                value={preset}
                onChange={e => { setPreset(e.target.value as keyof typeof PRESETS); setRows(null) }}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.entries(PRESETS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* File drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-700 text-sm">Drop CSV file here or tap to browse</p>
            <p className="text-xs text-gray-400 mt-1">Exported from {PRESETS[preset].label}</p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
          </div>
        </div>

        {/* Preview */}
        {rows && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-700">{newCount}</p>
                <p className="text-xs text-green-600">New clients</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-amber-700">{dupCount}</p>
                <p className="text-xs text-amber-600">Duplicates</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-blue-700">{inclCount}</p>
                <p className="text-xs text-blue-600">Will import</p>
              </div>
            </div>

            {dupCount > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {dupCount} possible duplicate{dupCount > 1 ? 's' : ''} detected (matched by name, email, or phone). They&apos;re unchecked by default — tap to include if needed.
                </p>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500">{rows.length} rows parsed from CSV</p>
                <p className="text-xs text-gray-400">{headers.length} columns detected</p>
              </div>
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${row.include ? '' : 'opacity-50'}`}
                >
                  <button
                    onClick={() => toggleRow(i)}
                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      row.include ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                    }`}
                  >
                    {row.include && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{row.full_name}</p>
                    {(row.email || row.phone) && (
                      <p className="text-xs text-gray-400 truncate">{[row.email, row.phone].filter(Boolean).join(' · ')}</p>
                    )}
                    {row.address && <p className="text-xs text-gray-400 truncate">{[row.address, row.city, row.state].filter(Boolean).join(', ')}</p>}
                    {row.status === 'duplicate' && row.matchedCustomer && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <p className="text-xs text-amber-600">Matches existing: {row.matchedCustomer.full_name}</p>
                      </div>
                    )}
                  </div>
                  {row.status === 'new' ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleImport}
              loading={importing}
              disabled={inclCount === 0 || loading}
              className="w-full"
            >
              Import {inclCount} client{inclCount !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
