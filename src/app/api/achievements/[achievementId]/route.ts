import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateCatalogAchievement, deleteCatalogAchievement } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ achievementId: string }> }
) {
  try {
    const { achievementId } = await params;
    const body = await request.json();
    const { achievementType, title, description, icon, maxProgress } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await updateCatalogAchievement(
      achievementId,
      { achievementType, title, description, icon, maxProgress },
      token
    );
    return NextResponse.json(entry);
  } catch (error) {
    logger.error('Error updating catalog achievement:', error);
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
  { params }: { params: Promise<{ achievementId: string }> }
) {
  try {
    const { achievementId } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteCatalogAchievement(achievementId, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting catalog achievement:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
