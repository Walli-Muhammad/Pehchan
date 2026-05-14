-- Run this in your Supabase SQL Editor

-- 1. Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 3. Anyone can read categories
CREATE POLICY "Categories are publicly readable"
  ON public.categories FOR SELECT
  USING (true);

-- 4. Seed default categories
INSERT INTO public.categories (name, slug) VALUES
  ('Anime', 'anime'),
  ('Sports', 'sports'),
  ('Originals', 'originals'),
  ('Hot Drops', 'hot-drops'),
  ('Accessories', 'accessories'),
  ('Heavyweight', 'heavyweight'),
  ('Graphic Tees', 'graphic-tees'),
  ('Outerwear', 'outerwear'),
  ('Bottoms', 'bottoms')
ON CONFLICT (slug) DO NOTHING;
