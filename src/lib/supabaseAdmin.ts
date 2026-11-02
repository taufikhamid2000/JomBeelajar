import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
