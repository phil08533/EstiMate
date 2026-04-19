'use client'

import { useState } from 'react'
import { Calculator, ChevronDown } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'

type Material = 'mulch' | 'rock' | 'topsoil' | 'sand' | 'sod' | 'seed' | 'gravel'

interface MaterialConfig {
  label: string
  unit: string           // what depth/coverage is measured in
  depthLabel: string
  defaultDepth: number
  // conversion helpers
  bagSizeCuFt?: number   // cu ft per bag (mulch, soil, sand)
  sqFtPerPallet?: number // for sod
  lbsPerKSqFt?: number   // for seed
  tonPerCuYd?: number    // for rock/gravel
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
    const pallets = Math.ceil(sqFt / (cfg.sqFtPerPallet!))
    return { pallets, sqFt, totalCost: pallets * price }
  }
  if (material === 'seed') {
    const lbs = Math.ceil((sqFt / 1000) * (cfg.lbsPerKSqFt!))
    return { lbs, sqFt, totalCost: lbs * price }
  }

  const cuFt = (sqFt * (depth / 12)) * 1.1  // 10% waste factor
  const cuYd = cuFt / 27
  const bags = cfg.bagSizeCuFt ? Math.ceil(cuFt / cfg.bagSizeCuFt) : null
  const tons = cfg.tonPerCuYd ? (cuYd * cfg.tonPerCuYd) : null
  const totalCost = tons ? tons * price : cuYd * price
  return { cuFt, cuYd, bags, tons, sqFt, totalCost }
}

export default function CalculatorPage() {
  const [material, setMaterial] = useState<Material>('mulch')
  const [sqFt, setSqFt] = useState('')
  const [depth, setDepth] = useState('')
  const [price, setPrice] = useState('')
  const cfg = MATERIALS[material]

  const numSqFt = parseFloat(sqFt) || 0
  const numDepth = parseFloat(depth) || cfg.defaultDepth
  const numPrice = parseFloat(price) || cfg.avgPricePerUnit

  const results = numSqFt > 0 ? calcResults(material, numSqFt, numDepth, numPrice) : null

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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Area (sq ft)
            </label>
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                {cfg.depthLabel}
              </label>
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
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Your price ({cfg.priceUnit})
            </label>
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
