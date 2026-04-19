-- Track what each catalog item costs you (vs. what you charge)
alter table public.service_items
  add column if not exists default_cost numeric not null default 0,
  add column if not exists markup_pct  numeric;  -- null = inherit company default

-- Company-wide default markup percentage (e.g. 40 = 40% on top of cost)
alter table public.company_settings
  add column if not exists default_markup numeric not null default 30;

-- Track unit cost on line items so we can show per-estimate profitability
alter table public.estimate_line_items
  add column if not exists unit_cost numeric not null default 0;
