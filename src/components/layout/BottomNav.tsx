'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, HardHat, Calendar, Users, Settings2 } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function BottomNav() {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard',  label: 'Home',     icon: LayoutDashboard },
    { href: '/jobs',       label: 'Jobs',      icon: HardHat },
    { href: '/schedule',   label: 'Schedule',  icon: Calendar },
    { href: '/crm',        label: 'CRM',       icon: Users },
    { href: '/settings',   label: 'Settings',  icon: Settings2 },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-bottom md:hidden">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/settings' && href !== '/dashboard' && pathname.startsWith(href))
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
        {/* Notification bell on mobile */}
        <div className="flex flex-col items-center gap-0.5 py-2 px-3 min-w-[56px]">
          <NotificationBell />
          <span className="text-xs font-medium text-gray-400">Alerts</span>
        </div>
      </div>
    </nav>
  )
}
