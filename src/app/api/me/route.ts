import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { updateMe } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { displayName, avatarUrl } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateMe({ displayName, avatarUrl }, token);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error updating profile via JomBeelajar API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
