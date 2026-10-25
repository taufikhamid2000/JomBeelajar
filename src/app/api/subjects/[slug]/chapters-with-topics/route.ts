import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getSubjectsList,
  getSubjectChapters,
  getChapterTopics,
} from '@/lib/jombeelajar-api';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes

interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty_level: number;
  time_estimate_minutes: number;
  order_index: number;
}

interface ChapterWithTopics {
  id: string;
  name: string;
  form: number;
  order_index: number;
  topics: Topic[];
}

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
    const sortedChapters = [...chapters].sort(
      (a, b) => a.form - b.form || a.orderIndex - b.orderIndex
    );

    // One topics call per chapter — bounded by a single subject's chapter
    // count (typically under 20), unlike a full admin-wide listing.
    const transformedChapters: ChapterWithTopics[] = await Promise.all(
      sortedChapters.map(async (chapter) => {
        const topics = await getChapterTopics(chapter.id);
        return {
          id: chapter.id,
          name: chapter.name,
          form: chapter.form,
          order_index: chapter.orderIndex,
          topics: [...topics]
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              difficulty_level: t.difficultyLevel,
              time_estimate_minutes: t.timeEstimateMinutes,
              order_index: t.orderIndex,
            })),
        };
      })
    );

    return NextResponse.json(
      {
        subject: { id: subject.id, name: subject.name },
        chapters: transformedChapters,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error in chapters-with-topics API:', error);
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
