# EstiMate — Claude Code Context

## Project Overview
EstiMate is a mobile-first field estimator helper app for contractors. Primary use case: quickly
capture customer info on a phone when a customer calls, track estimates through a workflow, assign
them to team members, annotate photos taken in the field, record measurements, and share the
estimate library with others. Also includes a Notes section for freeform text or whiteboard drawing.

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
- Every user gets a personal team auto-created on first login (no manual team setup)
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

### Database Key Points
- `estimates.total_area` is maintained by a PostgreSQL trigger — NEVER calculate it in app code
- `measurements.area` is a `GENERATED ALWAYS AS (length * width) STORED` column
- `share_tokens` allow unauthenticated read-only access to a team's estimates
- `note_shares` allow unauthenticated read-only access to team notes (note_id=null) or one note
- All tables have RLS enabled — test with different user sessions when debugging permission errors
- Storage bucket name: `estimate-media`, path pattern: `{team_id}/{estimate_id}/{uuid}.ext`
- RLS storage policy: `owner = auth.uid()` (owner column is uuid type)

## Environment Variables
Copy from `.env.local` (gitignored). Keys are in Supabase dashboard → Settings → API.
```
NEXT_PUBLIC_SUPABASE_URL=https://ranccgjmxcpsbxqibojx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key from Supabase dashboard>
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
├── .npmrc                          ← legacy-peer-deps=true (react-konva fix)
├── .env.local                      ← local secrets (gitignored)
├── next.config.mjs                 ← next-pwa config, PWA enabled
├── tailwind.config.ts
├── supabase/migrations/
│   ├── 001_initial_schema.sql      ← profiles, teams, team_members, estimates,
│   │                                  estimate_media, measurements, share_tokens
│   ├── 002_rls_policies.sql        ← RLS for all tables + storage bucket
│   ├── 003_triggers.sql            ← update_estimate_total_area() trigger
│   └── 004_notes.sql               ← notes, note_shares tables + RLS
└── src/
    ├── middleware.ts                ← session refresh + route protection
    ├── app/
    │   ├── layout.tsx               ← root layout, system fonts (no Google Fonts)
    │   ├── globals.css
    │   ├── page.tsx                 ← redirects / → /estimates
    │   ├── (auth)/login/page.tsx    ← magic link + Google OAuth login
    │   ├── auth/callback/route.ts   ← OAuth callback, auto-joins team if invited
    │   ├── (app)/layout.tsx         ← auth guard (redirects to /login), bottom nav
    │   ├── (app)/estimates/
    │   │   ├── page.tsx             ← estimate list, sort/filter, FAB
    │   │   ├── new/page.tsx         ← quick capture form wrapper
    │   │   ├── [id]/page.tsx        ← estimate detail: status, assignee, media, measurements
    │   │   └── [id]/edit/page.tsx   ← edit customer info
    │   ├── (app)/notes/
    │   │   ├── page.tsx             ← notes list grouped by date, FAB creates new note
    │   │   └── [id]/page.tsx        ← note editor (text or draw), share, delete
    │   ├── (app)/team/page.tsx      ← team name, members, invite, share links
    │   └── shared/
    │       ├── [token]/page.tsx     ← public read-only estimates view (no auth)
    │       └── notes/[token]/page.tsx ← public read-only notes view (no auth)
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx           ← variants: primary/secondary/ghost/danger, sizes sm/md/lg
    │   │   ├── Badge.tsx
    │   │   ├── Input.tsx
    │   │   ├── Textarea.tsx
    │   │   ├── Modal.tsx            ← bottom sheet on mobile, centered on desktop
    │   │   └── Spinner.tsx
    │   ├── layout/
    │   │   ├── BottomNav.tsx        ← Estimates | Notes | Team | Sign out
    │   │   └── TopBar.tsx           ← back button + title + optional right slot
    │   ├── estimates/
    │   │   ├── EstimateCard.tsx     ← list card with status badge, assignee, area
    │   │   ├── EstimateStatusBadge.tsx
    │   │   ├── EstimateFilters.tsx  ← search bar + status filter chips + sort
    │   │   ├── QuickCaptureForm.tsx ← name/phone/email/address/comments form
    │   │   ├── StatusSelect.tsx     ← inline status dropdown
    │   │   └── AssigneeSelect.tsx   ← inline assignee dropdown
    │   ├── media/
    │   │   ├── MediaSection.tsx     ← tab container for media on estimate detail
    │   │   ├── MediaUploader.tsx    ← file input with camera capture
    │   │   ├── MediaGrid.tsx        ← thumbnail grid
    │   │   ├── MediaViewer.tsx      ← fullscreen viewer with annotation trigger
    │   │   ├── PhotoAnnotator.tsx   ← Konva canvas: pen/arrow/rect/text, undo, save
    │   │   ├── VideoPlayer.tsx      ← HTML5 video player
    │   │   └── MediaCommentForm.tsx ← comment on media items
    │   ├── measurements/
    │   │   ├── MeasurementsSection.tsx
    │   │   ├── MeasurementForm.tsx  ← L × W → area preview
    │   │   ├── MeasurementList.tsx
    │   │   └── TotalAreaDisplay.tsx ← reads estimates.total_area (trigger-maintained)
    │   ├── notes/
    │   │   ├── NoteCanvas.tsx       ← Konva whiteboard: pen/text/eraser/pan,
    │   │   │                           wheel+pinch zoom, undo, color+stroke picker
    │   │   ├── NoteEditor.tsx       ← text/draw mode toggle, title, debounced autosave
    │   │   ├── NoteCard.tsx         ← list card showing title + preview
    │   │   ├── NoteShareSheet.tsx   ← share this note / share all notes
    │   │   └── NotePublicRenderer.tsx ← client component for public notes view
    │   └── team/
    │       └── ShareLinkCard.tsx    ← generate/copy/delete estimate share links
    └── lib/
        ├── supabase/
        │   ├── client.ts            ← createBrowserClient (no DB generic)
        │   ├── server.ts            ← createServerClient + createServiceClient
        │   └── storage.ts           ← upload/signed URL helpers
        ├── hooks/
        │   ├── useAuth.ts           ← user, profile, signOut; upserts profile on load
        │   ├── useTeam.ts           ← team, members; auto-creates team if none exists
        │   ├── useEstimates.ts      ← list with filters; createEstimate auto-creates team
        │   ├── useEstimate.ts       ← single estimate + updateEstimate
        │   ├── useMedia.ts          ← upload, list, delete media for an estimate
        │   ├── useMeasurements.ts   ← add/list/delete measurements
        │   └── useNotes.ts          ← useNotes (list+CRUD+share) + useNote (single)
        ├── utils/
        │   ├── status.ts            ← getStatusLabel(), getStatusColor()
        │   ├── format.ts            ← formatPhone, formatArea, formatDate, formatDateRelative
        │   ├── share.ts             ← generateShareToken(), getShareUrl()
        │   └── area.ts              ← area calculation helpers
        └── types/index.ts           ← ALL TypeScript interfaces (single source of truth)
```

