# EstiMate

Field estimator helper app for contractors. Capture customer info on your phone when someone calls, track estimates through your workflow, take and annotate photos, record measurements by group, write daily notes, and share everything with your team.

**Live app:** https://esti-mate.vercel.app

---

## Features

### Estimates
- **Quick capture** — large touch-friendly form: customer name, phone, email, address, notes
- **Status workflow** — Need to Estimate → Sent → Sold / Lost (reopen from Lost)
- **Assign** — assign estimates to any team member; filter the list by assignee
- **Sort & filter** — search by name, filter by status, sort by date / area / name
- **Edit** — update any customer info at any time

### Photos & Media
- **Camera capture** — tap Camera to open the phone camera directly; tap Gallery to pick from album
- **Photo annotation** — draw on photos with pen, arrow, rectangle, and text tools; color picker; undo stack
- **Video support** — record and attach video walkthroughs
- **Comments** — add comments to individual photos/videos

### Measurements
- **L × W calculator** — enter length and width, area is calculated automatically
- **Measurement groups** — organize by material (Mulch, Rock, Dirt, etc.); each group shows its subtotal
- **Move between groups** — tap the arrow on any measurement to reassign it to a different group
- **Total area** — running total across all measurements, maintained by the database

### Notes
- **Daily notes** — opens today's note automatically; title + freeform text with autosave
- **Browse past notes** — scroll down to see all past notes grouped by date
- **Search** — search past notes by title or content
- **Share notes** — generate a read-only link for a single note or all notes

### Team
- **Auto team** — every account gets a personal team automatically on first login
- **Invite members** — send a magic-link invite by email
- **Roles** — invite as **Member** (can add/edit) or **Viewer** (read-only); change roles at any time
- **Remove members** — team owner can remove anyone
- **Rename team** — change the team name
- **My Account** — update your display name

### Sharing (public, no login required)
- **Share estimates** — generate a link to your full estimate library (read-only)
- **Share notes** — generate a link to a single note or all notes

### PWA
- **Install on phone** — add to home screen, runs full-screen like a native app
- **Installable on iOS and Android**

---

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run the SQL migrations **in order** via the SQL editor (Dashboard → SQL Editor → New query):

| File | What it does |
|------|-------------|
| `supabase/migrations/001_initial_schema.sql` | Core tables |
| `supabase/migrations/002_rls_policies.sql` | Row-level security |
| `supabase/migrations/003_triggers.sql` | Auto-update total_area |
| `supabase/migrations/004_notes.sql` | Notes + note_shares tables |
| `supabase/migrations/005_auto_team_trigger.sql` | Auto-create team on signup |
| `supabase/migrations/006_*.sql` | (if present) Additional schema |
| `supabase/migrations/007_role_based_rls.sql` | Viewer role gets read-only |
| `supabase/migrations/008_measurement_groups.sql` | Measurement groups |

Enable **Google OAuth** in Supabase → Authentication → Providers → Google (optional, magic link works without it).

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

## Tech stack

- **Next.js 14** — App Router, TypeScript, PWA
- **Tailwind CSS** — mobile-first, large touch targets
- **Supabase** — auth (magic link + Google OAuth), PostgreSQL, file storage
- **Konva.js / react-konva** — photo annotation canvas
- **next-pwa** — service worker, installable PWA

---

## Roadmap

> Ideas for future versions — not yet built.

- [ ] **Line items & pricing** — add materials/labor with quantities and unit prices; auto-calculate estimate total
- [ ] **PDF export** — generate a professional estimate PDF to email to the customer
- [ ] **Material calculator** — enter sq ft + material type → bags/yards needed and cost estimate
- [ ] **Follow-up reminders** — set a follow-up date on an estimate; see overdue follow-ups highlighted
- [ ] **Estimate templates** — save a set of measurements/line items as a reusable template for common job types
- [ ] **Customer database** — link multiple estimates to the same customer record; see full history per customer
- [ ] **Job calendar** — once Sold, schedule the job on a calendar view
- [ ] **Invoice generation** — convert a sold estimate into a simple invoice
- [ ] **Offline mode** — queue changes when offline; sync automatically when back online
- [ ] **Voice notes** — dictate notes via speech-to-text instead of typing
