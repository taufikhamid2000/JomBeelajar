import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from '@/lib/logger';
import { getMyProgressSummary } from '@/lib/myquiza';

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

    const { data: { session } } = await supabaseServer.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await getMyProgressSummary(session.access_token);

    return NextResponse.json(progress, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Service is waking up' }, { status: 503 });
    }
    logger.error('Error fetching progress summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
