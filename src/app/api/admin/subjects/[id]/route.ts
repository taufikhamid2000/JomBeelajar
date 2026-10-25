import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateApiSubject, deleteApiSubject } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, icon, orderIndex, category, categoryPriority } =
      body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subject = await updateApiSubject(
      id,
      { name, slug, description, icon, orderIndex, category, categoryPriority },
      token
    );
    return NextResponse.json(subject);
  } catch (error) {
    logger.error('Error updating subject:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('404')) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
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

    await deleteApiSubject(id, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting subject:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('409')) {
      return NextResponse.json(
        { error: error.message.split(' — ')[1] || 'Cannot delete: chapters still exist under this subject' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
