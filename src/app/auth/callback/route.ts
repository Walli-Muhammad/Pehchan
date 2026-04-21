import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * GET /auth/callback
 *
 * Supabase redirects here after a successful OAuth (e.g., Google Sign-In).
 * We exchange the one-time `code` for a persistent session and then
 * redirect the user to the admin dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Optional: where to send the user after login (defaults to /admin)
  const next = searchParams.get('next') ?? '/admin';

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore: called from Server Component — middleware will handle.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('[Auth Callback] exchangeCodeForSession error:', error.message);
  }

  // Fallback: something went wrong — redirect to login with an error flag
  return NextResponse.redirect(`${origin}/admin/login?error=auth_callback_failed`);
}
