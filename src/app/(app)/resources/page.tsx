'use client'

import { useState } from 'react'
import { DollarSign, Lightbulb, ChevronDown, ChevronUp, Search, Calculator } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { STATE_TAX_DATA, FEDERAL_PAYROLL } from '@/lib/data/stateTaxData'
import { CONTRACTOR_TIPS } from '@/lib/data/contractorTips'

type Section = 'tax' | 'tips' | 'calculator'

// ─── Material Calculator ──────────────────────────────────────────────────────

type MaterialType = 'mulch' | 'topsoil' | 'gravel' | 'sand' | 'concrete' | 'sod' | 'seed' | 'fertilizer'

const MATERIALS: { value: MaterialType; label: string; unit: string; note: string }[] = [
  { value: 'mulch',      label: 'Mulch',           unit: 'cu yd', note: '1 cu yd covers ~108 sq ft at 3" depth' },
  { value: 'topsoil',    label: 'Topsoil',          unit: 'cu yd', note: '1 cu yd covers ~108 sq ft at 3" depth' },
  { value: 'gravel',     label: 'Gravel / Stone',   unit: 'cu yd', note: '1 cu yd covers ~81 sq ft at 4" depth' },
  { value: 'sand',       label: 'Sand',             unit: 'cu yd', note: '1 cu yd covers ~162 sq ft at 2" depth' },
  { value: 'concrete',   label: 'Concrete',         unit: 'cu yd', note: '1 cu yd fills ~81 sq ft at 4" depth' },
  { value: 'sod',        label: 'Sod',              unit: 'sq ft', note: '1 pallet ≈ 450 sq ft' },
  { value: 'seed',       label: 'Grass Seed',       unit: 'lb',    note: '~5–8 lbs per 1,000 sq ft (new lawn)' },
  { value: 'fertilizer', label: 'Fertilizer',       unit: 'bag',   note: '1 bag (50 lb) covers ~5,000–15,000 sq ft' },
]

function calcMaterial(type: MaterialType, areaSqFt: number, depthIn: number, pricePerUnit: number) {
  if (!areaSqFt || areaSqFt <= 0) return null

  let qty = 0
  let unit = ''
  let bagNote = ''
  let extraLine = ''

  switch (type) {
    case 'mulch':
    case 'topsoil':
    case 'sand':
    case 'concrete': {
      const d = depthIn > 0 ? depthIn : 3
      const cuFt = (areaSqFt * d) / 12
      qty = cuFt / 27
      unit = 'cubic yards'
      extraLine = `${Math.ceil(cuFt)} cubic feet · ${Math.ceil(qty * 13.5)} bags (2 cu ft bags)`
      break
    }
    case 'gravel': {
      const d = depthIn > 0 ? depthIn : 4
      const cuFt = (areaSqFt * d) / 12
      qty = cuFt / 27
      unit = 'cubic yards'
      extraLine = `${Math.ceil(cuFt)} cubic feet · ${Math.ceil(qty * 13.5)} bags (2 cu ft bags)`
      break
    }
    case 'sod': {
      qty = areaSqFt
      unit = 'sq ft'
      const pallets = areaSqFt / 450
      extraLine = `${pallets.toFixed(1)} pallets (450 sq ft each) · add 10% for waste`
      break
    }
    case 'seed': {
      qty = (areaSqFt / 1000) * 6
      unit = 'lbs'
      bagNote = `≈ ${Math.ceil(qty / 25)} bags (25 lb bags) for new lawn`
      extraLine = bagNote
      break
    }
    case 'fertilizer': {
      qty = areaSqFt / 10000
      unit = 'bags'
      extraLine = `${qty.toFixed(1)} bags (50 lb, covers 10,000 sq ft avg)`
      break
    }
  }

  const totalCost = pricePerUnit > 0 ? qty * pricePerUnit : null

  return { qty, unit, extraLine, totalCost }
}

function MaterialCalculator() {
  const [material, setMaterial] = useState<MaterialType>('mulch')
  const [area, setArea] = useState('')
  const [depth, setDepth] = useState('3')
  const [price, setPrice] = useState('')

  const areaSqFt = parseFloat(area)
  const depthIn = parseFloat(depth)
  const priceNum = parseFloat(price)

  const result = areaSqFt > 0 ? calcMaterial(material, areaSqFt, depthIn, priceNum) : null
  const selectedMat = MATERIALS.find(m => m.value === material)!
  const showDepth = ['mulch', 'topsoil', 'gravel', 'sand', 'concrete'].includes(material)

  return (
    <div className="space-y-4 pb-4">
      {/* Material selector */}
      <div className="flex flex-wrap gap-2">
        {MATERIALS.map(m => (
          <button
            key={m.value}
            onClick={() => setMaterial(m.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
              material === m.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-2">{selectedMat.note}</p>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Area (sq ft)</label>
          <input
            value={area}
            onChange={e => setArea(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="e.g. 500"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {showDepth ? (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Depth (inches)</label>
            <input
              value={depth}
              onChange={e => setDepth(e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="3"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Price per {selectedMat.unit}</label>
            <input
              value={price}
              onChange={e => setPrice(e.target.value)}
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {showDepth && (
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">Price per {selectedMat.unit} (optional)</label>
          <input
            value={price}
            onChange={e => setPrice(e.target.value)}
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Results</p>
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm">Material needed</span>
            <span className="font-bold text-gray-900 text-lg">
              {result.qty < 10 ? result.qty.toFixed(2) : Math.ceil(result.qty)} {result.unit}
            </span>
          </div>
          {result.extraLine && (
            <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">{result.extraLine}</p>
          )}
          {result.totalCost !== null && result.totalCost > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <span className="text-gray-600 text-sm">Estimated cost</span>
              <span className="font-bold text-green-700 text-lg">
                {result.totalCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
          )}
        </div>
      )}

      {!area && (
        <p className="text-sm text-gray-400 text-center py-4">Enter an area to calculate</p>
      )}

      <p className="text-xs text-gray-400 text-center">
        Estimates only. Verify quantities with your supplier and add 10% for waste.
      </p>
    </div>
  )
}

// ─── Tax Reference ────────────────────────────────────────────────────────────

function TaxSection() {
  const [search, setSearch] = useState('')
  const filtered = STATE_TAX_DATA.filter(s =>
    s.state.toLowerCase().includes(search.toLowerCase()) ||
    s.abbr.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
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

      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search state…"
          className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400"
        />
      </div>

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

// ─── Tips ─────────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResourcesPage() {
  const [section, setSection] = useState<Section>('tips')

  return (
    <>
      <TopBar title="Resources" />
      <div className="pb-28">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
          <button
            onClick={() => setSection('tips')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              section === 'tips' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            Business Tips
          </button>
          <button
            onClick={() => setSection('tax')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              section === 'tax' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Tax Reference
          </button>
          <button
            onClick={() => setSection('calculator')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
              section === 'calculator' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Calculator
          </button>
        </div>

        <div className="p-4">
          {section === 'tips' && <TipsSection />}
          {section === 'tax' && <TaxSection />}
          {section === 'calculator' && <MaterialCalculator />}
        </div>
      </div>
    </>
  )
}
