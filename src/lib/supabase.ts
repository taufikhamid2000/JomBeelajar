// NOTE: The Supabase clients below are intentionally typed as `<any>` (untyped
// schema). JomBeelajar is migrating off direct DB access onto the MyQuiza API, so
// this data layer is slated for removal — we deliberately opt it out of the
// strict schema typing that newer @supabase/supabase-js infers (it otherwise
// resolves every query to `never`). This restores the pre-upgrade behavior in
// one place instead of hand-typing dozens of soon-to-be-deleted queries.
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createClient,
  isAuthRetryableFetchError,
  SupabaseClient,
} from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase credentials!');
  throw new Error('Missing Supabase credentials');
}

/**
 * Main browser/client Supabase client.
 *
 * Jom ID: in the browser this is an @supabase/ssr cookie-based client, so the
 * session lives in the `sb-<ref>-auth-token*` cookies, written on the shared
 * `.taufikhamid.com` domain in production (see lib/supabase/cookie-options.ts).
 * That is what lets a sign-in at https://akaun.taufikhamid.com (or any other
 * Jom app) carry over here, and lets the API routes / middleware see the same
 * session. It previously used supabase-js's default localStorage, which no
 * other app (and no server route) could read.
 *
 * This module is also imported by server route handlers for anonymous data
 * queries. There is no browser cookie jar there, so on the server it stays a
 * plain, non-persisting supabase-js client.
 */
const clientGlobal = {
  headers: { 'X-Client-Info': 'edubridge-webapp' },
};

export const supabase: SupabaseClient<any, 'edubridge'> =
  typeof window === 'undefined'
    ? createClient<any, 'edubridge'>(supabaseUrl, supabaseAnonKey, {
        db: { schema: 'edubridge' },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: clientGlobal,
      })
    : createBrowserClient<any, 'edubridge'>(supabaseUrl, supabaseAnonKey, {
        // Jom ID: share the session cookie across *.taufikhamid.com.
        cookieOptions: jomCookieOptions(window.location.hostname),
        db: { schema: 'edubridge' },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true, // needed for OAuth (PKCE) redirects
          flowType: 'pkce',
          debug: false,
        },
        global: clientGlobal,
      });

/**
 * Service-role Supabase client for server-side admin routes (bypasses RLS).
 *
 * Instantiated lazily via a Proxy so:
 *  - the service-role key is never bundled into / evaluated on the client,
 *  - importing this module (build-time page-data collection, browser) never
 *    throws just because SUPABASE_SERVICE_ROLE_KEY is absent — the client is
 *    only created on first property access inside a server handler.
 *
 * NEVER import `supabaseAdmin` into client components.
 */
let _supabaseAdminClient: SupabaseClient<any, any, any> | null = null;

function getSupabaseAdminClient(): SupabaseClient<any, any, any> {
  if (_supabaseAdminClient) return _supabaseAdminClient;

  const adminUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin credentials (SUPABASE_SERVICE_ROLE_KEY)'
    );
  }

  _supabaseAdminClient = createClient<any, 'edubridge'>(adminUrl, serviceRoleKey, {
    db: { schema: 'edubridge' },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'edubridge-webapp-admin',
      },
    },
  });

  return _supabaseAdminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient<any, any, any>, {
  get(_target, prop) {
    const client = getSupabaseAdminClient();
    const value = client[prop as keyof typeof client];
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

/**
 * Recover from a bad auth session (e.g. "Invalid Refresh Token").
 *
 * Delegates to supabase-js: getSession() auto-refreshes when needed. If that
 * errors (or throws), we sign out this browser's session to clear the broken
 * session so the user can re-authenticate cleanly. Returns whether a valid
 * session remains.
 *
 * Jom ID: the session cookie is shared by every *.taufikhamid.com app, so a
 * sign-out here signs the user out of all of them. Hence: never over a
 * transient network failure (the session itself is still fine), and scope
 * 'local' (this browser) rather than 'global' (every device), since this is
 * an automatic recovery path, not something the user asked for.
 */
export async function recoverSession(): Promise<boolean> {
  try {
    logger.info('Attempting to recover auth session...');

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      logger.error('Error recovering session:', error);
      if (isAuthRetryableFetchError(error)) return false;
      await supabase.auth.signOut({ scope: 'local' });
      return false;
    }

    if (session) {
      logger.info('Session successfully recovered');
      return true;
    }

    logger.info('No session could be recovered');
    return false;
  } catch (error) {
    logger.error('Critical error during session recovery:', error);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (signOutError) {
      logger.error('Error during emergency signout:', signOutError);
    }
    return false;
  }
}
