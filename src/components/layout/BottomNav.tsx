'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, DollarSign, Users, BarChart2, Settings2 } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/estimates', label: 'Jobs',      icon: ClipboardList },
    { href: '/crm',       label: 'CRM',       icon: Users },
    { href: '/finances',  label: 'Finances',  icon: DollarSign },
    { href: '/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/settings',  label: 'Settings',  icon: Settings2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/settings' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px] transition-colors ${
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
