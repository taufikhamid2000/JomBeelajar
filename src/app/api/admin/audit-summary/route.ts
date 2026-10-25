import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getAuditSummary, getUnverifiedQuizzes } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [summary, unverifiedQuizzes] = await Promise.all([
      getAuditSummary(token),
      getUnverifiedQuizzes(token),
    ]);

    return NextResponse.json({ summary, unverifiedQuizzes });
  } catch (error) {
    logger.error('Error fetching audit summary:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
