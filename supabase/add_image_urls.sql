-- ============================================================
-- Run this in your Supabase SQL Editor
-- Adds image_urls TEXT[] column to the products table
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- Backfill: populate image_urls from existing image_url values
UPDATE public.products
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND image_urls = '{}';
