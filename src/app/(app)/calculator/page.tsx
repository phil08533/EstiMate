'use client'

import { useState } from 'react'
import { Calculator, ChevronDown, ClipboardList, Check, X } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { createClient } from '@/lib/supabase/client'

type Material = 'mulch' | 'rock' | 'topsoil' | 'sand' | 'sod' | 'seed' | 'gravel'

interface MaterialConfig {
  label: string
  unit: string
  depthLabel: string
  defaultDepth: number
  bagSizeCuFt?: number
  sqFtPerPallet?: number
  lbsPerKSqFt?: number
  tonPerCuYd?: number
  avgPricePerUnit: number
  priceUnit: string
}

const MATERIALS: Record<Material, MaterialConfig> = {
  mulch:   { label: 'Mulch',       unit: 'inches', depthLabel: 'Depth (inches)', defaultDepth: 3,  bagSizeCuFt: 2,    avgPricePerUnit: 45,  priceUnit: 'per cubic yard' },
  topsoil: { label: 'Topsoil',     unit: 'inches', depthLabel: 'Depth (inches)', defaultDepth: 4,  bagSizeCuFt: 0.75, avgPricePerUnit: 35,  priceUnit: 'per cubic yard' },
  sand:    { label: 'Sand',        unit: 'inches', depthLabel: 'Depth (inches)', defaultDepth: 2,  bagSizeCuFt: 0.5,  avgPricePerUnit: 30,  priceUnit: 'per cubic yard' },
  rock:    { label: 'Rock / Stone',unit: 'inches', depthLabel: 'Depth (inches)', defaultDepth: 2,  tonPerCuYd: 1.4,   avgPricePerUnit: 55,  priceUnit: 'per ton' },
  gravel:  { label: 'Gravel',      unit: 'inches', depthLabel: 'Depth (inches)', defaultDepth: 4,  tonPerCuYd: 1.5,   avgPricePerUnit: 45,  priceUnit: 'per ton' },
  sod:     { label: 'Sod',         unit: 'n/a',    depthLabel: '',               defaultDepth: 0,  sqFtPerPallet: 450, avgPricePerUnit: 200, priceUnit: 'per pallet' },
  seed:    { label: 'Grass Seed',  unit: 'n/a',    depthLabel: '',               defaultDepth: 0,  lbsPerKSqFt: 5,    avgPricePerUnit: 2.5, priceUnit: 'per lb' },
}

function calcResults(material: Material, sqFt: number, depth: number, price: number) {
  const cfg = MATERIALS[material]
  if (material === 'sod') {
    const pallets = Math.ceil(sqFt / cfg.sqFtPerPallet!)
    return { pallets, sqFt, totalCost: pallets * price }
  }
  if (material === 'seed') {
    const lbs = Math.ceil((sqFt / 1000) * cfg.lbsPerKSqFt!)
    return { lbs, sqFt, totalCost: lbs * price }
  }
  const cuFt = (sqFt * (depth / 12)) * 1.1
  const cuYd = cuFt / 27
  const bags = cfg.bagSizeCuFt ? Math.ceil(cuFt / cfg.bagSizeCuFt) : null
  const tons = cfg.tonPerCuYd ? cuYd * cfg.tonPerCuYd : null
  const totalCost = tons ? tons * price : cuYd * price
  return { cuFt, cuYd, bags, tons, sqFt, totalCost }
}

function buildLineItemDesc(material: Material, results: ReturnType<typeof calcResults>, numDepth: number) {
  const label = MATERIALS[material].label
  if (material === 'sod' && 'pallets' in results) return `${label} — ${'pallets' in results ? results.pallets : ''} pallets (${results.sqFt} sq ft)`
  if (material === 'seed' && 'lbs' in results) return `${label} — ${'lbs' in results ? results.lbs : ''} lbs (${results.sqFt} sq ft)`
  if ('cuYd' in results) {
    const qty = results.cuYd !== undefined ? `${results.cuYd.toFixed(1)} cu yd` : ''
    return `${label} — ${qty} @ ${numDepth}" depth (${results.sqFt} sq ft)`
  }
  return label
}

