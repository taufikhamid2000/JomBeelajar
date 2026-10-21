import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { log, logger } from '@/lib/logger';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { clearLegacyHostCookies } from '@/lib/supabase/legacy-cookies';

export async function middleware(request: NextRequest) {
  // Skip noise from the auth API itself and Next static files
  if (
    /^\/(?:auth|_next|favicon\.ico|\.well-known)/.test(request.nextUrl.pathname)
  ) {
    const passthrough = NextResponse.next();
    // Jom ID: expire pre-Jom-ID host-only sb-* cookies (once per browser).
    clearLegacyHostCookies(request, passthrough);
    return passthrough;
  }
  // Jom ID: cookie attributes for the shared *.taufikhamid.com session.
  const cookieOptions = jomCookieOptions(request.headers.get('host'));

  // Create base response with strong cache control
  const nextResponse = () =>
    NextResponse.next({
      request,
      headers: new Headers({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      }),
    });
  let response = nextResponse();

  // Create a Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'edubridge' },
      // Jom ID: share the session cookie across *.taufikhamid.com.
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Forward Supabase's own options (Domain/Path/SameSite/Secure from
        // cookieOptions, plus maxAge) untouched. The old adapter forced
        // httpOnly, which hid the session from the browser client (it reads
        // document.cookie), and dropped the options on removal, so a
        // Domain=.taufikhamid.com cookie could never be deleted.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
      auth: {
        autoRefreshToken: true, // Re-enable for proper session management
        persistSession: true,
        detectSessionInUrl: false, // Keep disabled to prevent URL-based loops
      },
    }
  );
  try {
    // Get the session using server component helper
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession(); // Log only on explicit demand
    log('Auth state:', {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionError: sessionError?.message,
    }); // Check if it's a protected route
    // const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
    // const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

    // If there's a session error, clear cookies and redirect to auth
    if (sessionError) {
      throw sessionError; // This will be caught by our catch block
    }

    // Disable automatic redirects to prevent loops
    // if (isDashboardPage && !session) {
    //   // If accessing dashboard without auth, redirect to login
    //   const redirectUrl = new URL('/auth', request.url);
    //   redirectUrl.searchParams.set('returnUrl', request.nextUrl.pathname);
    //   return NextResponse.redirect(redirectUrl);
    // }

    // if (isAuthPage && session) {
    //   // If accessing auth page while logged in, redirect to dashboard
    //   // Check if there's a return URL to redirect back to
    //   const returnUrl = request.nextUrl.searchParams.get('returnUrl');
    //   const redirectUrl = new URL(returnUrl || '/dashboard', request.url);
    //   return NextResponse.redirect(redirectUrl);
    // }

    // Jom ID: MUST stay the very last cookie write on the response. It
    // appends raw Set-Cookie headers, and any later response.cookies.set/
    // delete rewrites the Set-Cookie list and would drop them.
    clearLegacyHostCookies(request, response);
    return response;
  } catch (error) {
    // Log the error and clear all auth-related cookies
    logger.error('Middleware authentication error:', error);

    // Clear all Supabase auth cookies (legacy pre-@supabase/ssr names; the
    // current sb-<ref>-auth-token cookies are cleared by Supabase itself via
    // setAll when the session is unrecoverable). Same Domain/Path as the
    // Jom ID cookie so the deletion actually matches.
    const { domain, path, sameSite, secure } = cookieOptions;
    const cookiesToClear = [
      'sb-access-token',
      'sb-refresh-token',
      'sb-auth-token',
    ];
    cookiesToClear.forEach((name) => {
      response.cookies.set({
        name,
        value: '',
        maxAge: 0,
        domain,
        path,
        sameSite,
        secure,
      });
    });

    // On protected routes, redirect to auth and ensure the redirect is not cached
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
    if (isDashboardPage) {
      const redirectUrl = new URL('/auth', request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);

      // Copy every cookie written so far (Supabase's own setAll writes plus
      // the cleared ones above) — a fresh redirect would otherwise drop them.
      response.cookies
        .getAll()
        .forEach((cookie) => redirectResponse.cookies.set(cookie));

      // Add cache control headers to prevent caching
      redirectResponse.headers.set('Cache-Control', 'no-store, max-age=0');
      // Jom ID: last cookie write (see above).
      clearLegacyHostCookies(request, redirectResponse);
      return redirectResponse;
    }

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    // Jom ID: last cookie write (see above).
    clearLegacyHostCookies(request, response);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match only dashboard and protected routes, exclude:
     * - auth routes (prevent loops)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - .well-known routes (Chrome DevTools and other well-known endpoints)
     * - api routes
     */
    '/((?!auth|_next|favicon.ico|\\.well-known|api).*)',
  ],
};
