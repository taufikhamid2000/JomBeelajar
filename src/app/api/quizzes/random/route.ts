import { logger } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
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
  try {
    const { data, error } = await supabase.rpc('get_random_quiz');

    if (error) {
      logger.error('Error executing get_random_quiz:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || !data[0]) {
      return NextResponse.json(
        { error: 'No quizzes found in database' },
        { status: 404 }
      );
    }

    const quiz = data[0];
    return NextResponse.json({
      subject_slug: quiz.subject_slug,
      topic_id: quiz.topic_id,
      quiz_id: quiz.quiz_id,
    });
  } catch (err) {
    logger.error('Error fetching random quiz:', err);
    return NextResponse.json(
      { error: 'Failed to fetch random quiz' },
      { status: 500 }
    );
  }
}
