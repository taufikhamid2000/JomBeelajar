import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createAnswer } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await params;
    const body = await request.json();
    const { text, isCorrect, orderIndex } = body;

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await createAnswer(
      questionId,
      { text, isCorrect: !!isCorrect, orderIndex: orderIndex ?? 0 },
      token
    );
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error creating answer:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
