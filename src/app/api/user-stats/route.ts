import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { WEEKLY_QUIZ_TARGET } from '@/config/app';
import { getMyStats, getMe, getMyAttempts } from '@/lib/myquiza';

// Cache duration in seconds
const CACHE_DURATION = 600; // 10 minutes

interface UserStatsResponse {
  weeklyProgress: {
    quizzesCompleted: number;
    quizzesTotal: number;
    averageScore: number;
  };
  achievements: Array<{
    title: string;
    description: string;
    bgColor: string;
    earned: boolean;
    earnedDate?: string;
  }>;
  streakInfo: {
    currentStreak: number;
    longestStreak: number;
    streakType: 'days' | 'weeks';
  };
  recentActivity: Array<{
    type: 'quiz_completed' | 'achievement_earned' | 'level_up';
    title: string;
    description: string;
    date: string;
    score?: number;
  }>;
}

export async function GET() {
  try {
    // Get authenticated user
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

    const {
      data: { session },
      error: sessionError,
    } = await supabaseServer.auth.getSession();
    if (sessionError) {
      logger.error('Session error in user stats API:', sessionError);
      // Continue without authentication for guest user
    }

    if (!session) {
      // Return guest user stats
      return NextResponse.json(
        {
          weeklyProgress: {
            quizzesCompleted: 0,
            quizzesTotal: 0,
            averageScore: 0,
          },
          achievements: [],
          streakInfo: {
            currentStreak: 0,
            longestStreak: 0,
            streakType: 'days' as const,
          },
          recentActivity: [],
          isGuest: true,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      );
    }

    // Fetch user statistics in parallel
    const [userStatsData, meData, recentAttempts, { data: userProfile, error: userProfileError }] =
      await Promise.all([
        // mv_user_dashboard_stats is now served by MyQuiza
        getMyStats(session.access_token).catch((err) => {
          logger.error('Error fetching user stats from MyQuiza:', err);
          return null;
        }),

        // xp/level are authoritative on MyQuiza's side (submitAttempt writes
        // them directly to user_profiles)
        getMe(session.access_token).catch((err) => {
          logger.error('Error fetching /me from MyQuiza:', err);
          return null;
        }),

        // Recent quiz attempts (topic/subject added to this response after
        // we flagged the gap; subject is null on pre-fix historical rows)
        getMyAttempts(session.access_token).catch((err) => {
          logger.error('Error fetching attempts from MyQuiza:', err);
          return [] as Awaited<ReturnType<typeof getMyAttempts>>;
        }),

        // streak stays on Supabase — MyQuiza doesn't touch it
        supabase
          .from('user_profiles')
          .select('streak')
          .eq('id', session.user.id)
          .single(),
      ]);

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', userProfileError);
      return NextResponse.json(
        { error: 'Failed to load user profile' },
        { status: 500 }
      );
    }

    // Calculate weekly progress
    const weeklyQuizzes = userStatsData?.weeklyQuizzes || 0;
    const weeklyAverage = userStatsData?.weeklyAverageScore || 0;
    const weeklyTarget = WEEKLY_QUIZ_TARGET;

    // Generate achievements based on user data
    const totalQuizzes = userStatsData?.completedQuizzes || 0;
    const averageScore = userStatsData?.averageScore || 0;
    const currentStreak = userProfile?.streak || 0;
    const currentLevel = meData?.level || 1;

    const achievements = [
      {
        title: 'Quiz Master',
        description: 'Completed 10 quizzes in a week',
        bgColor: 'bg-blue-100',
        earned: weeklyQuizzes >= 10,
        earnedDate: weeklyQuizzes >= 10 ? new Date().toISOString() : undefined,
      },
      {
        title: 'High Scorer',
        description: 'Scored above 90% in 5 quizzes',
        bgColor: 'bg-green-100',
        earned: averageScore >= 90 && totalQuizzes >= 5,
        earnedDate:
          averageScore >= 90 && totalQuizzes >= 5
            ? new Date().toISOString()
            : undefined,
      },
      {
        title: 'Consistent Learner',
        description: 'Maintained a 7-day streak',
        bgColor: 'bg-yellow-100',
        earned: currentStreak >= 7,
        earnedDate: currentStreak >= 7 ? new Date().toISOString() : undefined,
      },
      {
        title: 'Knowledge Seeker',
        description: 'Completed 50 quizzes',
        bgColor: 'bg-purple-100',
        earned: totalQuizzes >= 50,
        earnedDate: totalQuizzes >= 50 ? new Date().toISOString() : undefined,
      },
      {
        title: 'Level Up Champion',
        description: 'Reached level 5',
        bgColor: 'bg-indigo-100',
        earned: currentLevel >= 5,
        earnedDate: currentLevel >= 5 ? new Date().toISOString() : undefined,
      },
    ]; // Generate recent activity from quiz attempts
    const recentActivity: Array<{
      type: 'quiz_completed' | 'achievement_earned' | 'level_up';
      title: string;
      description: string;
      date: string;
      score?: number;
    }> = [];

    // Add quiz completion activities
    const quizActivities = recentAttempts.slice(0, 5).map((attempt) => ({
      type: 'quiz_completed' as const,
      title: `Completed ${attempt.quizTitle || 'Quiz'}`,
      description: `${attempt.subject || 'Subject'} - ${attempt.topic || 'Topic'}`,
      date: attempt.createdAt,
      score: attempt.score,
    }));

    recentActivity.push(...quizActivities);

    // Add level up activities if applicable
    if (currentLevel > 1) {
      recentActivity.unshift({
        type: 'level_up' as const,
        title: `Level Up!`,
        description: `Reached level ${currentLevel}`,
        date: new Date().toISOString(), // This should come from actual level up date
      });
    }

    // Add achievement activities
    achievements
      .filter((achievement) => achievement.earned)
      .slice(0, 2)
      .forEach((achievement) => {
        recentActivity.unshift({
          type: 'achievement_earned' as const,
          title: `Achievement Earned: ${achievement.title}`,
          description: achievement.description,
          date: achievement.earnedDate || new Date().toISOString(),
        });
      });

    const response: UserStatsResponse = {
      weeklyProgress: {
        quizzesCompleted: weeklyQuizzes,
        quizzesTotal: weeklyTarget,
        averageScore: Math.round(weeklyAverage * 10) / 10,
      },
      achievements,
      streakInfo: {
        currentStreak,
        longestStreak: currentStreak, // This could be tracked separately
        streakType: 'days',
      },
      recentActivity: recentActivity.slice(0, 10),
    };

    // Return response with cache headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        Vary: 'Cookie, Authorization',
      },
    });
  } catch (error) {
    logger.error('Error in user stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
