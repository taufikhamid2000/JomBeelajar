import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { resolveAuditComment } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string; commentId: string }> }
) {
  try {
    const { quizId, commentId } = await params;
    const body = await request.json();
    const { isResolved } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await resolveAuditComment(
      'quizzes',
      quizId,
      commentId,
      !!isResolved,
      token
    );
    return NextResponse.json(comment);
  } catch (error) {
    logger.error('Error resolving quiz comment:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
