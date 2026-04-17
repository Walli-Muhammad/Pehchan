-- =============================================
-- Migration: Make product_id nullable in order_items
-- Run this in the Supabase SQL Editor
-- =============================================
-- 
-- WHY: Custom POD items from the Design Studio are not stored in the
-- products table (they're user-generated designs). The original schema
-- defined product_id as NOT NULL + FK, which prevents inserting POD orders.
-- This migration:
--   1. Drops the NOT NULL constraint (makes product_id optional)
--   2. Keeps the FK so valid product_id values still reference products
--   3. Keeps variant_id as TEXT (already nullable)
-- =============================================

ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name IN ('product_id', 'variant_id');
