# EstiMate

Full-service field operations platform for landscaping and contracting businesses. Capture leads, build estimates, send quotes, schedule crews, track time, manage employees, run a CRM pipeline, and analyze profitability — all from your phone.

**Live app:** https://esti-mate.vercel.app

---

## Features

### Estimates & Quoting
- **Quick capture** — large touch-friendly form: customer name, phone, email, address, notes
- **Status workflow** — Need to Estimate → Sent → Sold / Lost (reopen from Lost)
- **LMN-style estimate builder** — tabbed catalog drawer (Labor / Equipment / Material / Subs / Other) lets you add employees, equipment, and catalog items in one tap; line items grouped by category with per-category subtotals
- **Service catalog** — save reusable items per category; add to catalog and estimate simultaneously from the drawer
- **Tax calculation** — apply company default tax rate; mark items tax-exempt individually
- **Service categories** — assign user-defined work types (Mowing, Landscaping, Lighting, Snow) to track by category in analytics
- **Assign & crew** — assign estimates to team members or named crews; filter lists by assignee
- **Estimated hours** — log expected hours per job for scheduling and profitability tracking
- **Templates** — save a set of line items as a reusable template for common job types
- **Sort & filter** — search by name, filter by status, sort by date / area / name

### Customer Quote Flow
- **Send quote** — generate a unique link and email the quote to the customer
- **Customer quote page** — no login required; customer sees line items, total, and project photos
- **Accept / Decline / Request changes** — customer taps a response; contractor is notified instantly
- **Auto-advance status** — Accept → Sold, Decline → Lost automatically
- **Quote photos** — attach before/design photos directly on the customer-facing quote page

### Invoice & PDF
- **Invoice view** — clean printable invoice with company branding (logo, contact info)
- **Scalable logo** — adjust logo size on the PDF from company settings
- **Payment summary** — shows total due, payments received, and balance due
- **Save as PDF** — browser print-to-PDF

### Payments & Finances
- **Record payments** — cash, check, card, bank transfer, or other
- **Balance tracking** — live balance due = invoice total − payments received
- **Stripe deposits** — send a deposit payment link; customer pays by card online
- **Log expenses** — description, amount, date, vendor, category
- **CSV export** — download all revenue or expenses as a CSV for bookkeeping
- **P&L view** — revenue vs. expenses with monthly trend charts

### Photos & Media
- **Camera capture** — open phone camera directly from any estimate
- **Gallery upload** — pick from album; supports multiple files
- **Photo annotation** — draw on photos with pen, arrow, rectangle, text tools; color picker; undo stack
- **Video support** — record and attach video walkthroughs
- **Comments** — add comments to individual photos/videos

### Measurements
- **L × W calculator** — enter length and width; area auto-calculated
- **Measurement groups** — organize by material (Mulch, Rock, Dirt, etc.)
- **Total area** — running total maintained by database trigger

### CRM Pipeline
- **Leads board** — kanban-style pipeline: New → Contacted → Quoted → Won / Lost
- **Customers** — full customer profiles with contact info, notes, and job history
- **Contact log** — log calls, emails, visits per lead or customer
- **Import from CSV** — import contacts from LMN, Service Autopilot, or any generic CSV with duplicate detection

### Jobs View
- **My Jobs tab** — jobs assigned directly to you or your crew
- **By Crew tab** — filter jobs by any crew
- **Unscheduled tab** — jobs missing a service date
- **All Jobs tab** — full sold/active job list

### Schedule
- **Calendar view** — month calendar with colored status/category dots per day
- **Hour blocks** — split estimated hours across multiple work days; progress bar shows allocation
- **Unscheduled panel** — jobs without a service date with inline date and crew picker
- **Crew assignment** — assign or change crew directly from the scheduling modal
- **Block indicators** — calendar cells show total hours blocked per day

### Employees
- **Employee profiles** — name, role, pay rate (hourly/salary), hire date, manager
- **Edit employees** — pencil icon on any org-tree row opens a pre-filled edit modal
- **Org tree** — visual hierarchy of your team
- **Time tracking** — clock in/out per job; log hours manually; team-wide time log
- **Time report CSV** — download button exports visible time entries with hours and labor cost
- **Crews** — named groups of employees; assign crews to jobs; crew member management

### Employee Portal (companion view)
- **My jobs** — see today's jobs, upcoming jobs, and unscheduled work assigned to you or your crew
- **Clock in/out** — one-tap clock in and out per job from the portal
- **After photos** — camera-capture after photos directly on a job card
- **Complete Job** — mark a job done with instant profitability summary (revenue, labor cost, margin %)
- **Training** — view and check off training modules published by managers

### Employee Training
- **Modules** — managers create training modules with title, description, and public/private toggle
- **Items** — add checklist items, text blocks, or video links to any module
- **Completions** — track which employees have completed each item
- **Employee view** — employees see only public modules in their portal

### Recurring Jobs
- **Maintenance contracts** — set frequency (weekly, biweekly, monthly, quarterly, annually)
- **Auto-generate estimate** — one tap creates a new estimate pre-filled from the contract
- **Advance next date** — next scheduled date advances automatically after generating
- **Due / Upcoming / Paused** — organized sections by due status

### Analytics
- **YTD P&L** — revenue, expenses, net profit year-to-date
- **Win rate** — estimate win rate and CRM lead conversion rate
- **Monthly charts** — 6-month revenue and expense bar charts
- **Avg job value** — average revenue per won job
- **Service category breakdown** — jobs by category with win-rate bars colored per category

