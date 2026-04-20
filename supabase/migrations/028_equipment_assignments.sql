-- Equipment assignments: which equipment is scheduled on which job on which date
-- Enables the equipment scheduling view on the Equipment page

CREATE TABLE IF NOT EXISTS public.equipment_assignments (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  estimate_id  uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  team_id      uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  assigned_date date NOT NULL,
  notes        text,
  created_by   uuid NOT NULL REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (equipment_id, estimate_id, assigned_date)
);

CREATE INDEX IF NOT EXISTS equipment_assignments_date_idx
  ON public.equipment_assignments (team_id, assigned_date);

CREATE INDEX IF NOT EXISTS equipment_assignments_equipment_idx
  ON public.equipment_assignments (equipment_id, assigned_date);

ALTER TABLE public.equipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can manage equipment assignments"
  ON public.equipment_assignments FOR ALL
  USING (team_id IN (SELECT public.get_user_team_ids()))
  WITH CHECK (team_id IN (SELECT public.get_user_team_ids()));
