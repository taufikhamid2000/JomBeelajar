import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getQuizVerificationLog } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const log = await getQuizVerificationLog(quizId, token);
    return NextResponse.json(log);
  } catch (error) {
    logger.error('Error fetching verification log:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