### Schedule Reminders
- **Auto email reminders** — email customers before their service date (configurable days in advance)
- **Vercel Cron** — runs daily at 8 AM UTC; duplicate-safe via reminder_log
- **Custom message** — edit the reminder email body

### Vendors
- **Supplier contacts** — name, category, phone, email, address, notes
- **Quick dial** — tap phone number to call directly from the app

### Equipment
- **Inventory** — track mowers, trucks, trailers, tools
- **Status** — Active / In Maintenance / Retired
- **Activity log** — maintenance, repair, fuel, and note entries
- **Total cost tracking** — cumulative logged costs per equipment item

### Notes
- **Daily notes** — opens today's note automatically; title + freeform text with autosave
- **Browse past notes** — scroll down to see all past notes
- **Share notes** — read-only public link for a single note or all notes

### Search
- **Global search** — search across estimates, customers, notes, and vendors from one screen

### Material Calculator
- **Mulch, rock, soil, sod, seed** — enter dimensions + coverage rate; calculates cubic yards and cost

### Advertising
- **Social post ideas** — seasonal content calendar for landscaping businesses
- **Facebook ads guide** — step-by-step for running local service ads
- **Mailer tips** — direct mail guidance

### Resources
- **50-state tax reference** — sales tax, income tax, SUI rates, and contractor notes
- **Federal payroll taxes** — Social Security, Medicare, FUTA, self-employment tax reference
- **Business tips** — 30+ tips across pricing, sales, cash flow, crew management, growth, and legal

### Subscription & Billing
- **Free / Pro / Business tiers** — 14-day free trial for all new accounts
- **Free tier limit** — 25-estimate cap with a warning banner at 20+, hard block at 25, and upgrade prompt on creation
- **Stripe billing portal** — upgrade, downgrade, or manage payment method in-app
- **Business plan checkout** — upgrade button routes directly to the correct Stripe price ID for Pro or Business
- **Subscription webhook** — `POST /api/billing/webhook` keeps plan/status in sync with Stripe lifecycle events

### PWA
- **Install on phone** — add to home screen, runs full-screen like a native app
- **Works on iOS and Android**

---

## Database Migrations

Run all migrations **in order** via Supabase Dashboard → SQL Editor:

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Core tables (profiles, teams, estimates, media, measurements) |
| `002_rls_policies.sql` | Row-level security policies |
| `003_triggers.sql` | Auto-update `total_area` trigger |
| `004_notes.sql` | Notes + note_shares tables |
| `005_auto_team_trigger.sql` | Auto-create team on signup |
| `007_role_based_rls.sql` | Viewer role gets read-only access |
| `008_measurement_groups.sql` | Measurement groups |
| `009_company_and_line_items.sql` | Company settings, service catalog, estimate line items |
| `010_payments_and_expenses.sql` | Payments and expenses |
| `011_equipment.sql` | Equipment inventory and activity log |
| `012_follow_up_and_templates.sql` | Estimate templates + follow-up dates |
| `013_crm.sql` | CRM: customers, leads, contact_logs |
| `014_employees.sql` | Employees + time_entries |
| `015_service_date_and_depreciation.sql` | Service date + depreciation fields |
| `016_payment_links.sql` | Stripe deposit payment links |
| `017_vendors.sql` | Vendor / supplier contacts |
| `018_subscriptions.sql` | SaaS subscription plans + billing |
| `019_quote_and_reminders.sql` | Quote tokens, customer response, reminder_settings, reminder_log |
| `020_notifications.sql` | In-app notifications |
| `021_recurring_jobs.sql` | Recurring jobs (maintenance contracts) |
| `022_service_categories.sql` | Service categories + category_id / estimated_hours on estimates |
| `023_training.sql` | Training modules, items, and per-employee completions |
| `024_crews.sql` | Crews, crew_members, schedule_blocks + crew_id on estimates |
| `025_job_completion.sql` | completed_at timestamp on estimates |
| `026_line_item_categories.sql` | category column on estimate_line_items (labor/equipment/material/subs/other) |

---

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run all SQL migrations in order via Dashboard → SQL Editor
3. Enable Google OAuth in Authentication → Providers → Google (optional)
4. Create a storage bucket named `estimate-media` (public read, authenticated write)

### 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional — enables quote emails + reminders
RESEND_API_KEY=your-resend-api-key

# Optional — enables Stripe billing + deposits
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PRO_PRICE_ID=your-stripe-pro-price-id
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional — secures the cron endpoint
CRON_SECRET=any-random-string
```

### 3. Run Locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Tech Stack

- **Next.js 14** — App Router, TypeScript, PWA
- **Tailwind CSS** — mobile-first, large touch targets
- **Supabase** — auth (magic link + Google OAuth), PostgreSQL, file storage, RLS
- **Konva.js / react-konva** — photo annotation canvas
- **Stripe** — deposit payment links + subscription billing
- **Resend** — transactional email (quote send, reminders, notifications)
- **next-pwa** — service worker, installable PWA

---

## Navigation

### Mobile Bottom Nav
| Tab | Description |
|-----|-------------|
| Home | Dashboard — KPIs, today's jobs, alerts |
| Jobs | Jobs view — My Jobs / By Crew / Unscheduled / All |
| Schedule | Calendar + hour blocking + unscheduled panel |
| CRM | Leads pipeline + customer database |
| Settings | Full settings hub |

### Desktop Sidebar (Main)
Dashboard · Jobs · Estimates · Schedule · CRM · Finances

### Desktop Sidebar (More)
Portal · Search · Recurring · Training · Analytics · Time · Notes · Vendors · Calculator · Advertising · Equipment · Settings
