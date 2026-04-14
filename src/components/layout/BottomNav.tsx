'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Users, LogOut, StickyNote } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function BottomNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const links = [
    { href: '/estimates', label: 'Estimates', icon: ClipboardList },
    { href: '/notes', label: 'Notes', icon: StickyNote },
    { href: '/team', label: 'Team', icon: Users },
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
              className={`flex flex-col items-center gap-0.5 py-2 px-6 min-w-[64px] transition-colors ${
                active ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
        <button
          onClick={signOut}
          className="flex flex-col items-center gap-0.5 py-2 px-6 min-w-[64px] text-gray-400 transition-colors"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-xs font-medium">Sign out</span>
        </button>
      </div>
    </nav>
  )
}
