-- Controls whether the customer quote shows itemized line items or just the total
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS quote_show_line_items BOOLEAN NOT NULL DEFAULT true;
