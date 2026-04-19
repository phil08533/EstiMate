import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Called by Vercel Cron (daily at 8am) — vercel.json: { "crons": [{ "path": "/api/reminders/send", "schedule": "0 13 * * *" }] }
// Also accepts CRON_SECRET for security

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const today = new Date().toISOString().split('T')[0]
  let sent = 0, skipped = 0

  // Get all teams with reminders enabled
  const { data: settingsList } = await supabase
    .from('reminder_settings')
    .select('*')
    .eq('is_enabled', true)

  if (!settingsList?.length) return NextResponse.json({ sent, skipped })

  const resendKey = process.env.RESEND_API_KEY

  for (const settings of settingsList) {
    for (const daysBefore of settings.reminder_days_before as number[]) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysBefore)
      const targetStr = targetDate.toISOString().split('T')[0]

      // Get estimates with service_date = targetDate for this team
      const { data: estimates } = await supabase
        .from('estimates')
        .select('id, customer_name, customer_email, customer_phone, customer_address, service_date, team_id')
        .eq('team_id', settings.team_id)
        .eq('service_date', targetStr)
        .eq('status', 'sold')

      if (!estimates?.length) continue

      for (const est of estimates) {
        // Check if reminder already sent
        const { data: existing } = await supabase
          .from('reminder_log')
          .select('id')
          .eq('estimate_id', est.id)
          .eq('days_before', daysBefore)
          .eq('method', 'email')
          .single()

        if (existing) { skipped++; continue }

        // Send email reminder
        if (settings.send_email && est.customer_email && resendKey) {
          const template = settings.message_template ??
            `Hi ${est.customer_name}, this is a reminder that your service is scheduled for ${est.service_date}${est.customer_address ? ` at ${est.customer_address}` : ''}. We'll see you then!`

          try {
            const emailRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'EstiMate Reminders <noreply@esti-mate.vercel.app>',
                to: [est.customer_email],
                subject: `Reminder: Your service is ${daysBefore === 1 ? 'tomorrow' : `in ${daysBefore} days`}`,
                html: `<p>${template}</p>`,
              }),
            })

            if (emailRes.ok) {
              await supabase.from('reminder_log').insert({
                team_id: est.team_id,
                estimate_id: est.id,
                days_before: daysBefore,
                method: 'email',
                recipient: est.customer_email,
              })
              sent++
            }
          } catch { skipped++ }
        }
      }
    }
  }

  return NextResponse.json({ success: true, sent, skipped, date: today })
}
