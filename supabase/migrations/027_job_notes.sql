-- Job notes entered by field employees from the portal
-- Linked directly to an estimate (job)

CREATE TABLE IF NOT EXISTS public.job_notes (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  team_id     uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_notes_estimate_idx
  ON public.job_notes (estimate_id, created_at DESC);

ALTER TABLE public.job_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view job notes"
  ON public.job_notes FOR SELECT
  USING (team_id IN (SELECT public.get_user_team_ids()));

CREATE POLICY "Team members can add job notes"
  ON public.job_notes FOR INSERT
  WITH CHECK (
    team_id IN (SELECT public.get_user_team_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Creator can delete job notes"
  ON public.job_notes FOR DELETE
  USING (created_by = auth.uid());
