# EstiMate — Claude Code Context

## Project Overview
EstiMate is a mobile-first field estimator helper app for contractors. Primary use case: quickly
capture customer info on a phone when a customer calls, track estimates through a workflow, assign
them to team members, annotate photos taken in the field, record measurements, and share the
estimate library with others.

## Tech Stack
- **Next.js 14** (App Router, TypeScript) — PWA, works on phone + desktop
- **Tailwind CSS** — mobile-first, large touch targets
- **Supabase** — auth (magic link email OTP), PostgreSQL, file storage
- **Konva.js + react-konva** — photo annotation/drawing canvas
- **next-pwa** — service worker, installable PWA

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

### Database Key Points
- `estimates.total_area` is maintained by a PostgreSQL trigger — NEVER calculate it in app code
- `measurements.area` is a `GENERATED ALWAYS AS (length * width) STORED` column
- `share_tokens` allow unauthenticated read-only access to a team's estimates
- All tables have RLS enabled — test with different user sessions when debugging permission errors
- Storage bucket name: `estimate-media`, path pattern: `{team_id}/{estimate_id}/{uuid}.ext`

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=    # server-only, never expose to client
```

Copy `.env.local.example` to `.env.local` and fill in values from your Supabase project dashboard.

## Running Locally
```bash
npm run dev       # starts on http://localhost:3000
npm run build     # production build
npm run lint      # lint check
```

For Supabase: apply migrations manually via the Supabase dashboard SQL editor, or use the Supabase CLI:
```bash
supabase db push
```

## File Structure Summary
```
src/
├── app/
│   ├── (auth)/login/           ← magic link login
│   ├── (app)/                  ← protected routes (auth guard in layout)
│   │   ├── estimates/          ← list, new, [id], [id]/edit
│   │   └── team/               ← team management + share links
│   └── shared/[token]/         ← public read-only view (no auth required)
├── components/
│   ├── ui/                     ← Button, Badge, Input, Textarea, Modal, Sheet, Spinner
│   ├── estimates/              ← EstimateCard, QuickCaptureForm, StatusSelect, AssigneeSelect
│   ├── media/                  ← MediaUploader, MediaGrid, MediaViewer, PhotoAnnotator, VideoPlayer
│   ├── measurements/           ← MeasurementForm, MeasurementList, TotalAreaDisplay
│   ├── team/                   ← ShareLinkCard, TeamMemberList, InviteMemberForm
│   └── layout/                 ← BottomNav, TopBar, AuthGuard
├── lib/
│   ├── supabase/               ← client.ts, server.ts, storage.ts
│   ├── hooks/                  ← useEstimates, useEstimate, useMedia, useMeasurements, useTeam, useAuth
│   ├── utils/                  ← area.ts, status.ts, share.ts, format.ts
│   └── types/index.ts          ← ALL TypeScript interfaces
└── middleware.ts               ← session refresh + route protection
```

---

## Progress Tracker

### Completed
- [x] CLAUDE.md created
- [x] Next.js 14 project scaffolded (TypeScript, Tailwind, App Router)
- [x] Dependencies installed (Supabase, Konva, next-pwa)
- [x] Supabase migrations (001_initial_schema, 002_rls_policies, 003_triggers)
- [x] Supabase lib helpers (client, server, storage, middleware)
- [x] Auth pages (login magic link, callback route)
- [x] App layout (auth guard, bottom nav, top bar)
- [x] TypeScript types (src/lib/types/index.ts)
- [x] Hooks (useAuth, useEstimates, useEstimate, useMedia, useMeasurements, useTeam)
- [x] Utility functions (status, area, format, share)
- [x] UI primitives (Button, Badge, Input, Textarea, Modal, Sheet, Spinner)
- [x] Estimates List page (sort/filter, status filter chips, FAB)
- [x] Quick Capture Form (/estimates/new)
- [x] Estimate Detail page (info, status, assignee, tabs)
- [x] Edit Estimate page
- [x] Media components (MediaUploader, MediaGrid, MediaViewer, VideoPlayer, MediaCommentForm)
- [x] PhotoAnnotator (Konva.js, pen/arrow/rect/text tools, undo, save JSON)
- [x] Measurements (MeasurementForm, MeasurementList, TotalAreaDisplay)
- [x] Team Management page
- [x] Share link generation + public read-only view
- [x] PWA (manifest.json, next-pwa config, icons)

### In Progress
(none)

### Known Issues / TODOs
- Supabase project credentials must be added to .env.local before the app will connect to data
- For production: set up email SMTP in Supabase for magic link delivery
- Photo annotation export (flattened PNG for thumbnail) is v2 feature
- Full offline sync (optimistic updates + queue) is v2 — v1 caches app shell only
