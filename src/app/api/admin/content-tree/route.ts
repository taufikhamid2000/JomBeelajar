import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getContentTree } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET() {
  try {
    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tree = await getContentTree(token);
    return NextResponse.json(tree);
  } catch (error) {
    logger.error('Error fetching content tree:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
