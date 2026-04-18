'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface PageHelpProps {
  title: string
  intro: string
  steps: string[]
  tips?: string[]
}

export default function PageHelp({ title, intro, steps, tips }: PageHelpProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-8 border-t border-gray-200 pt-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 text-gray-400 text-sm py-2 active:text-gray-600"
      >
        <HelpCircle className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left font-medium">How does {title} work?</span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-3">
          <p className="text-sm text-blue-800">{intro}</p>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          {tips && tips.length > 0 && (
            <div className="pt-2 border-t border-blue-200 space-y-1.5">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">Pro Tips</p>
              {tips.map((tip, i) => (
                <p key={i} className="text-xs text-blue-700">💡 {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
