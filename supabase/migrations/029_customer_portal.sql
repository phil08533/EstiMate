-- Customer portal: each customer gets a unique portal_token
-- Visiting /customer/[token] shows all their estimates (no login required)

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS portal_token TEXT;

-- Generate tokens for existing customers
UPDATE public.customers
  SET portal_token = encode(gen_random_bytes(18), 'hex')
  WHERE portal_token IS NULL;

-- Ensure uniqueness
ALTER TABLE public.customers
  ADD CONSTRAINT customers_portal_token_unique UNIQUE (portal_token);

-- Default for new customers
ALTER TABLE public.customers
  ALTER COLUMN portal_token SET DEFAULT encode(gen_random_bytes(18), 'hex');

CREATE INDEX IF NOT EXISTS customers_portal_token_idx
  ON public.customers (portal_token);

-- Allow unauthenticated read via service role (used in the portal page server component)
-- The portal route uses the service role client, so no additional RLS needed.
