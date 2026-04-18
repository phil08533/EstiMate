'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, DollarSign, StickyNote, BookOpen, Settings2 } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/estimates', label: 'Estimates', icon: ClipboardList },
    { href: '/finances', label: 'Finances', icon: DollarSign },
    { href: '/notes', label: 'Notes', icon: StickyNote },
    { href: '/resources', label: 'Resources', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 min-w-[60px] transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
