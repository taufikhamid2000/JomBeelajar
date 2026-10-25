import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSubjectsList } from '@/lib/jombeelajar-api';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Subject slug is required' },
        { status: 400 }
      );
    }

    // No by-slug lookup on JomBeelajar API's side — fetch the list and match locally.
    const subjects = await getSubjectsList();
    const subject = subjects.find((s) => s.slug === slug);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: subject.id,
        name: subject.name,
        slug: subject.slug,
        description: subject.description,
        icon: subject.icon,
        category: subject.category,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error in subject API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
