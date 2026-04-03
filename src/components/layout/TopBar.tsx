'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface TopBarProps {
  title: string
  backHref?: string
  right?: React.ReactNode
}

export default function TopBar({ title, backHref, right }: TopBarProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {backHref ? (
          <button
            onClick={() => router.push(backHref)}
            className="-ml-2 p-2 rounded-lg text-gray-500 active:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <h1 className="flex-1 text-center text-base font-semibold text-gray-900 truncate px-2">
          {title}
        </h1>
        <div className="w-10 flex justify-end">{right}</div>
      </div>
    </header>
  )
}
