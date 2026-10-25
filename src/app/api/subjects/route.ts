import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSubjectsList } from '@/lib/jombeelajar-api';

const CACHE_DURATION = 300; // 5 minutes

export async function GET() {
  try {
    const subjects = await getSubjectsList();
    return NextResponse.json(
      subjects.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        category: s.category,
      })),
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error fetching subjects list:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
