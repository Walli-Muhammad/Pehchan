-- ============================================================
-- Run this in your Supabase SQL Editor
-- Sets up the admin_users table for role-based access control
-- ============================================================

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  email       TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 3. Only authenticated users can read their own row
--    (middleware uses the anon key, so we need a policy for authenticated reads)
CREATE POLICY "Admin can read own record"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- 4. Seed your admin email(s) here
INSERT INTO public.admin_users (email) VALUES
  ('walim204@gmail.com')
ON CONFLICT DO NOTHING;
