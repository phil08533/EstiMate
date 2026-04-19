# EstiMate

Full-service field operations app for landscaping and contracting businesses. Capture customer info, build estimates, track jobs, manage payments and expenses, log equipment, and run your business from your phone.

**Live app:** https://esti-mate.vercel.app

---

## Features

### Estimates & Quoting
- **Quick capture** — large touch-friendly form: customer name, phone, email, address, notes
- **Status workflow** — Need to Estimate → Sent → Sold / Lost (reopen from Lost)
- **Line items** — add materials, labor, and services with quantities and unit prices
- **Service catalog** — save reusable items with default prices for one-tap quoting
- **Tax calculation** — apply company default tax rate; mark items tax-exempt individually
- **Assign** — assign estimates to any team member; filter the list by assignee
- **Sort & filter** — search by name, filter by status, sort by date / area / name

### Invoice & PDF
- **Invoice view** — clean printable invoice with company branding (logo, contact info)
- **Scalable logo** — adjust logo size on the PDF from company settings
- **Payment summary** — shows total due, payments received, and balance due
- **Save as PDF** — tap "Save PDF" to download via the browser's print-to-PDF function

### Payments
- **Record payments** — cash, check, card, bank transfer, or other
- **Balance tracking** — live balance due = invoice total − payments received
- **Payment history** — full log of all payments per estimate

### Photos & Media
- **Camera capture** — tap Camera to open the phone camera directly
- **Gallery upload** — tap Gallery to pick from album; supports multiple files
- **Photo annotation** — draw on photos with pen, arrow, rectangle, text tools; color picker; undo stack
- **Video support** — record and attach video walkthroughs
- **Comments** — add comments to individual photos/videos

### Measurements
- **L × W calculator** — enter length and width, area is calculated automatically
- **Measurement groups** — organize by material (Mulch, Rock, Dirt, etc.); each group shows its subtotal
- **Move between groups** — reassign any measurement to a different group
- **Total area** — running total across all measurements, maintained by the database

### Expenses
- **Log expenses** — description, amount, date, vendor, and category
- **Categories** — materials, labor, equipment, fuel, insurance, marketing, office, utilities, subcontractor, other
- **Monthly grouping** — expenses grouped by month with per-month totals
- **Breakdown by category** — see where money is going at a glance

### Equipment
- **Inventory** — track mowers, trucks, trailers, tools, and any equipment
- **Status** — Active / In Maintenance / Retired
- **Details** — make, model, year, serial number, purchase date and price
- **Activity log** — maintenance, repair, fuel, and note entries with date and cost
- **Total cost tracking** — cumulative logged costs per piece of equipment

### Notes
- **Daily notes** — opens today's note automatically; title + freeform text with autosave
- **Browse past notes** — scroll down to see all past notes grouped by date
- **Search** — search past notes by title or content
- **Share notes** — generate a read-only link for a single note or all notes

### Team & Account
- **My Account** — update your display name
- **Auto team** — every account gets a personal team automatically on first login
- **Invite members** — send a magic-link invite by email
- **Roles** — invite as Member (can add/edit) or Viewer (read-only); change roles at any time
- **Remove members** — team owner can remove anyone
- **Rename team** — change the team name

### Company Settings
- **Branding** — upload company logo with adjustable scale for PDFs
- **Contact info** — company name, phone, email, address, website, license number
- **Billing defaults** — default tax rate, payment terms, footer note for PDFs

### Sharing (public, no login required)
- **Share estimates** — generate a link to your full estimate library (read-only)
- **Share notes** — generate a link to a single note or all notes

### Resources
- **50-state tax reference** — sales tax, income tax, SUI rates, and contractor notes for all 50 states + DC
- **Federal payroll taxes** — Social Security, Medicare, FUTA, self-employment tax reference
- **Business tips** — 30+ tips across pricing, sales, cash flow, crew management, growth, and legal protection

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
| `008_measurement_groups.sql` | Measurement groups table + group_id column |
| `009_company_and_line_items.sql` | Company settings, service catalog, estimate line items |
| `010_payments_and_expenses.sql` | Payment and expense tracking tables |
| `011_equipment.sql` | Equipment inventory and activity log tables |

