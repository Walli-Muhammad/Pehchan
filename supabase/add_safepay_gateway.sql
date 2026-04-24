-- Add 'safepay' to the payment_gateway enum
-- Run this in the Supabase SQL Editor BEFORE deploying Phase 15.2
ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'safepay';
