# EstiMate

Field estimator helper app for contractors. Quickly capture customer info when someone calls, track estimates through a workflow, annotate photos, record measurements, and share your library with your team.

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then:

1. Run the 3 SQL migration files in order via the Supabase SQL editor:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_triggers.sql`

2. Copy `.env.local.example` to `.env.local` and fill in your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 on your phone or browser.

## Features

- **Quick capture** — big touch-friendly form to save customer name, phone, email, address, and notes
- **Estimate tracking** — statuses: Need to Estimate → Sent → Sold / Lost
- **Assign** — assign estimates to team members
- **Photos & videos** — take photos from phone camera, add to estimates
- **Draw on photos** — pen, arrow, rectangle, text tools with color picker and undo
- **Measurements** — enter L x W, get area automatically; total area tracked across all measurements
- **Share library** — generate a link to share all estimates (read-only, no login needed)
- **PWA** — install on phone home screen, runs full-screen

## Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Supabase (auth, PostgreSQL, file storage)
- Konva.js / react-konva (photo annotation)
