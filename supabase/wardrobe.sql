-- =============================================
-- PEHCHAN — Saved Designs (Customer Wardrobe)
-- Run this in the Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.saved_designs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email       TEXT NOT NULL,
  image_snapshot   TEXT NOT NULL,     -- base64 JPEG of the Konva canvas
  size             TEXT,
  color_label      TEXT,
  color_hex        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved designs
CREATE POLICY "Users can view own saved designs"
  ON public.saved_designs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved designs
CREATE POLICY "Users can save designs"
  ON public.saved_designs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved designs
CREATE POLICY "Users can delete own saved designs"
  ON public.saved_designs FOR DELETE
  USING (auth.uid() = user_id);

-- Allow customers to view their own orders (matches by email)
-- Add this policy on top of the existing RLS on orders table
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
