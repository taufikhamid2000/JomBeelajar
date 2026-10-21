import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from '@/lib/logger';
import { getLeaderboard } from '@/lib/myquiza';

const CACHE_DURATION = {
  daily: 60,
  weekly: 300,
  allTime: 900,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeFrame =
      (searchParams.get('timeFrame') as 'daily' | 'weekly' | 'allTime') ||
      'allTime';

    // Optional auth — used only to compute currentUserRank
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

    const entries = await getLeaderboard(null, {
      period: timeFrame === 'weekly' ? 'weekly' : undefined,
      limit: 100,
    });

    // Map MyQuiza camelCase → User shape expected by the frontend
    const data = entries.map((entry) => ({
      id: entry.userId,
      email: '',
      display_name: entry.displayName,
      avatar_url: entry.avatarUrl,
      xp: entry.xp,
      level: entry.level,
      weeklyXp: entry.weeklyXp,
    }));

    // Compute rank for authenticated user
    let currentUserRank: number | null = null;
    if (session) {
      const idx = data.findIndex((u) => u.id === session.user.id);
      currentUserRank = idx !== -1 ? idx + 1 : null;
    }

    return NextResponse.json(
      { data, currentUserRank },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION[timeFrame]}, stale-while-revalidate=${CACHE_DURATION[timeFrame] * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
