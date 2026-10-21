import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { checkAdminAccess } from './adminAuthService';
import { QuizWithQuestionsAndContext } from '@/types/topics';

/**
 * Interface for Quiz structure
 */
export interface Quiz {
  id: string;
  topic_id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  question_count?: number;
  is_published?: boolean;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  time_limit_seconds?: number;
  passing_score?: number;
}

/**
 * Interface for QuizQuestion structure
 */
export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  explanation?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export async function createQuiz(
  quizData: any
): Promise<{ success: boolean; quizId?: string; error?: string }> {
  try {
    logger.log('Creating quiz with data:', quizData);

    // Basic validation
    if (!quizData.name || quizData.name.trim() === '') {
      return {
        success: false,
        error: 'Quiz name is required',
      };
    }

    if (quizData.name.length < 5) {
      return {
        success: false,
        error: 'Quiz name must be at least 5 characters',
      };
    }

    if (!quizData.topic) {
      return {
        success: false,
        error: 'Topic ID is required',
      };
    }

    // Get current user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error: 'Authentication required. Please log in to create a quiz.',
      };
    }

    // Prepare quiz data with only the fields that exist in the database schema
    const quizRecord = {
      name: quizData.name.trim(),
      topic_id: quizData.topic,
      created_by: session.user.id, // Use authenticated user ID
    };

    logger.log('Submitting quiz record to Supabase:', quizRecord);

    // Save quiz data to Supabase
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quizRecord])
      .select();
    if (error) {
      logger.error('Supabase error creating quiz:', error);
      return {
        success: false,
        error: error.message || JSON.stringify(error),
      };
    }
    if (!data || data.length === 0) {
      logger.error('No data returned from quiz creation');
      return {
        success: false,
        error: 'Quiz created but no ID returned',
      };
    }

    logger.log('Quiz created successfully with data:', data);

    return {
      success: true,
      quizId: data[0].id,
    };
  } catch (err) {
    logger.error('Unexpected error creating quiz:', err);
    return {
      success: false,
      error:
        err instanceof Error ? err.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Fetches all available quizzes
 */
export async function fetchQuizzes() {
  try {
    const response = await fetch('/api/quizzes');

    if (!response.ok) {
      throw new Error(`Failed to fetch quizzes: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching quizzes:', error);
    throw error;
  }
}

/**
 * Submits a quiz with the user's answers
 * @param data Object containing quizId and answers
 */
export async function submitQuiz(data: {
  quizId: number;
  answers: Array<{ questionId: number; answer: string }>;
}) {
  try {
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit quiz: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Error submitting quiz:', error);
    throw error;
  }
}

/**
 * Submits a quiz attempt with the user's answers
 */
export async function submitQuizAttempt({
  quizId,
  answers,
  timeTaken,
}: {
  quizId: string;
  answers: { questionId: string; selectedAnswerIds: string[] }[];
  timeTaken?: number;
}): Promise<{
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  maxScore: number;
  xpAwarded: boolean;
  questions?: Array<{
    questionId: string;
    correct: boolean;
    correctAnswerIds: string[];
  }>;
}> {
  try {
    logger.log('Submitting quiz attempt via API:', { quizId });

    const response = await fetch(`/api/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers, timeTaken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const result = await response.json();
    logger.log('Quiz attempt submitted successfully:', result);
    return result;
  } catch (error) {
    logger.error('Error submitting quiz attempt:', error);
    throw error;
  }
}

/**
 * Fetches all quizzes for admin use
 */
export async function fetchAdminQuizzes(): Promise<{
  data: Quiz[] | null;
  error: { message: string } | null;
}> {
  try {
    logger.log('Fetching admin quizzes...');

    // Check session
    const { success, error: accessError } = await checkAdminAccess();

    if (!success) {
      logger.log('No admin access for quiz fetch');
      return {
        data: null,
        error: {
          message:
            accessError?.message || 'Authentication required. Please log in.',
        },
      };
    } // Fetch quizzes with topic details
    const { data, error } = await supabase
      .from('quizzes')
      .select(
        `
        *,
        topics (
          name,
          id
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching quizzes:', error);
      return {
        data: null,
        error: {
          message: error.message || 'Unknown error in fetchAdminQuizzes',
        },
      };
    } // Format quiz data
    const formattedQuizzes: Quiz[] = data.map((quiz) => ({
      ...quiz,
      topic_title: quiz.topics?.name || 'Unknown Topic',
      topic_id: quiz.topics?.id || quiz.topic_id,
    }));

    return { data: formattedQuizzes, error: null };
  } catch (err) {
    logger.error('Error in fetchAdminQuizzes:', err);
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Creates a new quiz for admin use
 */
export async function createAdminQuiz(quizData: {
  name: string;
  topic_id: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  time_limit_seconds?: number;
  passing_score?: number;
}): Promise<{
  id?: string;
  error: { message: string } | null;
}> {
  try {
    // Validate required fields
    if (!quizData.name || quizData.name.trim() === '') {
      return {
        error: { message: 'Quiz name is required' },
      };
    }

    if (!quizData.topic_id) {
      return {
        error: { message: 'Topic is required' },
      };
    }

    // Check admin access
    const { success, error: accessError } = await checkAdminAccess();

    if (!success) {
      return {
        error: {
          message:
            accessError?.message || 'Authentication required. Please log in.',
        },
      };
    }

    // Prepare quiz data
    const quizRecord = {
      name: quizData.name.trim(),
      topic_id: quizData.topic_id,
      created_by: '', // Set to empty string or fetch userId from session if needed
      difficulty_level: quizData.difficulty_level || 'medium',
      time_limit_seconds: quizData.time_limit_seconds || 300, // 5 minutes default
      passing_score: quizData.passing_score || 70, // 70% default
      is_published: false,
    };

    // Insert quiz into database
    const { data, error } = await supabase
      .from('quizzes')
      .insert([quizRecord])
      .select();

    if (error) {
      logger.error('Error creating quiz:', error);
      return {
        error: { message: error.message || 'Failed to create quiz' },
      };
    }

    if (!data || data.length === 0) {
      return {
        error: { message: 'Quiz created but no ID returned' },
      };
    }

    return {
      id: data[0].id,
      error: null,
    };
  } catch (err) {
    logger.error('Error in createAdminQuiz:', err);
    return {
      error: {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Deletes a quiz (admin function)
 */
export async function deleteQuiz(id: string): Promise<{
  error: { message: string } | null;
}> {
  try {
    // Check admin access
    const { success, error: accessError } = await checkAdminAccess();

    if (!success) {
      return {
        error: {
          message:
            accessError?.message || 'Authentication required. Please log in.',
        },
      };
    }

    // Delete quiz questions first (cascade might handle this, but being explicit)
    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', id);

    if (questionsError) {
      logger.error('Error deleting quiz questions:', questionsError);
      return {
        error: {
          message: questionsError.message || 'Failed to delete quiz questions',
        },
      };
    }

    // Delete the quiz
    const { error } = await supabase.from('quizzes').delete().eq('id', id);

    if (error) {
      logger.error('Error deleting quiz:', error);
      return {
        error: { message: error.message || 'Failed to delete quiz' },
      };
    }

    return { error: null };
  } catch (err) {
    logger.error('Error in deleteQuiz:', err);
    return {
      error: {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Fetch quiz with questions and topic context via API
 */
export async function fetchQuizWithQuestionsAPI(quizId: string): Promise<
  | (QuizWithQuestionsAndContext & { error?: undefined })
  | {
      error: string;
      quiz?: undefined;
      questions?: undefined;
      topicContext?: undefined;
    }
> {
  try {
    logger.log(`Fetching quiz via API: ${quizId}`);

    const response = await fetch(`/api/quiz/${quizId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    logger.log(`Successfully fetched quiz data via API for quiz: ${quizId}`);

    return {
      quiz: data.quiz,
      questions: data.questions,
      topicContext: data.topicContext,
    };
  } catch (error) {
    logger.error('Error fetching quiz via API:', error);
    return {
      error:
        error instanceof Error ? error.message : 'Failed to fetch quiz data',
    };
  }
}
