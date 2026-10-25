import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getQuizDetail, updateQuiz } from '@/lib/jombeelajar-api';
import { getSessionToken } from '@/lib/serverSession';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;

    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }

    logger.log(`Fetching quiz data for quiz ID: ${quizId}`);

    // Quiz + questions come from JomBeelajar API (answer key never leaves the server)
    let quizData;
    try {
      quizData = await getQuizDetail(quizId);
    } catch (err) {
      // JomBeelajar API returns 404 for unknown ids
      if (err instanceof Error && err.message.includes('404')) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }
      throw err;
    }

    // Breadcrumb context — JomBeelajar API only carries topicId, so source the
    // topic/chapter/subject names from Supabase (content tree stays on Supabase).
    let topicTitle = 'Unknown Topic';
    let chapterTitle = 'Unknown Chapter';
    let subjectName = 'Unknown Subject';
    let form: number | undefined = undefined;

    if (quizData.topicId) {
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .select(
          `
          id,
          name,
          chapter:chapter_id (
            id,
            name,
            form,
            subject:subject_id (
              id,
              name
            )
          )
        `
        )
        .eq('id', quizData.topicId)
        .single();

      if (topicError) {
        logger.error('Error fetching topic breadcrumb:', topicError);
      } else if (topicData) {
        topicTitle = topicData.name || topicTitle;
        const chapter = Array.isArray(topicData.chapter)
          ? topicData.chapter[0]
          : topicData.chapter;
        if (chapter) {
          chapterTitle = chapter.name || chapterTitle;
          form = chapter.form;
          const subject = Array.isArray(chapter.subject)
            ? chapter.subject[0]
            : chapter.subject;
          if (subject) {
            subjectName = subject.name || subjectName;
          }
        }
      }
    }

    const topicContext = { topicTitle, chapterTitle, subjectName, form };

    // Map JomBeelajar API camelCase questions/options to the frontend shape.
    // No is_correct field — scoring is server-side on submit.
    const questions = quizData.questions.map((q) => ({
      id: q.id,
      quiz_id: quizData.id,
      text: q.text,
      type: q.type === 'checkbox' ? 'checkbox' : 'radio',
      order_index: q.orderIndex,
      created_at: '',
      updated_at: '',
      answers: q.options.map((o) => ({
        id: o.id,
        question_id: q.id,
        text: o.text,
        order_index: o.orderIndex,
        created_at: '',
        updated_at: '',
      })),
    }));

    const response = {
      quiz: {
        id: quizData.id,
        name: quizData.name,
        verified: quizData.verified,
        topic_id: quizData.topicId,
        timeLimit: quizData.timeLimit,
        difficulty: quizData.difficulty,
        isPublic: quizData.isPublic,
      },
      questions,
      topicContext,
    };

    logger.log(
      `Quiz API: prepared ${questions.length} questions for quiz ${quizId}`
    );

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Unexpected error in quiz API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { quizId } = await params;
    const body = await request.json();
    const { name, difficulty, timeLimit, isPublic } = body;

    const token = await getSessionToken();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await updateQuiz(
      quizId,
      { name, difficulty, timeLimit, isPublic },
      token
    );
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error updating quiz:', error);
    if (error instanceof Error && error.message.includes('403')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Unable to connect to the API. Please contact the administrator.' },
      { status: 500 }
    );
  }
}
