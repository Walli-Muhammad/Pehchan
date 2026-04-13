/**
 * Server-only Supabase client using the service_role key.
 *
 * ⚠️ SECURITY: This client bypasses ALL Row Level Security policies.
 * Import ONLY inside:
 *   - app/api/**\/route.ts
 *   - server actions (actions/*.ts)
 *   - NEVER in 'use client' components
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local (server-only).'
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    // Prevents the service client from trying to persist session to localStorage
    persistSession: false,
    autoRefreshToken: false,
  },
});
