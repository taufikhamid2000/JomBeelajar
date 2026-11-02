import 'server-only';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

export type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 | 500; error: string };

/**
 * Server-side admin gate for route handlers. Verifies the session cookie with
 * Supabase Auth (getUser, not getSession) and then looks up the role with the
 * service-role client. Fails closed: any error means "not authorised".
 */
export async function requireAdmin(): Promise<AdminCheck> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'edubridge' },
        cookieOptions: jomCookieOptions((await headers()).get('host')),
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, status: 401, error: 'Unauthorized' };

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) {
      logger.error('Admin role lookup failed:', error);
      return { ok: false, status: 403, error: 'Forbidden' };
    }
    if (data?.role !== 'admin') {
      return { ok: false, status: 403, error: 'Forbidden' };
    }
    return { ok: true, userId: user.id };
  } catch (error) {
    logger.error('Admin check failed:', error);
    return { ok: false, status: 403, error: 'Forbidden' };
  }
}
