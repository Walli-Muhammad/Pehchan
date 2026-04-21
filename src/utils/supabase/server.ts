import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses cookies() for session persistence (App Router pattern).
 *
 * ⚠️  Uses the ANON key — RLS policies still apply.
 *     For service-role (no RLS), import supabaseAdmin from @/lib/supabase-server.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll can be called from a Server Component — the cookie will
            // be set by middleware on the next request. Safe to ignore here.
          }
        },
      },
    }
  );
}
