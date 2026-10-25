import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createQuestion } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { text, type, orderIndex, answers } = body;

    if (!text || !type || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'text, type, and answers are required' },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await createQuestion(
      quizId,
      { text, type, orderIndex: orderIndex ?? 0, answers },
      token
    );
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error creating question:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
