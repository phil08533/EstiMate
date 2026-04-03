-- EstiMate Triggers
-- Maintains estimates.total_area automatically when measurements change

create or replace function public.update_estimate_total_area()
returns trigger language plpgsql security definer as $$
declare
  v_estimate_id uuid;
begin
  -- Determine which estimate_id to update
  if TG_OP = 'DELETE' then
    v_estimate_id := OLD.estimate_id;
  else
    v_estimate_id := NEW.estimate_id;
  end if;

  -- Recalculate and store total area
  update public.estimates
  set total_area = coalesce(
    (select sum(area) from public.measurements where estimate_id = v_estimate_id),
    0
  )
  where id = v_estimate_id;

  if TG_OP = 'DELETE' then
    return OLD;
  else
    return NEW;
  end if;
end;
$$;

-- Trigger fires after any measurement insert, update, or delete
drop trigger if exists measurements_update_total_area on public.measurements;
create trigger measurements_update_total_area
  after insert or update or delete on public.measurements
  for each row execute function public.update_estimate_total_area();
