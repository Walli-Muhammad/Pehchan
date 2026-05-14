-- ============================================================
-- Run this in your Supabase SQL Editor
-- Migrates the gateway column from a rigid enum to TEXT
-- so we can add 'cod' and 'whatsapp' without touching the schema again
-- ============================================================

-- Step 1: add a temporary TEXT column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gateway_text TEXT;

-- Step 2: copy existing enum values into the text column
UPDATE public.orders SET gateway_text = gateway::TEXT;

-- Step 3: drop the old enum column
ALTER TABLE public.orders DROP COLUMN IF EXISTS gateway;

-- Step 4: rename new column to 'gateway'
ALTER TABLE public.orders RENAME COLUMN gateway_text TO gateway;

-- Step 5: set sensible default
ALTER TABLE public.orders ALTER COLUMN gateway SET DEFAULT 'cod';

-- Done. gateway is now TEXT — accepts 'cod', 'whatsapp', 'safepay', anything.
