'use client'

import { useState } from 'react'
import { DollarSign, Lightbulb, ChevronDown, ChevronUp, Search } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { STATE_TAX_DATA, FEDERAL_PAYROLL } from '@/lib/data/stateTaxData'
import { CONTRACTOR_TIPS } from '@/lib/data/contractorTips'

type Section = 'tax' | 'tips'

function TaxSection() {
  const [search, setSearch] = useState('')
  const filtered = STATE_TAX_DATA.filter(s =>
    s.state.toLowerCase().includes(search.toLowerCase()) ||
    s.abbr.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Federal section */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <h3 className="font-bold text-blue-900 mb-3">Federal Payroll Taxes (All States)</h3>
        <div className="space-y-2">
          {Object.entries(FEDERAL_PAYROLL).map(([key, v]) => (
            <div key={key} className="bg-white rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-sm font-bold text-blue-700">{v.rate}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{v.note}</p>
              {'credit' in v && <p className="text-xs text-green-700 mt-0.5">{v.credit}</p>}
              {'wage_base' in v && <p className="text-xs text-gray-400 mt-0.5">Wage base: {v.wage_base}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* State search */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search state…"
          className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* State cards */}
      <div className="space-y-2">
        {filtered.map(s => (
          <StateCard key={s.abbr} state={s} />
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center pb-4">
        Rates are for reference only. Verify with a CPA or state tax authority before filing.
      </p>
    </div>
  )
}

function StateCard({ state }: { state: (typeof STATE_TAX_DATA)[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 text-sm font-bold text-blue-700">{state.abbr}</span>
          <span className="text-sm font-medium text-gray-900">{state.state}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 hidden sm:block">Sales: {state.salesTax}%</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Sales Tax</p>
            <p className="font-bold text-gray-900">{state.salesTax}%</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-0.5">Income Tax</p>
            <p className="font-bold text-gray-900">{state.incomeTax}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 col-span-2">
            <p className="text-xs text-gray-500 mb-0.5">State Unemployment (SUI)</p>
            <p className="font-bold text-gray-900">{state.suiRate}</p>
          </div>
          <div className="col-span-2 bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-amber-800 leading-relaxed">{state.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TipsSection() {
  const [openCats, setOpenCats] = useState<Set<string>>(new Set([CONTRACTOR_TIPS[0].category]))

  function toggle(cat: string) {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <div className="space-y-3 pb-4">
      {CONTRACTOR_TIPS.map(cat => (
        <div key={cat.category} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => toggle(cat.category)}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-gray-50"
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="flex-1 text-left font-semibold text-gray-900">{cat.category}</span>
            <span className="text-xs text-gray-400 mr-1">{cat.tips.length} tips</span>
            {openCats.has(cat.category) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {openCats.has(cat.category) && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {cat.tips.map((tip, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{tip.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function ResourcesPage() {
  const [section, setSection] = useState<Section>('tips')

  return (
    <>
      <TopBar title="Resources" />
      <div className="pb-28">
        {/* Tab bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
          <button
            onClick={() => setSection('tips')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              section === 'tips' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Business Tips
          </button>
          <button
            onClick={() => setSection('tax')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              section === 'tax' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Tax Reference
          </button>
        </div>

        <div className="p-4">
          {section === 'tips' && <TipsSection />}
          {section === 'tax' && <TaxSection />}
        </div>
      </div>
    </>
  )
}
