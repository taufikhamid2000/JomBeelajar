import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { getMyStats, getMe, getSubjectsList } from '@/lib/jombeelajar-api';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category?: string;
  category_priority?: number;
  order_index?: number;
}

interface DashboardUser {
  email: string;
  display_name?: string;
  streak: number;
  xp: number;
  level: number;
  lastQuizDate: string;
}

interface DashboardResponse {
  user: DashboardUser;
  subjects: Subject[];
  categories: string[];
  stats: {
    totalSubjects: number;
    userRank?: number;
    completedQuizzes?: number;
  };
}

export async function GET() {
  try {
    logger.log('Server: Dashboard API route called');
    logger.info('Dashboard API route called');

    // Get authenticated user (optional for dashboard)
    const cookieStore = await cookies();

    // Debug - Log all available cookies
    const allCookies = cookieStore.getAll();
    logger.log(
      'All available cookies:',
      allCookies.map((c) => c.name)
    );

    // Check for specific auth cookies
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    logger.log('Auth tokens present:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    });

    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'edubridge' },
        // Jom ID: shared *.taufikhamid.com session cookie (read-only here).
        cookieOptions: jomCookieOptions((await headers()).get('host')),
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            logger.log(
              `Server: Cookie ${name}:`,
              cookie ? 'exists' : 'missing'
            );
            return cookie?.value;
          },
          set: () => {},
          remove: () => {},
        },
      }
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabaseServer.auth.getSession();

    if (sessionError) {
      logger.error('Session error in dashboard API:', sessionError);
      // Don't return error, continue without authentication
    } // Continue without requiring authentication
    const isAuthenticated = !!session?.user?.id;
    logger.log('Dashboard API - Authentication status:', {
      isAuthenticated,
      userId: session?.user?.id,
      email: session?.user?.email,
    });

    // Fetch data in parallel for optimal performance
    const [
      subjectsList,
      { data: userData, error: userError },
      userStatsData,
      meData,
    ] = await Promise.all([
      // Subjects now come from JomBeelajar API (categoryPriority shipped on their
      // /api/v1/subjects response) rather than a direct Supabase read.
      getSubjectsList().catch((err) => {
        logger.error('Error fetching subjects from JomBeelajar API:', err);
        return null;
      }),

      // display_name/streak stay on Supabase — JomBeelajar API doesn't touch streak
      isAuthenticated
        ? supabase
            .from('user_profiles')
            .select('display_name, streak')
            .eq('id', session!.user.id)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // Fetch user statistics only if authenticated (mv_user_dashboard_stats
      // is now served by JomBeelajar API)
      isAuthenticated
        ? getMyStats(session!.access_token).catch((err) => {
            logger.error('Error fetching user stats from JomBeelajar API:', err);
            return null;
          })
        : Promise.resolve(null),

      // xp/level/lastQuizDate are authoritative on JomBeelajar API's side
      // (submitAttempt writes them directly to user_profiles)
      isAuthenticated
        ? getMe(session!.access_token).catch((err) => {
            logger.error('Error fetching /me from JomBeelajar API:', err);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // Handle fetch errors
    if (!subjectsList) {
      return NextResponse.json(
        { error: 'Failed to load subjects' },
        { status: 500 }
      );
    }

    // PGRST116 is "no rows returned" - expected for new users
    if (userError && userError.code !== 'PGRST116') {
      logger.error('Error fetching user profile in dashboard API:', userError);
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    // Process subjects data server-side (JomBeelajar API's response is already
    // sorted by categoryPriority/orderIndex/name; map camelCase -> the
    // snake_case shape the rest of the dashboard response uses)
    const processedSubjects = subjectsList.map((subject) => ({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      description: subject.description,
      icon: subject.icon,
      category: subject.category || 'Uncategorized',
      category_priority: subject.categoryPriority ?? 999,
      order_index: subject.orderIndex ?? 999,
    }));

    // Extract unique categories server-side
    const categories = [
      'all',
      ...new Set(processedSubjects.map((s) => s.category)),
    ]; // Construct user data
    const dashboardUser: DashboardUser = isAuthenticated
      ? {
          email: session!.user.email || '',
          display_name: userData?.display_name || undefined,
          streak: userData?.streak || 0,
          xp: meData?.xp || 0,
          level: meData?.level || 1,
          lastQuizDate:
            meData?.lastQuizDate || new Date().toISOString().split('T')[0],
        }
      : {
          email: '',
          display_name: 'Guest User',
          streak: 0,
          xp: 0,
          level: 1,
          lastQuizDate: new Date().toISOString().split('T')[0],
        };

    // Prepare response
    const response: DashboardResponse = {
      user: dashboardUser,
      subjects: processedSubjects,
      categories,
      stats: {
        totalSubjects: processedSubjects.length,
        completedQuizzes: userStatsData?.completedQuizzes || 0,
      },
    };

    // Return response with cache headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        Vary: 'Cookie, Authorization',
      },
    });
  } catch (error) {
    logger.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