## Key Data Flows

### New user signs in (Google OAuth)
1. Google redirects to `/auth/callback?code=...`
2. `exchangeCodeForSession` creates Supabase session
3. `useAuth` upserts profile row (handles trigger race condition)
4. `useTeam` upserts profile again (safety) then inserts team + team_member row
5. User lands on `/estimates` with their personal team ready

### Creating an estimate
1. User taps FAB → `/estimates/new`
2. `QuickCaptureForm` collects customer info
3. `useEstimates.createEstimate` looks up team membership
4. If no team found (edge case), auto-creates team inline
5. Inserts estimate row → redirects to `/estimates/[id]`

### Notes autosave
1. User types in `NoteEditor` or draws on `NoteCanvas`
2. `scheduleAutoSave` debounces 800ms
3. Pending updates merged in `pendingRef` so rapid changes batch correctly
4. `useNote.updateNote` patches the DB row

### Share links
- Estimates: `share_tokens` table → `/shared/[token]` (server-rendered, no auth)
- Notes: `note_shares` table → `/shared/notes/[token]` (server-rendered, no auth)
- Both use service role client to bypass RLS for public access

## Known Issues / TODOs
- Photo annotation export (flattened PNG thumbnail) is v2
- Full offline sync (optimistic updates + queue) is v2 — v1 caches app shell only
- Magic link email requires SMTP configured in Supabase (Google OAuth works without it)
- If team auto-creation fails (very rare), Team page shows spinner → user must refresh
