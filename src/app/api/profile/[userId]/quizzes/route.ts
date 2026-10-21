import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Handle guest user case
    if (userId === 'guest') {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // If userId is 'me', get current user's created quizzes
    if (userId === 'me') {
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
      } = await supabaseServer.auth.getSession();

      if (!session?.user?.id) {
        return NextResponse.json([], {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        });
      }

      const targetUserId = session.user.id;

      // Fetch created quizzes for authenticated user
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select(
          `
          *,
          topics!inner(
            id,
            name,
            chapters!inner(
              id,
              subjects!inner(
                slug
              )
            )
          )
        `
        )
        .eq('created_by', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching user created quizzes:', error);
        return NextResponse.json(
          { error: 'Failed to fetch created quizzes' },
          { status: 500 }
        );
      }

      // Transform the quiz data to include subject_slug for proper URL generation
      interface QuizWithRelations {
        id: string;
        name: string;
        created_by: string;
        created_at: string;
        verified: boolean;
        topic_id: string;
        topics?: {
          id: string;
          name: string;
          chapters?: {
            id: string;
            subjects?: {
              slug: string;
            };
          };
        };
      }

      const transformedQuizzes = ((quizzes as QuizWithRelations[]) || []).map(
        (quiz) => ({
          ...quiz,
          subject_slug: quiz.topics?.chapters?.subjects?.slug,
          topic_title: quiz.topics?.name,
        })
      );

      return NextResponse.json(transformedQuizzes, {
        headers: {
          'Cache-Control': `private, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
          Vary: 'Cookie, Authorization',
        },
      });
    }

    // Fetch created quizzes for specific user (public)
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(
        `
        *,
        topics!inner(
          id,
          name,
          chapters!inner(
            id,
            subjects!inner(
              slug
            )
          )
        )
      `
      )
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching user created quizzes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch created quizzes' },
        { status: 500 }
      );
    }

    // Transform the quiz data to include subject_slug for proper URL generation
    interface QuizWithRelations {
      id: string;
      name: string;
      created_by: string;
      created_at: string;
      verified: boolean;
      topic_id: string;
      topics?: {
        id: string;
        name: string;
        chapters?: {
          id: string;
          subjects?: {
            slug: string;
          };
        };
      };
    }

    const transformedQuizzes = ((quizzes as QuizWithRelations[]) || []).map(
      (quiz) => ({
        ...quiz,
        subject_slug: quiz.topics?.chapters?.subjects?.slug,
        topic_title: quiz.topics?.name,
      })
    );

    return NextResponse.json(transformedQuizzes, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
      },
    });
  } catch (error) {
    logger.error('Error in created quizzes API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
