import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getAuditComments, addAuditComment } from '@/lib/jombeelajar-api';
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

    const comments = await getAuditComments('quizzes', quizId, token);
    return NextResponse.json(comments);
  } catch (error) {
    logger.error('Error fetching quiz comments:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { commentText, commentType } = body;

    if (!commentText || !commentType) {
      return NextResponse.json(
        { error: 'commentText and commentType are required' },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const comment = await addAuditComment(
      'quizzes',
      quizId,
      { commentText, commentType },
      token
    );
    return NextResponse.json(comment);
  } catch (error) {
    logger.error('Error adding quiz comment:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
