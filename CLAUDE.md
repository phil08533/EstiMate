# EstiMate — Claude Code Context

## Project Overview
EstiMate is a full-service field operations SaaS for landscaping and contracting businesses.
Core use case: capture customer info on a phone when a customer calls, build and send quotes,
track jobs through a workflow, manage payments, send automated reminders, run a CRM pipeline,
manage employees and equipment, and share the estimate library with others.

## Live App
- **Production URL**: https://esti-mate.vercel.app
- **Supabase Project**: ranccgjmxcpsbxqibojx (https://ranccgjmxcpsbxqibojx.supabase.co)
- **GitHub Repo**: phil08533/EstiMate (branch: main)
- **Vercel**: auto-deploys on every push to `main`

## Tech Stack
- **Next.js 14** (App Router, TypeScript) — PWA, works on phone + desktop
- **Tailwind CSS** — mobile-first, large touch targets
- **Supabase** — auth (magic link email OTP + Google OAuth), PostgreSQL, file storage
- **Konva.js + react-konva** — photo annotation/drawing canvas
- **Stripe** — payment links (deposits), subscription billing
- **Resend** — transactional email (quote send, reminders, notifications)
- **next-pwa** — service worker, installable PWA
- **Note**: `legacy-peer-deps=true` in `.npmrc` — react-konva requires React 18 peer dep workaround

## Key Conventions

### Imports
- All TypeScript interfaces/types: `src/lib/types/index.ts` — always import from there, never redeclare
- Supabase browser client: `src/lib/supabase/client.ts` — use in `'use client'` components
- Supabase server client: `src/lib/supabase/server.ts` — use in Server Components and Route Handlers
- Never call Supabase directly in a component — use hooks from `src/lib/hooks/`

### Architecture Rules
- Server Components fetch initial data (RSC); Client Components handle mutations and interaction
- RLS (Row Level Security) is the primary security boundary — no extra server-side permission checks needed
- Use `src/lib/utils/status.ts` for status label/color mapping — never hardcode status strings in JSX
- Photo annotation JSON stored in `estimate_media.annotation_data` (Konva stage Layer 1 serialization)
- Supabase client created WITHOUT Database generic (`createBrowserClient<any>`) to avoid 'never' type errors

### Team / Solo User Model
- Every user gets a personal team auto-created on first login (DB trigger `handle_new_profile`)
- Team is an internal grouping concept — solo users never need to visit the Team tab
- `estimates.team_id` and `notes.team_id` are always required at DB level
- Auto-creation logic lives in `useTeam` and also inline in `useEstimates.createEstimate` as fallback
- Profile must be upserted BEFORE team creation (Google OAuth race condition fix)

### Status System
Values: `'need_to_estimate' | 'sent' | 'sold' | 'lost'`

Flow:
```
need_to_estimate ──► sent ──► sold
         ▲              ╲
         │               ──► lost
         └────────────────────┘ (reopen)
```

Color map (in `src/lib/utils/status.ts`):
- `need_to_estimate` → amber/yellow
- `sent` → blue
- `sold` → green
- `lost` → red

### Quote Acceptance Flow
1. Contractor taps **Send Quote** on an estimate → generates `quote_token` UUID, optionally emails customer
2. Customer visits `/quote/[token]` — sees line items, total, Accept / Decline / Request Changes buttons
3. Customer submits → `POST /api/quote/[token]/respond` updates `customer_response` + status, creates notification
4. Contractor sees in-app notification + email (if RESEND_API_KEY set)
5. On Accept: estimate auto-advances to `sold`; on Decline: `lost`

### Auto Reminders
- `reminder_settings` table (one row per team) — configurable `reminder_days_before[]` and methods
- Vercel Cron: `GET /api/reminders/send` runs daily at 8 AM UTC (configured in `vercel.json`)
- `reminder_log` table prevents duplicate sends (unique on estimate_id + days_before + method)
- Requires `RESEND_API_KEY` env var for email; SMS toggle (Twilio) is UI-only for now

### Make Client
- "Make Client" button on estimate detail → calls `useCustomers.addCustomer` with estimate's contact info
- Creates CRM `customers` row; button then changes to "View in CRM" linking to `/crm/customers/[id]`
- `estimate.customer_id` FK is set on the customer row but NOT back on the estimate (do that separately if needed)

### Subscription / Billing
- `subscriptions` table (one row per team, auto-created by DB trigger when team is inserted)
- Plans: `free` | `pro` ($49/mo) | `business` ($149/mo)
- Status: `trialing` (14-day default) | `active` | `past_due` | `canceled`
- Billing portal: `POST /api/billing/portal` → Stripe Billing Portal or Checkout Session
- Requires: `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `NEXT_PUBLIC_APP_URL`, `STRIPE_WEBHOOK_SECRET`
- `useSubscription` hook: exposes `isProOrBusiness`, `isTrialing`, `trialDaysLeft`

### Database Key Points
- `estimates.total_area` is maintained by a PostgreSQL trigger — NEVER calculate it in app code
- `measurements.area` is a `GENERATED ALWAYS AS (length * width) STORED` column
- `share_tokens` allow unauthenticated read-only access to a team's estimates
- `note_shares` allow unauthenticated read-only access to team notes (note_id=null) or one note
- `estimates.quote_token` is a unique per-estimate token for the customer quote page
- `estimates.completed_at` — null = active job, non-null = completed; status stays 'sold'
- `schedule_blocks` — detail hour allocation per day per job; separate from `service_date` which is the primary start date
- `training_completions` — unique on (item_id, employee_id); toggled by `useTrainingItems.toggleCompletion`
- `crew_members` — join table (crew_id, employee_id); managed via `useCrews.setCrewMembers`
- All tables have RLS enabled — test with different user sessions when debugging permission errors
- Storage bucket name: `estimate-media`, path pattern: `{team_id}/{estimate_id}/{uuid}.ext`
- RLS storage policy: `owner = auth.uid()` (owner column is uuid type)

### EstimateInsert Pattern
Adding optional DB columns to `Estimate` must follow this pattern to avoid breaking all callers:
```typescript
export type EstimateInsert = Omit<Estimate, 'id' | 'total_area' | ... | 'new_field'> & {
  new_field?: string | null  // add back as optional
}
```
Never add new columns directly to `Omit<Estimate, ...>` without also omitting them — they become required in the insert type.

### Employee Portal — Job Visibility
Employee sees a job if: `estimate.assigned_to === user.id` OR `estimate.crew_id` is in any of the employee's crew memberships. `completed_at !== null` moves jobs to a "Completed" section.

### Complete Job — Profitability
On "Mark Job Complete" the portal loads `time_entries` and `payments` for that estimate on-demand (direct Supabase query, not a hook). Labor cost = sum(hours × employee.pay_rate). Margin grades: ≥50% Excellent, ≥35% Good, ≥20% Tight, <20% Below Target.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://ranccgjmxcpsbxqibojx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
# Optional — enables email features
RESEND_API_KEY=<resend api key>
# Optional — enables Stripe billing
STRIPE_SECRET_KEY=<stripe secret key>
STRIPE_PRO_PRICE_ID=<stripe price id for Pro plan>
STRIPE_BUSINESS_PRICE_ID=<stripe price id for Business plan>
STRIPE_WEBHOOK_SECRET=<stripe webhook signing secret — from Stripe dashboard>
NEXT_PUBLIC_APP_URL=https://esti-mate.vercel.app
# Optional — secures cron endpoint
CRON_SECRET=<random secret>
```

## Running Locally
```bash
npm run dev       # starts on http://localhost:3000
npm run build     # production build (must pass before pushing)
npm run lint      # lint check
```

## Deploying
```bash
git add . && git commit -m "message" && git push origin main
# Vercel auto-deploys from main — live in ~1-2 minutes
```

For database migrations: run SQL manually in Supabase dashboard → SQL Editor.

## Complete File Map

```
EstiMate/
├── .npmrc                           ← legacy-peer-deps=true
├── .env.local                       ← local secrets (gitignored)
├── vercel.json                      ← Vercel Cron: /api/reminders/send daily at 8am
├── next.config.mjs                  ← webpack canvas stub, Supabase image domains
├── tailwind.config.ts
├── supabase/migrations/
│   ├── 001_initial_schema.sql       ← profiles, teams, team_members, estimates, estimate_media, measurements, share_tokens
│   ├── 002_rls_policies.sql         ← RLS for all tables + storage bucket
│   ├── 003_triggers.sql             ← update_estimate_total_area() trigger
│   ├── 004_notes.sql                ← notes, note_shares
│   ├── 005_auto_team_trigger.sql    ← auto-create team on profile insert
│   ├── 007_role_based_rls.sql       ← viewer role + get_user_writable_team_ids()
│   ├── 008_measurement_groups.sql   ← measurement_groups
│   ├── 009_company_and_line_items.sql ← company_settings, service_items, estimate_line_items
│   ├── 010_payments_and_expenses.sql  ← payments, expenses
│   ├── 011_equipment.sql            ← equipment, equipment_logs
│   ├── 012_follow_up_and_templates.sql ← estimate_templates, template_line_items, follow_up_date
│   ├── 013_crm.sql                  ← customers, leads, contact_logs
│   ├── 014_employees.sql            ← employees, time_entries
│   ├── 015_service_date_and_depreciation.sql
│   ├── 016_payment_links.sql        ← payment_links (Stripe deposit)
│   ├── 017_vendors.sql              ← vendors (supplier contacts)
│   ├── 018_subscriptions.sql        ← subscriptions (SaaS billing), auto-created on team insert
│   ├── 019_quote_and_reminders.sql  ← estimates.quote_token + customer_response cols, reminder_settings, reminder_log
│   └── 020_notifications.sql        ← notifications (in-app)
└── src/
    ├── middleware.ts                 ← session refresh; public paths: /login /auth/callback /shared /pay /quote /api/quote
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                  ← redirects / → /dashboard (or /login)
    │   ├── (auth)/login/page.tsx
    │   ├── auth/callback/route.ts
    │   ├── api/
    │   │   ├── payments/
    │   │   │   ├── intent/route.ts   ← Stripe PaymentIntent for deposit links
    │   │   │   └── confirm/route.ts  ← Stripe webhook
    │   │   ├── quote/
    │   │   │   ├── send/route.ts     ← POST: email quote to customer (needs RESEND_API_KEY)
    │   │   │   └── [token]/respond/route.ts ← POST: customer accepts/declines/modifies
    │   │   ├── reminders/
    │   │   │   └── send/route.ts     ← GET: cron job, sends day-before reminders
    │   │   └── billing/
    │   │       ├── portal/route.ts   ← POST: Stripe billing portal / checkout session
    │   │       └── webhook/route.ts  ← POST: Stripe webhook (subscription lifecycle, invoice events)
    │   ├── quote/[token]/
    │   │   ├── page.tsx              ← public customer quote page (no auth)
    │   │   └── QuoteResponseClient.tsx ← Accept / Decline / Request Changes UI
    │   ├── shared/
    │   │   ├── [token]/page.tsx
    │   │   └── notes/[token]/page.tsx
    │   ├── pay/[token]/
    │   │   ├── page.tsx
    │   │   └── PaymentClient.tsx
    │   └── (app)/
    │       ├── layout.tsx            ← auth guard, SideNav (desktop) + BottomNav (mobile)
    │       ├── dashboard/page.tsx    ← HOME: greeting, overdue alerts, KPIs, today's jobs, recent estimates
    │       ├── estimates/
    │       │   ├── page.tsx
    │       │   ├── new/page.tsx
    │       │   ├── [id]/page.tsx     ← detail: MakeClientButton, SendQuoteButton, tabs
    │       │   ├── [id]/edit/page.tsx
    │       │   └── [id]/invoice/page.tsx
    │       ├── notes/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── crm/
    │       │   ├── page.tsx
    │       │   ├── leads/[id]/page.tsx
    │       │   └── customers/[id]/page.tsx
    │       ├── employees/page.tsx
    │       ├── equipment/
    │       │   ├── page.tsx
    │       │   └── [id]/page.tsx
    │       ├── vendors/page.tsx       ← supplier contacts with quick-dial
    │       ├── time/page.tsx          ← team-wide time log, log hours per job
    │       ├── calculator/page.tsx    ← material calculator (mulch/rock/soil/sod/seed)
    │       ├── schedule/page.tsx
    │       ├── finances/page.tsx
    │       ├── analytics/page.tsx
    │       ├── advertising/page.tsx
    │       ├── resources/page.tsx
    │       ├── help/page.tsx
    │       ├── team/page.tsx          ← alias → /settings/team
    │       ├── jobs/page.tsx          ← My Jobs / By Crew / Unscheduled / All tabs
    │       ├── portal/page.tsx        ← Employee portal: today's jobs, clock in/out, after photos, Complete Job profitability modal, training
    │       ├── search/page.tsx        ← Global search across estimates, customers, notes, vendors
    │       ├── recurring/page.tsx     ← Recurring jobs: Due/Upcoming/Paused, auto-generate estimates
    │       ├── training/
    │       │   ├── page.tsx           ← Module list, create module (title, description, public toggle)
    │       │   └── [id]/page.tsx      ← Module detail: add items (checklist/text/video), per-employee completion tracking
    │       └── settings/
    │           ├── page.tsx           ← hub with 4 groups (Business, Operations, Insights, Tools)
    │           ├── company/page.tsx
    │           ├── team/page.tsx
    │           ├── billing/page.tsx   ← plan tiers (Free/Pro/Business) + Stripe portal
    │           ├── reminders/page.tsx ← days-before config, email/SMS toggle, custom message
    │           ├── categories/page.tsx ← Service categories: color picker, name, soft-delete
    │           └── crews/page.tsx     ← Crew list + member management modal
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx            ← variants: primary/secondary/ghost/danger, sizes sm/md/lg
    │   │   ├── Badge.tsx
    │   │   ├── Input.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Modal.tsx             ← bottom sheet mobile, centered desktop
    │   │   ├── Spinner.tsx
    │   │   └── PageHelp.tsx
    │   ├── layout/
    │   │   ├── TopBar.tsx
    │   │   ├── BottomNav.tsx         ← 5 tabs: Home/Jobs/Schedule/CRM/Settings + NotificationBell
    │   │   ├── SideNav.tsx           ← dark sidebar: Primary (Dashboard/Jobs/Schedule/CRM/Finances) + Secondary (Analytics/Time/Notes/Vendors/Calculator/Advertising/Equipment/Settings) + NotificationBell
    │   │   └── NotificationBell.tsx  ← badge count + slide-down panel, mark read
    │   ├── estimates/
    │   │   ├── EstimateCard.tsx
    │   │   ├── EstimateStatusBadge.tsx
    │   │   ├── EstimateFilters.tsx
    │   │   ├── QuickCaptureForm.tsx
    │   │   ├── StatusSelect.tsx
    │   │   ├── AssigneeSelect.tsx
    │   │   ├── LineItemsSection.tsx
    │   │   ├── PaymentsSection.tsx
    │   │   ├── MakeClientButton.tsx  ← converts estimate contact → CRM customer
    │   │   └── SendQuoteButton.tsx   ← generates quote_token, emails customer, shows response status
    │   ├── media/
    │   │   ├── MediaSection.tsx
    │   │   ├── MediaUploader.tsx
    │   │   ├── MediaGrid.tsx
    │   │   ├── MediaViewer.tsx
    │   │   ├── PhotoAnnotator.tsx
    │   │   ├── VideoPlayer.tsx
    │   │   └── MediaCommentForm.tsx
    │   ├── measurements/
    │   │   ├── MeasurementsSection.tsx
    │   │   ├── MeasurementForm.tsx
    │   │   ├── MeasurementList.tsx
    │   │   └── TotalAreaDisplay.tsx
    │   ├── notes/
    │   │   ├── NoteCanvas.tsx
    │   │   ├── NoteEditor.tsx
    │   │   ├── NoteCard.tsx
    │   │   ├── NoteShareSheet.tsx
    │   │   └── NotePublicRenderer.tsx
    │   └── team/
    │       └── ShareLinkCard.tsx
    └── lib/
        ├── supabase/
        │   ├── client.ts             ← createBrowserClient<any>
        │   ├── server.ts             ← createServerClient + createServiceClient
        │   └── storage.ts
        ├── hooks/
        │   ├── useAuth.ts
        │   ├── useTeam.ts
        │   ├── useEstimates.ts       ← also exports updateEstimate(id, fields)
        │   ├── useEstimate.ts
        │   ├── useMedia.ts
        │   ├── useMeasurements.ts
        │   ├── useNotes.ts
        │   ├── usePayments.ts
        │   ├── useExpenses.ts
        │   ├── useLineItems.ts
        │   ├── useCompanySettings.ts
        │   ├── useEquipment.ts
        │   ├── useEmployees.ts       ← also exports useTimeEntries(employeeId?)
        │   ├── useCRM.ts             ← useCustomers, useLeads, useContactLogs; useCustomerEstimates(customerId)
        │   ├── useTemplates.ts
        │   ├── usePaymentLinks.ts
        │   ├── useRevenue.ts
        │   ├── useVendors.ts         ← vendor CRUD
        │   ├── useSubscription.ts    ← plan, status, trialDaysLeft
        │   ├── useNotifications.ts   ← in-app notifications, markRead
        │   ├── useReminderSettings.ts ← get/upsert reminder config
        │   ├── useRecurringJobs.ts   ← recurring jobs CRUD + advanceDate()
        │   ├── useServiceCategories.ts ← service category CRUD (team-scoped)
        │   ├── useCrews.ts           ← useCrews() + useScheduleBlocks(estimateId?)
        │   └── useTraining.ts        ← useTraining() modules; useTrainingItems(moduleId) + toggleCompletion
        ├── utils/
        │   ├── status.ts
        │   ├── format.ts
        │   ├── share.ts
        │   └── area.ts
        ├── data/
        │   ├── stateTaxData.ts
        │   └── contractorTips.ts
        └── types/index.ts            ← ALL TypeScript types (single source of truth)
```

## Key Data Flows

### Dashboard home
1. `useEstimates` + `useRevenue` + `useAuth` run in parallel
2. Stats computed client-side: today's jobs, overdue follow-ups, open estimates, month revenue
3. Alerts shown for overdue follow-ups and quotes awaiting customer response

### Quote flow (contractor → customer → contractor)
1. Contractor opens estimate → Quote tab → "Send Quote to Customer"
2. `SendQuoteButton` generates `quote_token`, stores on estimate, POSTs to `/api/quote/send`
3. `/api/quote/send` emails customer via Resend with quote URL + Accept/Decline CTA
4. Customer visits `/quote/[token]` — server renders line items using service role client
5. Customer taps Accept/Decline/Request Changes → `POST /api/quote/[token]/respond`
6. API updates `estimates.customer_response`, creates `notifications` row, emails contractor
7. Contractor sees badge on `NotificationBell` → clicks → navigates to estimate

### Auto reminders (cron)
1. Vercel Cron fires `GET /api/reminders/send` at 8 AM UTC daily
2. Fetches all teams with `reminder_settings.is_enabled = true`
3. For each `days_before` value, computes target date (today + N days)
4. Queries `estimates` with `service_date = targetDate` and `status = 'sold'`
5. Skips if `reminder_log` already has an entry for (estimate_id, days_before, method)
6. Sends email via Resend; inserts `reminder_log` row

### Make Client
1. Estimate detail shows "Make Client" button (violet pill) when `customer_id` is null
2. Click → `useCustomers.addCustomer` with estimate's name/phone/email/address
3. Button changes to green "View in CRM" → links to `/crm/customers/[id]`

### New user signs in
1. Google → `/auth/callback` → session created
2. `useAuth` upserts profile row
3. DB trigger `handle_new_profile` creates team + team_member
4. DB trigger `handle_new_team_subscription` creates `subscriptions` row (plan='free', status='trialing')
5. User lands on `/dashboard`

### Notifications
- Inserted by API routes (service role) into `notifications` table
- `useNotifications` hook polls on mount, exposes `unreadCount`
- `NotificationBell` shows badge, dropdown panel, mark-all-read

## Database Migrations (run in order)
| File | Description |
|------|-------------|
| 001 | Core tables |
| 002 | RLS policies |
| 003 | Triggers |
| 004 | Notes |
| 005 | Auto-team trigger |
| 007 | Role-based RLS |
| 008 | Measurement groups |
| 009 | Company settings + line items |
| 010 | Payments + expenses |
| 011 | Equipment |
| 012 | Templates + follow-up dates |
| 013 | CRM (customers, leads, contact_logs) |
| 014 | Employees + time_entries |
| 015 | Service dates + depreciation |
| 016 | Payment links (Stripe deposits) |
| 017 | Vendors (supplier contacts) |
| 018 | Subscriptions (SaaS billing) |
| 019 | Quote tokens + reminder settings + reminder_log |
| 020 | Notifications |
| 021 | Recurring jobs (maintenance contracts, frequency enum, next_date) |
| 022 | Service categories + category_id + estimated_hours on estimates |
| 023 | Training modules, training_items, training_completions |
| 024 | Crews, crew_members, schedule_blocks + crew_id on estimates |
| 025 | completed_at on estimates (job completion tracking) |

## Known Issues / TODOs
- SMS reminders: UI toggle exists, `send_sms` stored — actual Twilio integration not yet wired
- Photo annotation export (flattened PNG thumbnail) is v2
- Full offline sync is v2 — v1 caches app shell only
- Magic link email requires SMTP configured in Supabase (Google OAuth works without it)
- Schedule drag-and-drop (true drag to reorder) is v2 — current UX is date picker + block form
- Stripe Business plan: add `STRIPE_BUSINESS_PRICE_ID` env var + upgrade flow in billing settings

## Recently Completed
- `estimates.customer_id` is written back to the estimate when Make Client is clicked (fixed in MakeClientButton)
- Employee time reports: CSV export added to Time Tracking page (download button in top bar)
- Stripe subscription lifecycle webhook: `POST /api/billing/webhook` handles checkout.session.completed, subscription.updated/deleted, invoice.payment_failed/succeeded — requires `STRIPE_WEBHOOK_SECRET` env var
