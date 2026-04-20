import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Phone, Mail, MapPin, CheckCircle, Clock, Send } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  need_to_estimate: 'Pending estimate',
  sent: 'Quote sent',
  sold: 'Job booked',
  lost: 'Declined',
}
const STATUS_COLOR: Record<string, string> = {
  need_to_estimate: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  sold: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
}

export default async function CustomerPortalPage({ params }: { params: { token: string } }) {
  const supabase = await createServiceClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('portal_token', params.token)
    .single()

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link not found</h1>
          <p className="text-gray-500 text-sm">This portal link is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, status, customer_name, customer_address, service_date, comments, created_at, completed_at, quote_token')
    .eq('team_id', customer.team_id)
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  const { data: teamSettings } = await supabase
    .from('company_settings')
    .select('company_name, phone, email, logo_path')
    .eq('team_id', customer.team_id)
    .single()

  const activeJobs = (estimates ?? []).filter(e => !e.completed_at)
  const completedJobs = (estimates ?? []).filter(e => !!e.completed_at)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-5">
        <div className="max-w-lg mx-auto">
          {teamSettings?.company_name && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{teamSettings.company_name}</p>
          )}
          <h1 className="text-xl font-bold text-gray-900">Hi, {customer.full_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your customer portal — estimates and job history</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 pb-12">

        {/* Contact info */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your info on file</p>
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="flex items-center gap-3 text-sm text-gray-700 active:text-blue-600">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {customer.phone}
            </a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="flex items-center gap-3 text-sm text-gray-700 active:text-blue-600">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {customer.email}
            </a>
          )}
          {customer.address && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              {customer.address}
            </div>
          )}
        </div>

        {/* Active jobs */}
        {activeJobs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">Active ({activeJobs.length})</p>
            <div className="space-y-3">
              {activeJobs.map(est => <EstimateCard key={est.id} est={est} />)}
            </div>
          </div>
        )}

        {/* Completed jobs */}
        {completedJobs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">Completed ({completedJobs.length})</p>
            <div className="space-y-3">
              {completedJobs.map(est => <EstimateCard key={est.id} est={est} completed />)}
            </div>
          </div>
        )}

        {(estimates ?? []).length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No estimates yet</p>
            <p className="text-gray-400 text-sm mt-1">Your quotes and job history will appear here</p>
          </div>
        )}

        {/* Company contact */}
        {teamSettings && (teamSettings.phone || teamSettings.email) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-3">Questions? Contact us</p>
            {teamSettings.phone && (
              <a href={`tel:${teamSettings.phone}`} className="flex items-center gap-2 text-sm text-blue-800 font-medium mb-1">
                <Phone className="w-4 h-4" />
                {teamSettings.phone}
              </a>
            )}
            {teamSettings.email && (
              <a href={`mailto:${teamSettings.email}`} className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                <Mail className="w-4 h-4" />
                {teamSettings.email}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EstimateCard({ est, completed }: {
  est: { id: string; status: string; customer_name: string; service_date: string | null; comments: string | null; created_at: string; completed_at: string | null; quote_token: string | null }
  completed?: boolean
}) {
  const statusLabel = STATUS_LABEL[est.status] ?? est.status
  const statusColor = STATUS_COLOR[est.status] ?? 'bg-gray-100 text-gray-700'
  const date = est.service_date
    ? new Date(est.service_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date(est.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className={`bg-white border rounded-2xl p-4 space-y-3 ${completed ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {completed
              ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              : <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            }
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{date}</p>
        </div>
        {est.quote_token && (
          <Link
            href={`/quote/${est.quote_token}`}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-xl active:bg-blue-700"
          >
            <Send className="w-3 h-3" />
            View quote
          </Link>
        )}
      </div>
      {est.comments && (
        <p className="text-sm text-gray-600 line-clamp-2">{est.comments}</p>
      )}
    </div>
  )
}
