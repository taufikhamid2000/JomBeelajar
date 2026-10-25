import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateApiChapter, deleteApiChapter } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { subjectId, name, form, orderIndex, description } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await updateApiChapter(
      id,
      { subjectId, name, form, orderIndex, description },
      token
    );
    return NextResponse.json(chapter);
  } catch (error) {
    logger.error('Error updating chapter:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
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

    await deleteApiChapter(id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting chapter:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('409')) {
      return NextResponse.json(
        { error: error.message.split(' — ')[1] || 'Cannot delete: topics still exist under this chapter' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
