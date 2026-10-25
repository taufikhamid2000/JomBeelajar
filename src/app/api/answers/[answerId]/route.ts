import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateAnswer, deleteAnswer } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ answerId: string }> }
) {
  try {
    const { answerId } = await params;
    const body = await request.json();
    const { text, isCorrect, orderIndex } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateAnswer(
      answerId,
      { text, isCorrect, orderIndex },
      token
    );
    return NextResponse.json(result ?? { success: true });
  } catch (error) {
    logger.error('Error updating answer:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ answerId: string }> }
) {
  try {
    const { answerId } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteAnswer(answerId, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting answer:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
