import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';
import { logger } from '@/lib/logger';
import { checkAnswer } from '@/lib/jombeelajar-api';

// Per-question feedback. Guests may play, so a missing session is fine —
// the JomBeelajar API endpoint is anonymous; we forward the token only if present.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const questionId: unknown = body?.questionId;
    const selected: unknown = body?.selectedAnswerIds;

    if (
      !quizId ||
      typeof questionId !== 'string' ||
      !Array.isArray(selected) ||
      !selected.every((id) => typeof id === 'string')
    ) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        db: { schema: 'edubridge' },
        cookieOptions: jomCookieOptions((await headers()).get('host')),
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      }
    );
    const { data: { session } } = await supabaseServer.auth.getSession();

    const result = await checkAnswer(
      quizId,
      questionId,
      selected as string[],
      session?.access_token ?? null
    );
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && /JomBeelajar API 404/.test(error.message)) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    logger.error('Error checking answer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
