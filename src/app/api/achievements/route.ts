import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getAchievementCatalog, createCatalogAchievement } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET() {
  try {
    const catalog = await getAchievementCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    logger.error('Error fetching achievement catalog:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { achievementType, title, description, icon, maxProgress } = body;

    if (!achievementType || !title || !description || !icon) {
      return NextResponse.json(
        { error: 'achievementType, title, description, and icon are required' },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entry = await createCatalogAchievement(
      { achievementType, title, description, icon, maxProgress },
      token
    );
    return NextResponse.json(entry);
  } catch (error) {
    logger.error('Error creating catalog achievement:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
