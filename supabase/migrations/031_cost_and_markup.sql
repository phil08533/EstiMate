-- Add cost + markup columns to line items
ALTER TABLE estimate_line_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS markup_pct NUMERIC(5,2) NOT NULL DEFAULT 0;

-- Add default markup to company settings
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS default_markup_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
