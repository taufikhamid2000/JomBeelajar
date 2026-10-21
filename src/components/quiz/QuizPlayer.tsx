/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Question } from '@/types/topics';
import QuizQuestion from './QuizQuestion';
import QuizProgress from './QuizProgress';
import QuizResults from './QuizResults';
import { useRouter } from 'next/navigation';
import { submitQuizAttempt } from '@/services/quizService';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

// Small seeded PRNG (mulberry32) so the shuffle is a pure function of its
// seed: the random part (picking a seed) happens once on mount / on retake,
// never during render.
function seededRandom(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function newShuffleSeed(): number {
  return Math.floor(Math.random() * 4294967296);
}

// Fisher-Yates shuffle algorithm (deterministic for a given seed)
function shuffleArray<T>(array: T[], seed: number): T[] {
  const random = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Questions that have everything needed to be played
function getValidQuestions(questions: Question[]): Question[] {
  return normalizeQuestions(questions).filter(
    (q) => q.id && q.text && Array.isArray(q.answers) && q.answers.length > 0
  );
}

// Define interfaces for flexible question & answer formats from different sources
interface QuestionLike {
  id: string;
  quiz_id: string;
  text?: string;
  question_text?: string;
  type?: string;
  order_index?: number;
  created_at: string;
  updated_at?: string;
  answers?: AnswerLike[];
}

interface AnswerLike {
  id: string;
  question_id: string;
  text?: string;
  answer_text?: string;
  is_correct?: boolean;
  order_index?: number;
  created_at: string;
  updated_at?: string;
}

// Helper to normalize questions that might have different structures
function normalizeQuestions(questions: QuestionLike[]): Question[] {
  if (!Array.isArray(questions) || questions.length === 0) {
    logger.warn('No questions to normalize');
    return [];
  }

  return questions.map((q) => {
    // Create normalized question object
    const normalizedQuestion: Question = {
      id: q.id,
      quiz_id: q.quiz_id,
      text: q.text || q.question_text || '', // Handle different field names
      type: (q.type as 'radio' | 'checkbox') || 'radio',
      order_index: q.order_index || 0,
      created_at: q.created_at,
      updated_at: q.updated_at || q.created_at,
      answers: [],
    };

    // Handle answers if present
    if (Array.isArray(q.answers)) {
      normalizedQuestion.answers = q.answers.map((a: AnswerLike) => ({
        id: a.id,
        question_id: a.question_id,
        text: a.text || a.answer_text || '',
        is_correct: a.is_correct === true, // Ensure boolean
        order_index: a.order_index || 0,
        created_at: a.created_at,
        updated_at: a.updated_at || a.created_at,
      }));
    }

    return normalizedQuestion;
  });
}

interface TopicContext {
  topicTitle: string;
  chapterTitle: string;
  subjectName: string;
  form?: number;
}

interface QuizPlayerProps {
  quizId: string;
  quizName: string;
  questions: Question[];
  timeLimit?: number; // Time limit in minutes
  userId?: string;
  subject?: string; // Added for navigation
  topic?: string; // Added for navigation
  onComplete?: () => void;
  topicContext?: TopicContext | null;
  isVerified?: boolean; // Quiz verification status
}

export default function QuizPlayer({
  quizId,
  quizName,
  questions,
  timeLimit,
  subject,
  topic,
  onComplete,
  topicContext,
  isVerified = true,
}: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [questionResults, setQuestionResults] = useState<
    | Array<{ questionId: string; correct: boolean; correctAnswerIds: string[] }>
    | undefined
  >(undefined);
  const [timeRemaining, setTimeRemaining] = useState(
    timeLimit ? timeLimit * 60 : 0
  );
  const [quizStarted, setQuizStarted] = useState(false);
  // Seed for the question order; re-rolled on retake.
  const [shuffleSeed, setShuffleSeed] = useState(newShuffleSeed);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSignInGate, setShowSignInGate] = useState(false);
  const router = useRouter();

  // Track whether the visitor is signed in — anonymous visitors can take the
  // quiz, but submitting requires a session (server rejects with 401 otherwise).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setIsAuthenticated(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  // Shuffled questions, derived from the questions prop and the seed
  const validQuestions = useMemo(() => getValidQuestions(questions), [questions]);
  const shuffledQuestions = useMemo(() => {
    if (validQuestions.length > 0) {
      return shuffleArray(validQuestions, shuffleSeed);
    }
    // Force shuffle if we hit the loading timeout but have questions available
    if (loadingTimeout && questions.length > 0) {
      return shuffleArray(questions, shuffleSeed);
    }
    return [];
  }, [validQuestions, questions, shuffleSeed, loadingTimeout]);

  // Log question preparation when the questions prop changes
  useEffect(() => {
    logger.log('QuizPlayer: questions prop changed', {
      questionsLength: questions.length,
      quizId: quizId,
      quizName: quizName,
      questionsSample: questions.slice(0, Math.min(3, questions.length)),
    });

    // Normalize questions to handle potential field name differences
    const normalizedQuestions = normalizeQuestions(questions);
    logger.log('QuizPlayer: normalized questions', {
      normalizedCount: normalizedQuestions.length,
      firstNormalized:
        normalizedQuestions.length > 0
          ? {
              id: normalizedQuestions[0].id,
              text: normalizedQuestions[0].text,
              answerCount: normalizedQuestions[0].answers?.length || 0,
            }
          : null,
    });

    if (validQuestions.length !== normalizedQuestions.length) {
      logger.warn('QuizPlayer: Some questions are missing required fields', {
        totalQuestions: normalizedQuestions.length,
        validQuestions: validQuestions.length,
        invalidQuestions: normalizedQuestions.filter(
          (q) =>
            !q.id ||
            !q.text ||
            !Array.isArray(q.answers) ||
            q.answers.length === 0
        ),
      });
    }

    if (validQuestions.length > 0) {
      // Log the randomization for verification
      logger.log('Quiz questions shuffled:', {
        originalOrder: validQuestions.map((q) => q.id.slice(-8)),
        shuffledOrder: shuffledQuestions.map((q) => q.id.slice(-8)),
      });
    } else {
      logger.warn('QuizPlayer: No valid questions available to shuffle');
    }
  }, [questions]);

  // Function to reset quiz state for retaking
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setQuestionResults(undefined);
    setTimeRemaining(timeLimit ? timeLimit * 60 : 0);
    setQuizStarted(false);
    // Re-shuffle questions for a fresh experience on retake
    const seed = newShuffleSeed();
    setShuffleSeed(seed);
    const reshuffled = shuffleArray(validQuestions, seed);
    logger.log('Quiz questions re-shuffled on retake:', {
      newOrder: reshuffled.map((q) => q.id.slice(-8)),
    });
  };

  // Add timeout detection for the loading state
  useEffect(() => {
    // If we're still in loading state after 10 seconds, show a timeout message
    let timeoutId: NodeJS.Timeout;

    if (shuffledQuestions.length === 0 && questions.length > 0) {
      timeoutId = setTimeout(() => {
        logger.warn('QuizPlayer: Loading timeout reached');
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [shuffledQuestions.length, questions.length]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerChange = (
    questionId: string,
    selectedAnswers: string[]
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedAnswers,
    }));
  };
  const handleNextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  const handleQuizSubmit = async () => {
    if (!isAuthenticated) {
      setShowSignInGate(true);
      return;
    }
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(
        ([questionId, selectedAnswerIds]) => ({
          questionId,
          selectedAnswerIds,
        })
      );

      // Submit quiz attempt — MyQuiza scores server-side and returns the result.
      // The answer key never reaches the client, so we trust the server score.
      const result = await submitQuizAttempt({
        quizId,
        answers: formattedAnswers,
      });

      setScore(typeof result?.score === 'number' ? result.score : 0);
      setQuestionResults(result?.questions);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      logger.error('Error submitting quiz:', error);
      setScore(0);
    } finally {
      setQuizCompleted(true);
    }
  };

  // Latest remaining time / submit handler for the timer below, so starting
  // the timer resumes from the current time and the auto-submit on time-up
  // uses the latest answers. (Next's bundled React has no useEffectEvent.)
  const timeRemainingRef = useRef(timeRemaining);
  const handleQuizSubmitRef = useRef(handleQuizSubmit);
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
    handleQuizSubmitRef.current = handleQuizSubmit;
  });

  // Start quiz timer when quiz is started
  useEffect(() => {
    if (!quizStarted || !timeLimit || quizCompleted) return;

    let remaining = timeRemainingRef.current;
    const timer = setInterval(() => {
      remaining = remaining <= 1 ? 0 : remaining - 1;
      setTimeRemaining(remaining);
      if (remaining === 0) {
        clearInterval(timer);
        handleQuizSubmitRef.current();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeLimit, quizCompleted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  if (!quizStarted) {
    return (
      <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Quiz: {quizName}</h2>

        {/* Unverified quiz warning */}
        {!isVerified && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Unverified Quiz
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    This quiz has not been verified by administrators.
                    <strong> No points or XP will be awarded</strong> for
                    completing this quiz. The content may not have been reviewed
                    for accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            You&apos;re playing as a guest.{' '}
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="underline font-medium hover:text-blue-600 dark:hover:text-blue-100"
            >
              Sign in
            </button>{' '}
            to save your score and XP.
          </div>
        )}

        {topicContext && (
          <div className="mb-4 text-gray-300 dark:text-gray-600">
            <p className="mb-1">
              <strong>Topic:</strong> {topicContext.topicTitle}
            </p>
            <p className="mb-1">
              <strong>Chapter:</strong> {topicContext.chapterTitle} (Form{' '}
              {topicContext.form})
            </p>
            <p className="mb-1">
              <strong>Subject:</strong> {topicContext.subjectName}
            </p>
          </div>
        )}
        <div className="mb-6">
          <p className="text-gray-300 dark:text-gray-600 mb-2">
            This quiz contains {shuffledQuestions.length} questions.
          </p>
          {timeLimit && (
            <p className="text-gray-300 dark:text-gray-600 mb-2">
              You will have {timeLimit} minutes to complete this quiz.
            </p>
          )}
          <p className="text-gray-300 dark:text-gray-600">
            Click the button below to start the quiz.
          </p>
        </div>
        <button
          onClick={handleStartQuiz}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start Quiz
        </button>
      </div>
    );
  }
  if (quizCompleted) {
    return (
      <QuizResults
        score={score}
        totalQuestions={shuffledQuestions.length}
        isVerified={isVerified}
        perQuestion={questionResults}
        questions={shuffledQuestions}
        userAnswers={answers}
        onRetake={resetQuiz}
        onViewAll={() => {
          if (subject && topic) {
            router.push(`/quiz/${subject}/${topic}`);
          } else {
            router.push('/dashboard');
          }
        }}
      />
    );
  }

  // Don't render if shuffledQuestions is not ready
  if (shuffledQuestions.length === 0) {
    logger.log('QuizPlayer: In loading state', {
      shuffledQuestionsLength: shuffledQuestions.length,
      originalQuestionsLength: questions.length,
    });

    return (
      <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {!loadingTimeout ? (
            <>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
              <p className="mt-4 text-gray-400 dark:text-gray-600">
                Preparing quiz questions...
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                {questions.length > 0
                  ? `Found ${questions.length} questions, shuffling...`
                  : 'Waiting for questions...'}
              </p>
            </>
          ) : (
            <>
              <div className="text-yellow-500 mb-2">⚠️</div>
              <p className="text-gray-300 dark:text-gray-700 font-medium">
                Taking longer than expected
              </p>
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-600">
                {questions.length > 0
                  ? `Found ${questions.length} questions, but having trouble shuffling them.`
                  : 'There was a problem loading the quiz questions.'}
              </p>

              <div className="mt-4">
                <button
                  onClick={() => {
                    if (questions.length > 0) {
                      // Try forcing a shuffle again
                      setLoadingTimeout(true);
                      setShuffleSeed(newShuffleSeed());
                    } else {
                      // If no questions, refresh the page
                      window.location.reload();
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                >
                  {questions.length > 0 ? 'Try Again' : 'Reload Quiz'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  return (
    <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-6 relative">
      {showSignInGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
              Sign in to save your score and XP
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              You&apos;re browsing as a guest, so this attempt can&apos;t be
              submitted or scored. Sign in to record your result and earn XP.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSignInGate(false)}
                className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Keep reviewing
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">{quizName}</h2>
        {timeLimit && (
          <div
            className={`px-4 py-2 rounded-md font-mono ${
              timeRemaining < 60
                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            }`}
          >
            Time: {formatTime(timeRemaining)}
          </div>
        )}
      </div>{' '}
      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={shuffledQuestions.length}
        answeredQuestions={Object.keys(answers).length}
      />
      {currentQuestion && (
        <QuizQuestion
          question={currentQuestion}
          selectedAnswers={answers[currentQuestion.id] || []}
          onAnswerChange={(selectedAnswers) =>
            handleAnswerChange(currentQuestion.id, selectedAnswers)
          }
        />
      )}
      <div className="flex justify-between mt-8">
        <button
          onClick={handlePrevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-2 rounded-md ${
            currentQuestionIndex === 0
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Previous
        </button>

        {currentQuestionIndex < shuffledQuestions.length - 1 ? (
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next Question
          </button>
        ) : (
          <button
            onClick={handleQuizSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
