'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ClipboardList, Calendar, Users, DollarSign, Settings2,
  BarChart2, StickyNote, LogOut, Zap, Megaphone, Wrench, Store,
  Clock, Calculator, Search, RefreshCw, HardHat, BookOpen,
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import NotificationBell from './NotificationBell'

const PRIMARY = [
  { href: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs',       label: 'Jobs',       icon: HardHat },
  { href: '/estimates',  label: 'Estimates',  icon: ClipboardList },
  { href: '/schedule',   label: 'Schedule',   icon: Calendar },
  { href: '/crm',        label: 'CRM',        icon: Users },
  { href: '/finances',   label: 'Finances',   icon: DollarSign },
]

const SECONDARY = [
  { href: '/search',       label: 'Search',       icon: Search },
  { href: '/recurring',    label: 'Recurring',    icon: RefreshCw },
  { href: '/training',     label: 'Training',     icon: BookOpen },
  { href: '/analytics',   label: 'Analytics',   icon: BarChart2 },
  { href: '/time',        label: 'Time',         icon: Clock },
  { href: '/notes',       label: 'Notes',        icon: StickyNote },
  { href: '/vendors',     label: 'Vendors',      icon: Store },
  { href: '/calculator',  label: 'Calculator',   icon: Calculator },
  { href: '/advertising', label: 'Advertising',  icon: Megaphone },
  { href: '/equipment',   label: 'Equipment',    icon: Wrench },
  { href: '/settings',    label: 'Settings',     icon: Settings2 },
]

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Zap }) {
  const pathname = usePathname()
  const active = pathname === href || (href !== '/settings' && href !== '/dashboard' && pathname.startsWith(href))
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  )
}

export default function SideNav() {
  const { user, profile, signOut } = useAuth()
  const initials = (profile?.full_name ?? user?.email ?? '?')
    .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-gray-900 border-r border-gray-800 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">EstiMate</span>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Main</p>
        {PRIMARY.map(link => <NavItem key={link.href} {...link} />)}

        <div className="my-3 border-t border-gray-800" />

        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">More</p>
        {SECONDARY.map(link => <NavItem key={link.href} {...link} />)}
      </nav>

      {/* User */}
      <div className="flex-shrink-0 border-t border-gray-800 p-3 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
