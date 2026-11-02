import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

/**
 * Reads the Supabase session from request cookies (server-side only) and
 * returns the access token to forward as a Bearer token to JomBeelajar API.
 *
 * AUTHORIZATION NOTE: this only proves the caller is authenticated. Role checks
 * (moderator/admin) are enforced by JomBeelajar-API: ContentController,
 * AuditController, AchievementCatalogController, AchievementsController use
 * [Authorize(Policy = "Moderator")], SchoolsController writes use
 * [Authorize(Policy = "Admin")], and quiz/question edits check owner-or-moderator
 * (roles are resolved from the DB in Auth/SupabaseAuth.cs). Routes that talk to
 * Supabase directly (admin/users, admin/make-admin, admin/quizzes/verify,
 * admin/migrations) must use requireAdmin() from '@/lib/requireAdmin'.
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabaseServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'edubridge' },
      // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
      cookieOptions: jomCookieOptions((await headers()).get('host')),
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  // Verify the JWT with Supabase Auth before trusting the cookie session.
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  return session?.access_token ?? null;
}
