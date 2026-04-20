-- Add job completion tracking to estimates
alter table estimates add column if not exists completed_at timestamptz;
