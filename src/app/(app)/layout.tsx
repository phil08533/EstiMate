import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import SideNav from '@/components/layout/SideNav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SideNav />
      <main className="pb-20 md:pb-6 md:ml-60">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