export default function CalculatorPage() {
  const [material, setMaterial] = useState<Material>('mulch')
  const [sqFt, setSqFt] = useState('')
  const [depth, setDepth] = useState('')
  const [price, setPrice] = useState('')
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [selectedEstimateId, setSelectedEstimateId] = useState('')
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { estimates } = useEstimates()

  const cfg = MATERIALS[material]
  const numSqFt = parseFloat(sqFt) || 0
  const numDepth = parseFloat(depth) || cfg.defaultDepth
  const numPrice = parseFloat(price) || cfg.avgPricePerUnit
  const results = numSqFt > 0 ? calcResults(material, numSqFt, numDepth, numPrice) : null

  // Sort estimates: open jobs first, then by name
  const openEstimates = estimates.filter(e => !e.completed_at).sort((a, b) => a.customer_name.localeCompare(b.customer_name))

  async function handleAddToEstimate() {
    if (!selectedEstimateId || !results) return
    setAdding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: membership } = await supabase
        .from('team_members').select('team_id').eq('user_id', user.id).limit(1).single()
      const { data: existing } = await supabase
        .from('estimate_line_items').select('id').eq('estimate_id', selectedEstimateId).order('sort_order', { ascending: false }).limit(1).single()
      const sort_order = existing ? 999 : 0
      await supabase.from('estimate_line_items').insert({
        estimate_id: selectedEstimateId,
        team_id: membership?.team_id,
        description: buildLineItemDesc(material, results, numDepth),
        quantity: 1,
        unit_price: Math.round(results.totalCost * 100) / 100,
        unit: 'lot',
        tax_exempt: false,
        service_item_id: null,
        sort_order,
        category: 'material',
        created_by: user.id,
      })
      setAdded(true)
      setTimeout(() => { setAdded(false); setShowAddPanel(false) }, 2000)
    } finally {
      setAdding(false)
    }
  }

  function fmt(n: number, dec = 1) { return n.toLocaleString('en-US', { maximumFractionDigits: dec }) }
  function fmtMoney(n: number) { return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) }

  return (
    <>
      <TopBar title="Material Calculator" backHref="/resources" />
      <div className="p-4 space-y-4 pb-28">

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
          <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">Enter your area and depth to calculate how much material you need. Includes a 10% waste factor.</p>
        </div>

        {/* Material selector */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Material</label>
            <div className="relative">
              <select
                value={material}
                onChange={e => {
                  setMaterial(e.target.value as Material)
                  setDepth('')
                  setPrice('')
                }}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(MATERIALS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Area (sq ft)</label>
            <input
              type="number"
              value={sqFt}
              onChange={e => setSqFt(e.target.value)}
              placeholder="e.g. 500"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {cfg.depthLabel && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{cfg.depthLabel}</label>
              <input
                type="number"
                value={depth}
                onChange={e => setDepth(e.target.value)}
                placeholder={`Default: ${cfg.defaultDepth}"`}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Your price ({cfg.priceUnit})</label>
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder={`Market rate ~$${cfg.avgPricePerUnit}`}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
              <p className="text-white font-semibold">Results for {fmt(numSqFt, 0)} sq ft</p>
            </div>
            <div className="p-4 space-y-3">
              {material === 'sod' && 'pallets' in results && (
                <>
                  <ResultRow label="Pallets needed" value={`${results.pallets} pallets`} highlight />
                  <ResultRow label="Area" value={`${fmt(results.sqFt, 0)} sq ft`} />
                </>
              )}
              {material === 'seed' && 'lbs' in results && (
                <>
                  <ResultRow label="Seed needed" value={`${results.lbs} lbs`} highlight />
                  <ResultRow label="Area" value={`${fmt(results.sqFt, 0)} sq ft`} />
                </>
              )}
              {'cuYd' in results && results.cuYd !== undefined && (
                <>
                  <ResultRow label="Cubic yards" value={`${fmt(results.cuYd)} cu yd`} highlight />
                  {'bags' in results && results.bags && (
                    <ResultRow label={`Bags (${cfg.bagSizeCuFt} cu ft)`} value={`${results.bags} bags`} />
                  )}
                  {'tons' in results && results.tons && (
                    <ResultRow label="Tons" value={`${fmt(results.tons)} tons`} />
                  )}
                  <ResultRow label="Depth used" value={`${numDepth}"`} />
                  <ResultRow label="Waste factor" value="10% included" />
                </>
              )}
              <div className="border-t border-gray-100 pt-3">
                <ResultRow label="Estimated material cost" value={fmtMoney(results.totalCost)} highlight accent />
              </div>
            </div>

            {/* Add to estimate */}
            {!showAddPanel ? (
              <div className="px-4 pb-4">
                <button
                  onClick={() => { setShowAddPanel(true); setAdded(false) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700"
                >
                  <ClipboardList className="w-4 h-4" />
                  Add to Estimate
                </button>
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Add to which estimate?</p>
                  <button onClick={() => setShowAddPanel(false)} className="p-1 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={selectedEstimateId}
                    onChange={e => setSelectedEstimateId(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select estimate…</option>
                    {openEstimates.map(e => (
                      <option key={e.id} value={e.id}>{e.customer_name}{e.customer_address ? ` — ${e.customer_address}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button
                  onClick={handleAddToEstimate}
                  disabled={!selectedEstimateId || adding || added}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl active:bg-green-700 disabled:opacity-60"
                >
                  {added ? <Check className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                  {added ? 'Added!' : adding ? 'Adding…' : 'Confirm'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Coverage reference */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Reference</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p>• 1 cubic yard covers 324 sq ft at 1&quot; deep</p>
            <p>• 1 cubic yard covers 108 sq ft at 3&quot; deep</p>
            <p>• 1 cubic yard covers 81 sq ft at 4&quot; deep</p>
            <p>• 1 ton of stone ≈ 0.7 cubic yards</p>
            <p>• Standard sod pallet = ~450 sq ft</p>
            <p>• Grass seed: 5–8 lbs per 1,000 sq ft</p>
          </div>
        </div>
      </div>
    </>
  )
}

function ResultRow({ label, value, highlight, accent }: {
  label: string; value: string; highlight?: boolean; accent?: boolean
}) {
  return (
    <div className={`flex items-center justify-between ${accent ? 'text-green-700' : ''}`}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${highlight ? 'font-bold text-gray-900' : 'text-gray-700'} ${accent ? '!text-green-700 !font-bold text-base' : ''}`}>
        {value}
      </span>
    </div>
  )
}
