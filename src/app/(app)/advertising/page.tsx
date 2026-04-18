'use client'

import { useState, useEffect, useCallback } from 'react'
import { Share2, Copy, CheckCheck, Megaphone, Mail, Globe } from 'lucide-react'
import { useEstimates } from '@/lib/hooks/useEstimates'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/layout/TopBar'
import Spinner from '@/components/ui/Spinner'
import PageHelp from '@/components/ui/PageHelp'
import type { EstimateMedia } from '@/lib/types'

type AdTab = 'social' | 'facebook_ads' | 'mailers'

// ─── Social Post Composer ─────────────────────────────────────────────────────

function generateCaption(customerName: string, address: string | null, comments: string | null) {
  const location = address ? address.split(',')[0] : 'a local property'
  const service = comments ? comments.split('\n')[0].slice(0, 60) : 'landscape work'
  const tags = '#LawnCare #Landscaping #BeforeAndAfter #LocalBusiness #YardTransformation #LawnGoals'
  return `✅ Another happy client!\n\nWe just completed work at ${location} — ${service}.\n\nLooking to transform your property? Contact us for a free estimate!\n\n${tags}`
}

function PhotoPicker({
  photos,
  selected,
  onToggle,
  label,
}: {
  photos: EstimateMedia[]
  selected: Set<string>
  onToggle: (id: string) => void
  label: string
}) {
  if (!photos.length) return null
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {photos.map(p => (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
              selected.has(p.id) ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
            }`}
          >
            <img
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/estimate-media/${p.storage_path}`}
              alt=""
              className="w-full h-full object-cover"
            />
            {selected.has(p.id) && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <CheckCheck className="w-5 h-5 text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function SocialPostComposer() {
  const { estimates, loading } = useEstimates({ status: 'sold', sortField: 'updated_at', sortDirection: 'desc' })
  const [selectedEstimate, setSelectedEstimate] = useState<string>('')
  const [media, setMedia] = useState<EstimateMedia[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [caption, setCaption] = useState('')
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)

  const loadMedia = useCallback(async (estimateId: string) => {
    setMediaLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('estimate_media')
      .select('*')
      .eq('estimate_id', estimateId)
      .eq('media_type', 'photo')
      .order('display_order')
    setMedia((data as EstimateMedia[]) ?? [])
    setSelectedPhotos(new Set())
    setMediaLoading(false)
  }, [])

  useEffect(() => {
    if (selectedEstimate) {
      const est = estimates.find(e => e.id === selectedEstimate)
      if (est) {
        setCaption(generateCaption(est.customer_name, est.customer_address, est.comments))
        loadMedia(selectedEstimate)
      }
    }
  }, [selectedEstimate, estimates, loadMedia])

  function togglePhoto(id: string) {
    setSelectedPhotos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleShare() {
    setSharing(true)
    const selectedMedia = media.filter(m => selectedPhotos.has(m.id))

    if (typeof navigator !== 'undefined' && navigator.share && selectedMedia.length > 0) {
      try {
        // Try native Web Share with files
        const filePromises = selectedMedia.map(async m => {
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/estimate-media/${m.storage_path}`
          const res = await fetch(url)
          const blob = await res.blob()
          const ext = m.storage_path.split('.').pop() ?? 'jpg'
          return new File([blob], `photo.${ext}`, { type: blob.type })
        })
        const files = await Promise.all(filePromises)
        await navigator.share({ files, text: caption, title: 'Job Complete!' })
        setSharing(false)
        return
      } catch {
        // Fall through to clipboard approach
      }
    }

    // Desktop fallback: copy caption then open Facebook
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    setTimeout(() => {
      window.open('https://www.facebook.com/', '_blank')
      setCopied(false)
    }, 1200)
    setSharing(false)
  }

  async function copyCaption() {
    await navigator.clipboard.writeText(caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>

  return (
    <div className="space-y-4">
      {/* Step 1: Pick job */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-2">1. Pick a completed job</p>
        {estimates.length === 0 ? (
          <p className="text-sm text-gray-400">No completed jobs yet. Mark an estimate as Sold to use this feature.</p>
        ) : (
          <select
            value={selectedEstimate}
            onChange={e => setSelectedEstimate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a completed job…</option>
            {estimates.map(e => (
              <option key={e.id} value={e.id}>
                {e.customer_name}{e.customer_address ? ` — ${e.customer_address.split(',')[0]}` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedEstimate && (
        <>
          {/* Step 2: Select photos */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase">2. Select photos to post</p>
            {mediaLoading ? (
              <Spinner />
            ) : media.length === 0 ? (
              <p className="text-sm text-gray-400">No photos attached to this job. Add photos in the estimate&apos;s Media tab.</p>
            ) : (
              <PhotoPicker
                photos={media}
                selected={selectedPhotos}
                onToggle={togglePhoto}
                label={`${media.length} photos available — tap to select`}
              />
            )}
            {selectedPhotos.size > 0 && (
              <p className="text-xs text-blue-600 font-medium">{selectedPhotos.size} photo{selectedPhotos.size > 1 ? 's' : ''} selected</p>
            )}
          </div>

          {/* Step 3: Caption */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">3. Edit your caption</p>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={8}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{caption.length} characters</p>
          </div>

          {/* Step 4: Post */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">4. Share</p>
            <button
              onClick={handleShare}
              disabled={sharing || !caption}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm active:bg-blue-700 disabled:opacity-60"
            >
              <Share2 className="w-4 h-4" />
              {sharing ? 'Sharing…' : 'Share to Facebook / Social Media'}
            </button>
            <button
              onClick={copyCaption}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-50"
            >
              {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy caption to clipboard'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              On mobile, tapping Share opens your native share sheet. On desktop, the caption is copied and Facebook opens.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Facebook Ads Guide ───────────────────────────────────────────────────────

function FacebookAdsGuide() {
  return (
    <div className="space-y-4 pb-4">
      <div className="bg-blue-600 rounded-2xl p-4 text-white">
        <Globe className="w-8 h-8 mb-2 opacity-80" />
        <h2 className="font-bold text-lg">Facebook / Instagram Ads</h2>
        <p className="text-blue-100 text-sm mt-1">The highest ROI advertising for local service businesses</p>
      </div>

      {[
        {
          step: '1', title: 'Set Up Facebook Business Manager',
          body: 'Go to business.facebook.com and create a Business Manager account. Add your business page and connect your Instagram account. This gives you access to Meta Ads Manager.',
          tip: 'Use your business email, not personal email.',
        },
        {
          step: '2', title: 'Define Your Target Audience',
          body: 'In Ads Manager, target by: Location (5–15 mile radius from your city), Age (25–65), Interests (homeowners, lawn & garden, real estate), and Behaviors (homeowners). Start broad, then narrow.',
          tip: 'Homeowners aged 35–55 in suburbs convert best for lawn/landscape.',
        },
        {
          step: '3', title: 'Choose the Right Campaign Objective',
          body: 'For lead generation: use "Lead Generation" campaign type — customers fill out a form without leaving Facebook. For brand awareness: use "Reach." For website traffic: use "Traffic." For calls: use "Calls."',
          tip: 'Lead Gen campaigns typically cost $5–15 per lead for lawn services.',
        },
        {
          step: '4', title: 'Create a Before/After Ad',
          body: 'Before/after photos perform best for service businesses. Use the Social Posts tab to export your job photos. Upload as a carousel ad: first photo = before, second = after. Headline: "See What We Did for Your Neighbor." CTA: "Get a Free Estimate."',
          tip: 'Carousel ads showing real work get 2–3× more clicks than stock photos.',
        },
        {
          step: '5', title: 'Set Budget & Schedule',
          body: 'Start with $10–15/day for 2 weeks to test. Run ads Tuesday–Thursday when homeowners are most likely to act. Pause on weekends unless you want weekend call volume. Monthly budget: $300–500 for a solid local presence.',
          tip: 'Never boost posts directly — always use Ads Manager for better targeting.',
        },
        {
          step: '6', title: 'Install the Meta Pixel',
          body: 'Add the Meta Pixel to your website to track which ad visitors become leads. Go to Meta Events Manager → Pixels → Add New → install on your site. This dramatically improves ad targeting over time.',
          tip: 'The pixel gets smarter after 50 conversions — give it time.',
        },
        {
          step: '7', title: 'Retarget Past Visitors',
          body: 'Once the pixel has data, create a "Custom Audience" of website visitors and people who engaged with your posts. Run retargeting ads to them — these convert at 3–5× the rate of cold audiences.',
          tip: '"You looked at our estimates — here\'s 10% off this month" is a killer retargeting angle.',
        },
        {
          step: '8', title: 'Measure What Matters',
          body: 'Track: Cost Per Lead (CPL), Lead-to-Estimate conversion rate, Estimate-to-Job conversion rate. Your target: CPL under $20, close rate above 30%. If CPL is high, change your creative. If close rate is low, fix your follow-up.',
          tip: 'Screenshot ad results monthly and compare. Double down on what works.',
        },
      ].map(item => (
        <div key={item.step} className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.step}
            </span>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
          <p className="text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-2 mt-2">💡 {item.tip}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Direct Mail Guide ────────────────────────────────────────────────────────

function MailersGuide() {
  return (
    <div className="space-y-4 pb-4">
      <div className="bg-orange-500 rounded-2xl p-4 text-white">
        <Mail className="w-8 h-8 mb-2 opacity-80" />
        <h2 className="font-bold text-lg">Direct Mail Campaigns</h2>
        <p className="text-orange-100 text-sm mt-1">Still one of the best ROI channels for lawn & landscape</p>
      </div>

      {[
        {
          step: '1', title: 'Define Your Target Zip Codes',
          body: 'Pick 3–5 zip codes where you want to grow. Focus on neighborhoods with single-family homes, median home value $250K+, and HOAs (they often require lawn maintenance). Avoid apartments and commercial areas.',
          tip: 'Your best new customers are near your existing ones. Start with your current service area.',
        },
        {
          step: '2', title: 'Choose a Mailing Type',
          body: 'Every Door Direct Mail (EDDM) via USPS is the most affordable — $0.20–0.23 per piece, no mailing list needed. Targeted mail (by homeowner data) costs more but converts better. Postcards outperform letters for lawn services.',
          tip: 'EDDM works great for density mailings. Get started at usps.com/eddm.',
        },
        {
          step: '3', title: 'Design Your Postcard',
          body: 'Use a 6×11 jumbo postcard — largest EDDM size, same price as smaller. Front: before/after photo (your best job), your logo, one headline, one offer. Back: your offer, contact info, QR code. Keep it simple — 10 seconds to grab attention.',
          tip: 'Canva.com has free postcard templates. Just swap in your photos and info.',
        },
        {
          step: '4', title: 'Craft an Irresistible Offer',
          body: 'Best-performing offers for lawn services: "Free first cut with 3-month contract," "$50 off your first estimate," "Free mulch installation with full lawn package," or "Price-lock guarantee for the season." Make the offer visible and urgent.',
          tip: 'Time-limited offers (expires May 31) increase response rate by 40%.',
        },
        {
          step: '5', title: 'Set Up Call Tracking',
          body: 'Use a unique phone number on your mailer (Google Voice is free) so you know exactly how many calls came from that campaign. Track: calls, estimates, jobs booked, revenue per mail piece.',
          tip: 'Expected response rate: 1–3% for cold mail. 500 pieces × 2% = 10 calls.',
        },
        {
          step: '6', title: 'Timing Is Everything',
          body: 'Best months to mail: February–March (homeowners planning spring), September (fall cleanup), November (snow removal). Mail 6 weeks before the season starts. Avoid holidays. Tuesday–Thursday delivery converts best.',
          tip: 'Mail the same area 3× in 6 weeks. Repetition is what drives response.',
        },
        {
          step: '7', title: 'Sequence for Maximum Results',
          body: 'Most pros mail the same neighborhoods 3–4 times per season. First mailer: introduce, offer. Second (2–3 weeks later): urgency, limited slots. Third: final call, last chance. Each touch increases brand recognition.',
          tip: '$1,000 in mailers that lands 3 recurring lawn clients = $3,600–5,400/year. That\'s real ROI.',
        },
        {
          step: '8', title: 'Pair with Facebook',
          body: 'Run a Facebook ad campaign in the same zip codes while your mailers are in homes. Prospects who see both your mailer AND your Facebook ad convert at 2–3× the rate of seeing either alone. This is called "surround sound" marketing.',
          tip: 'Upload your customer list to Facebook as a Custom Audience and find "lookalikes" — people similar to your best customers.',
        },
      ].map(item => (
        <div key={item.step} className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {item.step}
            </span>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
          <p className="text-xs text-orange-700 bg-orange-50 rounded-xl px-3 py-2 mt-2">💡 {item.tip}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdvertisingPage() {
  const [tab, setTab] = useState<AdTab>('social')

  const tabs: { value: AdTab; label: string; icon: typeof Share2 }[] = [
    { value: 'social',        label: 'Social Posts', icon: Share2 },
    { value: 'facebook_ads',  label: 'FB Ads Guide', icon: Globe },
    { value: 'mailers',       label: 'Mailers',      icon: Megaphone },
  ]

  return (
    <>
      <TopBar title="Advertising" backHref="/settings" />
      <div className="pb-28">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 flex">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors ${
                tab === t.value ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'social' && <SocialPostComposer />}
          {tab === 'facebook_ads' && <FacebookAdsGuide />}
          {tab === 'mailers' && <MailersGuide />}

          <PageHelp
            title="Advertising"
            intro="Turn your completed jobs into marketing fuel. Use Social Posts to create ready-to-share Facebook posts from your before/after photos. Use the guides to run profitable ad campaigns."
            steps={[
              'Go to Social Posts and select a completed job.',
              'Pick your best before and after photos.',
              'Edit the auto-generated caption, then tap Share.',
              'On mobile, this opens your share sheet to post directly to Facebook, Instagram, or anywhere.',
              'Use the FB Ads Guide to set up paid campaigns targeting your area.',
              'Use the Mailers Guide to run EDDM postcard campaigns in target zip codes.',
            ]}
            tips={[
              'Jobs with before/after photos perform 3× better than text-only posts.',
              'Post within 24 hours of completing a job while the excitement is fresh.',
              'Ask the homeowner to like/share your post — their friends are your future customers.',
            ]}
          />
        </div>
      </div>
    </>
  )
}
