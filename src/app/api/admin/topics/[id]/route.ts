import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateApiTopic, deleteApiTopic } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      chapterId,
      name,
      description,
      difficultyLevel,
      timeEstimateMinutes,
      orderIndex,
    } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topic = await updateApiTopic(
      id,
      { chapterId, name, description, difficultyLevel, timeEstimateMinutes, orderIndex },
      token
    );
    return NextResponse.json(topic);
  } catch (error) {
    logger.error('Error updating topic:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteApiTopic(id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting topic:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('409')) {
      return NextResponse.json(
        { error: error.message.split(' — ')[1] || 'Cannot delete: quizzes still exist under this topic' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
