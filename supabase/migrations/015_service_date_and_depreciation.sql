-- Migration 015: service_date on estimates, equipment categories + depreciation fields

alter table public.estimates
  add column if not exists service_date date;

alter table public.equipment
  add column if not exists category text,            -- 'mower','truck','trailer','hand_tool','power_tool','other'
  add column if not exists useful_life_years integer, -- for depreciation
  add column if not exists salvage_value numeric default 0;
