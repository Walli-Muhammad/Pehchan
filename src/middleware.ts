import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// ─── RBAC Allowlist ──────────────────────────────────────────────────────────
// Only users whose email is in this list can access /admin routes.
// Add additional admin emails here as needed.
const ADMIN_EMAILS: string[] = ['walim204@gmail.com'];
// ─────────────────────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  // Mutable response so @supabase/ssr can write refreshed auth cookies.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — DO NOT remove. Keeps auth tokens valid.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isLoginPage  = pathname === '/admin/login';

  const userEmail    = user?.email ?? null;
  const isAuthorized = userEmail !== null && ADMIN_EMAILS.includes(userEmail);

  if (isAdminRoute) {
    if (!user) {
      // Not logged in → send to login page
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }

    if (!isAuthorized) {
      // Logged in but NOT in the allowlist → kick to storefront
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      return NextResponse.redirect(homeUrl);
    }
  }

  if (isLoginPage && user) {
    if (isAuthorized) {
      // Already authorized → skip login and go straight to dashboard
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/admin';
      return NextResponse.redirect(dashboardUrl);
    } else {
      // Logged in but unauthorized → let them see the login page
      // (they will be kicked once they try to navigate to /admin)
      return supabaseResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/admin/:path*'],
};
