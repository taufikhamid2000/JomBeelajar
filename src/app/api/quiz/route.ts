import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { createQuiz } from '@/lib/jombeelajar-api';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { topicId, name, timeLimit, difficulty, isPublic } = body;

    if (!topicId || !name) {
      return NextResponse.json(
        { error: 'topicId and name are required' },
        { status: 400 }
      );
    }

    const result = await createQuiz(
      { topicId, name, timeLimit, difficulty, isPublic },
      session.access_token
    );

    logger.log('Quiz created via JomBeelajar API:', result.id);
    return NextResponse.json({ quizId: result.id });
  } catch (error) {
    logger.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
