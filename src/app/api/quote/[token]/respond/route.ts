import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const body = await req.json()
  const response: string = body.response
  const notes: string | undefined = body.notes

  if (!['accepted', 'declined', 'modification_requested'].includes(response)) {
    return NextResponse.json({ error: 'Invalid response' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Find the estimate by token
  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('id, team_id, customer_name, customer_email, assigned_to, created_by')
    .eq('quote_token', token)
    .single()

  if (error || !estimate) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // Update estimate with customer response
  await supabase.from('estimates').update({
    customer_response: response,
    customer_response_at: new Date().toISOString(),
    customer_response_notes: notes ?? null,
    // Auto-update status on acceptance
    ...(response === 'accepted' ? { status: 'sold' } : {}),
    ...(response === 'declined' ? { status: 'lost' } : {}),
  }).eq('id', estimate.id)

  // Create in-app notification for contractor
  const notifType =
    response === 'accepted'             ? 'quote_accepted' :
    response === 'declined'            ? 'quote_declined' :
    'quote_modification'

  const notifTitle =
    response === 'accepted'             ? `${estimate.customer_name} accepted your quote!` :
    response === 'declined'            ? `${estimate.customer_name} declined your quote` :
    `${estimate.customer_name} requested changes to your quote`

  await supabase.from('notifications').insert({
    team_id: estimate.team_id,
    user_id: estimate.assigned_to ?? estimate.created_by,
    type: notifType,
    title: notifTitle,
    body: notes ?? null,
    data: { estimate_id: estimate.id, customer_name: estimate.customer_name, response },
  })

  // Send email notification to contractor if RESEND_API_KEY is configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && estimate.customer_email) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', estimate.created_by)
        .single()

      if (profile?.email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'EstiMate <noreply@esti-mate.vercel.app>',
            to: [profile.email],
            subject: notifTitle,
            html: `
              <h2>${notifTitle}</h2>
              <p>Customer: <strong>${estimate.customer_name}</strong></p>
              ${notes ? `<p>Customer note: <em>${notes}</em></p>` : ''}
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://esti-mate.vercel.app'}/estimates/${estimate.id}">View estimate →</a></p>
            `,
          }),
        })
      }
    } catch {
      // Email failure is non-fatal
    }
  }

  return NextResponse.json({ success: true })
}
