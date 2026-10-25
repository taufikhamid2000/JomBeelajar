import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSubjectsList, getSubjectChapters } from '@/lib/jombeelajar-api';

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

    // No by-slug lookup on JomBeelajar API's side — resolve slug -> id first.
    const subjects = await getSubjectsList();
    const subject = subjects.find((s) => s.slug === slug);

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const chapters = await getSubjectChapters(subject.id);
    const sorted = [...chapters].sort(
      (a, b) => a.form - b.form || a.orderIndex - b.orderIndex
    );

    return NextResponse.json(
      sorted.map((c) => ({
        id: c.id,
        name: c.name,
        form: c.form,
        order_index: c.orderIndex,
      })),
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error in chapters API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
