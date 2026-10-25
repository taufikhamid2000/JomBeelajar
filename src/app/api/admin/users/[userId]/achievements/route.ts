import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getUserAchievements,
  awardAchievement,
  AwardAchievementPayload,
  JomBeelajarApiAchievement,
} from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

function mapAchievement(a: JomBeelajarApiAchievement, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    achievement_type: a.achievementType,
    title: a.title,
    description: a.description,
    icon: a.icon,
    earned_at: a.earnedAt,
    progress: a.progress ?? undefined,
    max_progress: a.maxProgress ?? undefined,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievements = await getUserAchievements(userId, token);
    return NextResponse.json(achievements.map((a) => mapAchievement(a, userId)));
  } catch (error) {
    logger.error('Error fetching user achievements (admin):', error);
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
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const {
      achievementId,
      achievementType,
      title,
      description,
      icon,
      progress,
      maxProgress,
    } = body;

    let payload: AwardAchievementPayload;
    if (achievementId) {
      payload = { achievementId, progress, maxProgress };
    } else {
      if (!title) {
        return NextResponse.json(
          { error: 'title is required for a freeform award' },
          { status: 400 }
        );
      }
      payload = {
        achievementType: achievementType || 'manual',
        title,
        description: description || '',
        icon: icon || '🏆',
        progress,
        maxProgress,
      };
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const achievement = await awardAchievement(userId, payload, token);
    return NextResponse.json(mapAchievement(achievement, userId));
  } catch (error) {
    logger.error('Error awarding achievement:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
