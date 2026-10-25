import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyQuiz } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { verified, feedback } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'verified (boolean) is required' },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await verifyQuiz(quizId, { verified, feedback }, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error verifying quiz:', error);
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
