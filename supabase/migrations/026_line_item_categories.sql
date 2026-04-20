-- Add category to estimate_line_items
-- Allows grouping items by Labor / Equipment / Material / Subs / Other in the estimate builder

ALTER TABLE estimate_line_items
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other';

-- Backfill existing rows — keep as 'other'
UPDATE estimate_line_items SET category = 'other' WHERE category IS NULL;

-- Index for future grouping queries
CREATE INDEX IF NOT EXISTS estimate_line_items_category_idx
  ON estimate_line_items (estimate_id, category);
