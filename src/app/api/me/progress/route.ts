import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from '@/lib/logger';
import { getMyProgress } from '@/lib/jombeelajar-api';

export async function GET() {
  try {
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

    // Verify the JWT with Supabase Auth first; the session is only used for the token.
    const { data: { user } } = await supabaseServer.auth.getUser();
    const { data: { session } } = user
      ? await supabaseServer.auth.getSession()
      : { data: { session: null } };
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getMyProgress(session.access_token);

    return NextResponse.json(progress, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    logger.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
