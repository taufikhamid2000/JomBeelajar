import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getTopicQuizzes,
  getTopicBreadcrumb,
  getSubjectChapters,
  getChapterTopics,
  getSubjectsList,
} from '@/lib/jombeelajar-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    logger.log(`Fetching topic data for topic ID: ${topicId}`);

    // Resolve topic -> chapter -> subject ancestry via JomBeelajar API's breadcrumb
    // endpoint, then pull full chapter/topic/subject detail from the
    // already-migrated list endpoints (breadcrumb itself is intentionally
    // thin — id/name pairs only).
    let breadcrumb;
    try {
      breadcrumb = await getTopicBreadcrumb(topicId);
    } catch (err) {
      logger.error('Error fetching topic breadcrumb:', err);
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    if (!breadcrumb.chapterId || !breadcrumb.subjectId) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    const [chapters, topics, subjects] = await Promise.all([
      getSubjectChapters(breadcrumb.subjectId),
      getChapterTopics(breadcrumb.chapterId),
      getSubjectsList(),
    ]);

    const chapter = chapters.find((c) => c.id === breadcrumb.chapterId) ?? null;
    const topicData = topics.find((t) => t.id === topicId) ?? null;
    const subject = subjects.find((s) => s.id === breadcrumb.subjectId) ?? null;

    if (!topicData) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Fetch verified quizzes from JomBeelajar API API (topic may not exist there yet)
    let processedQuizzes: {
      id: string;
      name: string;
      verified: boolean;
      topic_id: string;
      questionCount: number;
    }[] = [];
    try {
      const apiQuizzes = await getTopicQuizzes(topicId);
      processedQuizzes = apiQuizzes.map((quiz) => ({
        id: quiz.id,
        name: quiz.name,
        verified: quiz.verified,
        topic_id: quiz.topicId,
        questionCount: quiz.questionCount,
        difficulty: quiz.difficulty,
        isPublic: quiz.isPublic,
      }));
    } catch (err) {
      logger.warn(`JomBeelajar API returned no quizzes for topic ${topicId}:`, err);
    }

    const response = {
      topic: {
        id: topicData.id,
        name: topicData.name,
        description: topicData.description,
        difficulty_level: topicData.difficultyLevel,
        time_estimate_minutes: topicData.timeEstimateMinutes,
        order_index: topicData.orderIndex,
        chapter_id: topicData.chapterId,
        chapters: [], // Keep for compatibility
      },
      chapter: chapter
        ? {
            id: chapter.id,
            name: chapter.name,
            form: chapter.form,
            order_index: chapter.orderIndex,
          }
        : null,
      subject: subject
        ? {
            id: subject.id,
            name: subject.name,
            slug: subject.slug,
            description: subject.description,
            icon: subject.icon,
            category: subject.category,
            category_priority: subject.categoryPriority,
            order_index: subject.orderIndex,
          }
        : null,
      quizzes: processedQuizzes,
    };

    logger.log(
      `Successfully fetched topic data with ${processedQuizzes.length} quizzes`
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error in topic API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
