'use client'

import { useState } from 'react'
import { Bell, X, CheckCheck, ClipboardList } from 'lucide-react'
import Link from 'next/link'
import { useNotifications } from '@/lib/hooks/useNotifications'
import type { Notification } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  quote_accepted:       '✅',
  quote_declined:       '❌',
  quote_modification:   '✏️',
  reminder_sent:        '📅',
  payment_received:     '💰',
  follow_up_due:        '🔔',
  job_today:            '🔨',
}

function NotifItem({ n, onRead }: { n: Notification; onRead: (id: string) => void }) {
  const icon = TYPE_ICON[n.type] ?? '🔔'
  const href = n.data?.estimate_id ? `/estimates/${n.data.estimate_id}` : null

  const content = (
    <div
      onClick={() => !n.read_at && onRead(n.id)}
      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0 ${
        n.read_at ? 'opacity-60' : 'bg-blue-50/40'
      }`}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${n.read_at ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
          {n.title}
        </p>
        {n.body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </p>
      </div>
      {!n.read_at && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
    </div>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-gray-900 text-sm">Notifications</p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs flex items-center gap-1"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
                  <ClipboardList className="w-8 h-8 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <NotifItem key={n.id} n={n} onRead={markRead} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
