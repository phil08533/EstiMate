import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const teamId = searchParams.get('team')
  const role = (searchParams.get('role') ?? 'member') as 'member' | 'viewer'
  const next = searchParams.get('next') ?? '/estimates'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && teamId) {
      // Upsert profile first so FK constraint is satisfied
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email ?? null,
        full_name: data.user.user_metadata?.full_name
          ?? data.user.email?.split('@')[0]
          ?? null,
      }, { onConflict: 'id', ignoreDuplicates: true })

      // Join the invited team
      await supabase.from('team_members').upsert({
        team_id: teamId,
        user_id: data.user.id,
        role,
      }, { onConflict: 'team_id,user_id', ignoreDuplicates: true })
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
