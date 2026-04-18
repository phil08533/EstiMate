'use client'

import Link from 'next/link'
import { Building2, Users, Wrench, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth()

  const sections = [
    {
      href: '/settings/company',
      icon: Building2,
      label: 'Company Settings',
      description: 'Logo, contact info, tax rate, payment terms',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      href: '/settings/team',
      icon: Users,
      label: 'Team & Members',
      description: 'Invite people, manage roles, share links',
      color: 'text-violet-600 bg-violet-50',
    },
    {
      href: '/equipment',
      icon: Wrench,
      label: 'Equipment',
      description: 'Inventory, maintenance logs, costs',
      color: 'text-orange-600 bg-orange-50',
    },
  ]

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

        {/* Settings sections */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {sections.map(({ href, icon: Icon, label, description, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-4 py-4 active:bg-gray-50 transition-colors"
            >
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

        {/* Sign out */}
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
