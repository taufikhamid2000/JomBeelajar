import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from '@/lib/logger';
import { submitAttempt } from '@/lib/jombeelajar-api';

interface SubmitQuizRequest {
  answers: { questionId: string; selectedAnswerIds: string[] }[];
  timeTaken?: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body: SubmitQuizRequest = await request.json();
    const { answers, timeTaken } = body;

    if (!quizId) {
      return NextResponse.json({ error: 'Missing quizId' }, { status: 400 });
    }

    // Get session token from cookies to forward to JomBeelajar API
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

    logger.log('Forwarding quiz attempt to JomBeelajar API:', { quizId });

    const result = await submitAttempt(
      quizId,
      { answers: answers ?? [], timeTaken },
      session.access_token
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error submitting quiz attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