---

## Setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run all SQL migrations (table above) via Dashboard → SQL Editor
3. Enable Google OAuth in Authentication → Providers → Google (optional)

### 2. Environment variables

Copy `.env.local.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — works on desktop and mobile.

---

## Tech Stack

- **Next.js 14** — App Router, TypeScript, PWA
- **Tailwind CSS** — mobile-first, large touch targets
- **Supabase** — auth (magic link + Google OAuth), PostgreSQL, file storage
- **Konva.js / react-konva** — photo annotation canvas
- **next-pwa** — service worker, installable PWA

---

## Navigation

| Tab | What's there |
|-----|-------------|
| Estimates | Estimate list, quick capture, estimate detail (quote, media, measurements, payments, notes), invoice/PDF |
| Finances | Expense log with categories and monthly grouping |
| Notes | Today's note (inline), past notes with search |
| Resources | Business tips + 50-state tax reference |
| Settings | Company settings, team & members, equipment inventory |

---

## Roadmap

> Ideas for future versions — not yet built.

- [ ] **Material calculator** — enter sq ft + material type → bags/yards needed and cost
- [ ] **Follow-up reminders** — set a follow-up date; see overdue estimates highlighted
- [ ] **Estimate templates** — save a set of line items as a reusable template for common job types
- [ ] **Customer database** — link multiple estimates to one customer; see full history
- [ ] **Job calendar** — once Sold, schedule the job on a calendar view
- [ ] **Revenue tracking** — pull payment totals from paid estimates into a P&L view
- [ ] **Offline mode** — queue changes when offline; sync automatically when back online
- [ ] **Voice notes** — dictate notes via speech-to-text instead of typing
- [ ] **Crew time tracking** — log hours per job per crew member
- [ ] **Supplier contacts** — quick-dial suppliers from the app

---

## Prompt for a New Claude Session

Use this to onboard a fresh Claude when you want to continue development:

```
You are continuing development on EstiMate — a full-service SaaS field operations app for landscaping and contracting businesses.

**Read CLAUDE.md first** — it has the full project context, tech stack, conventions, and file map.
**Read README.md** — it has what's built, what's pending (your setup checklist), and the future roadmap.

Tech stack: Next.js 14 App Router + TypeScript, Tailwind CSS, Supabase (auth + PostgreSQL + storage), Stripe (payments), Konva.js (drawing/annotation), next-pwa.

Live app: https://esti-mate.vercel.app
GitHub: phil08533/EstiMate (main branch auto-deploys to Vercel)
Supabase project: ranccgjmxcpsbxqibojx

Key conventions:
- All types are in src/lib/types/index.ts — never redeclare elsewhere
- All DB access goes through hooks in src/lib/hooks/ — never call Supabase directly in components
- RLS is the security boundary — Postgres row-level security handles all data isolation
- estimates.total_area is trigger-maintained — never calculate in app code
- Use `const { id } = params` (NOT `use(params)`) for route params
- No `any` types — use proper TypeScript throughout

Current state of the app:
- Estimates with full workflow (capture → quote → send → payment → sold)
- Quick-tap service catalog with category filters, cost tracking, profit margins
- Stripe payment links for customer deposits
- Desktop sidebar layout + mobile bottom nav
- CRM (leads + customers), Schedule/calendar, Finances (P&L, expenses), Analytics
- Equipment inventory with depreciation, Employee org tree
- Notes (text + whiteboard canvas), Photo annotation (Konva)
- Measurements with area calculator and import-to-quote

Pending user setup (they haven't done this yet):
- Run supabase/migrations/016_payment_links.sql in Supabase dashboard
- Run supabase/migrations/017_catalog_and_markup.sql in Supabase dashboard
- Add STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to Vercel env vars
- Set up Stripe webhook endpoint: https://esti-mate.vercel.app/api/payments/confirm

What to work on next (ask the user what they want):
- Any features from the roadmap in README.md
- Bug fixes or polish on existing features
- New business requirements the user describes

Always run `npm run build` before committing to catch TypeScript errors. Deploy by pushing to main.
```
