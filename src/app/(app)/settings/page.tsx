'use client'

import Link from 'next/link'
import { Building2, Users, Wrench, LogOut, ChevronRight, HelpCircle, BarChart2, UserCog, StickyNote, BookOpen, Megaphone, Calendar, Bell, CreditCard, Store, Calculator, Clock, RefreshCw, Search, Tag, UsersRound } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'

const SECTIONS = [
  {
    group: 'Business',
    items: [
      { href: '/settings/company',  icon: Building2,  label: 'Company Settings', description: 'Logo, contact info, tax rate, payment terms', color: 'text-blue-600 bg-blue-50' },
      { href: '/settings/billing',  icon: CreditCard, label: 'Plans & Billing',  description: 'Manage subscription, upgrade plan',           color: 'text-green-600 bg-green-50' },
      { href: '/settings/team',     icon: Users,      label: 'Team & Members',   description: 'Invite people, manage roles, share links',    color: 'text-violet-600 bg-violet-50' },
      { href: '/employees',         icon: UserCog,    label: 'Employees',         description: 'Org tree, roles, pay rates, time tracking',   color: 'text-teal-600 bg-teal-50' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/equipment',          icon: Wrench,    label: 'Equipment',         description: 'Fleet inventory, maintenance logs, depreciation', color: 'text-orange-600 bg-orange-50' },
      { href: '/vendors',            icon: Store,     label: 'Vendors',           description: 'Supplier contacts, quick-dial, categories',      color: 'text-rose-600 bg-rose-50' },
      { href: '/time',               icon: Clock,     label: 'Time Tracking',     description: 'Log hours per job per employee',                  color: 'text-indigo-600 bg-indigo-50' },
      { href: '/schedule',           icon: Calendar,  label: 'Schedule',          description: 'Job calendar, service & follow-up dates',         color: 'text-green-600 bg-green-50' },
      { href: '/settings/reminders', icon: Bell,      label: 'Auto Reminders',    description: 'Email customers before their service date',       color: 'text-amber-600 bg-amber-50' },
      { href: '/recurring',          icon: RefreshCw, label: 'Recurring Jobs',    description: 'Maintenance contracts, auto-generate estimates',   color: 'text-blue-600 bg-blue-50' },
      { href: '/settings/categories', icon: Tag,          label: 'Service Categories', description: 'Mowing, Landscaping, Snow Plowing — track by type',     color: 'text-orange-600 bg-orange-50' },
      { href: '/settings/crews',     icon: UsersRound,   label: 'Crews',              description: 'Named crews, assign employees, schedule by crew',        color: 'text-violet-600 bg-violet-50' },
      { href: '/training',           icon: BookOpen,     label: 'Employee Training',  description: 'Checklists, SOPs, onboarding guides',                    color: 'text-cyan-600 bg-cyan-50' },
      { href: '/advertising',        icon: Megaphone, label: 'Advertising',       description: 'Social posts, Facebook ads guide, mailers',       color: 'text-pink-600 bg-pink-50' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { href: '/analytics', icon: BarChart2, label: 'Analytics', description: 'YTD P&L, win rate, monthly revenue & expense charts', color: 'text-amber-600 bg-amber-50' },
      { href: '/finances',  icon: BarChart2, label: 'Finances',  description: 'P&L, revenue, expense tracking',                     color: 'text-red-600 bg-red-50' },
    ],
  },
  {
    group: 'Tools & Help',
    items: [
      { href: '/search',     icon: Search,     label: 'Search',              description: 'Search across estimates, clients, notes, vendors', color: 'text-gray-600 bg-gray-50' },
      { href: '/calculator', icon: Calculator, label: 'Material Calculator', description: 'Mulch, rock, soil, sod — cubic yards & cost', color: 'text-lime-600 bg-lime-50' },
      { href: '/notes',      icon: StickyNote, label: 'Notes',               description: 'Daily notes and team notes',                  color: 'text-yellow-600 bg-yellow-50' },
      { href: '/resources',  icon: BookOpen,   label: 'Resources',           description: 'Tax reference and contractor tips',           color: 'text-cyan-600 bg-cyan-50' },
      { href: '/help',       icon: HelpCircle, label: 'How to Use',          description: 'Searchable guide to all features',            color: 'text-emerald-600 bg-emerald-50' },
    ],
  },
]

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()

  return (
    <>
      <TopBar title="Settings" />
      <div className="p-4 space-y-4 pb-28">

        {/* Account summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {(profile?.full_name ?? user?.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{profile?.full_name ?? 'No name set'}</p>
            <p className="text-sm text-gray-400 truncate">{user?.email}</p>
          </div>
          <Link href="/settings/team" className="p-2 text-gray-400 active:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        {SECTIONS.map(({ group, items }) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">{group}</p>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {items.map(({ href, icon: Icon, label, description, color }) => (
                <Link key={href} href={href} className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400 truncate">{description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-4 bg-white rounded-2xl border border-gray-200 text-red-500 active:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </>
  )
}
