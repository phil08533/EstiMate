import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const teamId = searchParams.get('team')
  const next = searchParams.get('next') ?? '/estimates'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user && teamId) {
      // Auto-join team if invited (upsert to handle conflict)
      await supabase.from('team_members').upsert({
        team_id: teamId,
        user_id: data.user.id,
        role: 'member',
      }, { onConflict: 'team_id,user_id', ignoreDuplicates: true })
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
