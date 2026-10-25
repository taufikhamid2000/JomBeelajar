import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { createApiSubject } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, icon, orderIndex, category, categoryPriority } =
      body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'name and slug are required' },
        { status: 400 }
      );
    }

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subject = await createApiSubject(
      { name, slug, description, icon, orderIndex, category, categoryPriority },
      token
    );
    return NextResponse.json(subject);
  } catch (error) {
    logger.error('Error creating subject:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
