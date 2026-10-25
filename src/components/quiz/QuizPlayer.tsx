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
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);
  // Per-question verdict from the server; absent => fall back to "Answer locked in".
  const [feedback, setFeedback] = useState<
    Record<string, QuestionFeedback | undefined>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);
  const [timeTaken, setTimeTaken] = useState<number | undefined>(undefined);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
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
    setChecked(false);
    setXpAwarded(false);
    setTimeTaken(undefined);
    startedAtRef.current = null;
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
    startedAtRef.current = Date.now();
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
  const handleQuizSubmit = async () => {
    if (!isAuthenticated) {
      setShowSignInGate(true);
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
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
      setXpAwarded(result?.xpAwarded === true);

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      logger.error('Error submitting quiz:', error);
      setScore(0);
    } finally {
      if (startedAtRef.current) {
        setTimeTaken(Math.round((Date.now() - startedAtRef.current) / 1000));
      }
      submittingRef.current = false;
      setSubmitting(false);
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

  const totalQuestions = shuffledQuestions.length;
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const selectedForCurrent = currentQuestion
    ? answers[currentQuestion.id] || []
    : [];
  const isLast = currentQuestionIndex >= totalQuestions - 1;
  const canCheck = selectedForCurrent.length > 0;
  const playing = quizStarted && !quizCompleted && totalQuestions > 0;

  const exitQuiz = () => {
    if (subject && topic) {
      router.push(`/quiz/${subject}/${topic}`);
    } else {
      router.push('/dashboard');
    }
  };

  const handlePrimary = async () => {
    if (submitting || checkingRef.current) return;
    if (!checked) {
      if (!canCheck || !currentQuestion) return;
      const qid = currentQuestion.id;
      checkingRef.current = true;
      setChecking(true);
      try {
        const res = await fetch(`/api/quiz/${quizId}/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionId: qid,
            selectedAnswerIds: selectedForCurrent,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (
            typeof data?.isCorrect === 'boolean' &&
            Array.isArray(data?.correctOptionIds)
          ) {
            setFeedback((prev) => ({
              ...prev,
              [qid]: {
                isCorrect: data.isCorrect,
                correctOptionIds: data.correctOptionIds,
                explanation:
                  typeof data.explanation === 'string'
                    ? data.explanation
                    : null,
              },
            }));
          }
        }
      } catch (error) {
        logger.error('Error checking answer:', error);
      } finally {
        checkingRef.current = false;
        setChecking(false);
        setChecked(true);
      }
    } else if (isLast) {
      handleQuizSubmit();
    } else {
      setCurrentQuestionIndex((i) => i + 1);
      setChecked(false);
    }
  };

  // Latest handler + state for the key listener below
  const keyStateRef = useRef({ handlePrimary, currentQuestion, checked });
  useEffect(() => {
    keyStateRef.current = { handlePrimary, currentQuestion, checked };
  });
  const overlayOpenRef = useRef(false);
  useEffect(() => {
    overlayOpenRef.current = showExitConfirm || showSignInGate;
  }, [showExitConfirm, showSignInGate]);

  // Keyboard: 1-9 picks an option, Enter checks / continues
  useEffect(() => {
    if (!playing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (overlayOpenRef.current || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const {
        handlePrimary: primary,
        currentQuestion: q,
        checked: isChecked,
      } = keyStateRef.current;

      if (e.key === 'Enter') {
        // Let focused non-option buttons/links activate natively
        if (
          (tag === 'BUTTON' || tag === 'A') &&
          !target?.hasAttribute('data-option')
        ) {
          return;
        }
        e.preventDefault();
        primary();
        return;
      }

      if (/^[1-9]$/.test(e.key) && !isChecked && q?.answers) {
        const answer = q.answers[Number(e.key) - 1];
        if (!answer) return;
        e.preventDefault();
        if (q.type === 'checkbox') {
          setAnswers((prev) => {
            const cur = prev[q.id] || [];
            return {
              ...prev,
              [q.id]: cur.includes(answer.id)
                ? cur.filter((id) => id !== answer.id)
                : [...cur, answer.id],
            };
          });
        } else {
          setAnswers((prev) => ({ ...prev, [q.id]: [answer.id] }));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [playing]);

  // Escape closes dialogs
  useEffect(() => {
    if (!showExitConfirm && !showSignInGate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitConfirm(false);
        setShowSignInGate(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showExitConfirm, showSignInGate]);

  // Move focus to the question heading when the question changes
  useEffect(() => {
    if (playing) headingRef.current?.focus({ preventScroll: true });
  }, [currentQuestionIndex, playing]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!quizStarted) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-4 text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Quiz: {quizName}
        </h1>

        {/* Unverified quiz warning */}
        {!isVerified && (
          <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              Unverified Quiz
            </h2>
            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
              This quiz has not been verified by administrators.
              <strong> No points or XP will be awarded</strong> for completing
              this quiz. The content may not have been reviewed for accuracy.
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            You&apos;re playing as a guest.{' '}
            <button
              type="button"
              onClick={() => router.push('/auth')}
              className="font-semibold underline hover:text-blue-600 dark:hover:text-blue-100"
            >
              Sign in
            </button>{' '}
            to save your score and XP.
          </div>
        )}

        {topicContext && (
          <div className="mb-4 space-y-1 text-gray-600 dark:text-gray-300">
            <p>
              <strong>Topic:</strong> {topicContext.topicTitle}
            </p>
            <p>
              <strong>Chapter:</strong> {topicContext.chapterTitle} (Form{' '}
              {topicContext.form})
            </p>
            <p>
              <strong>Subject:</strong> {topicContext.subjectName}
            </p>
          </div>
        )}
        <div className="mb-6 space-y-1 text-gray-600 dark:text-gray-300">
          <p>This quiz contains {shuffledQuestions.length} questions.</p>
          {timeLimit && (
            <p>You will have {timeLimit} minutes to complete this quiz.</p>
          )}
          <p>Click the button below to start the quiz.</p>
        </div>
        <button
          onClick={handleStartQuiz}
          className="min-h-12 w-full rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:w-auto"
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
        timeTakenSeconds={timeTaken}
        xpAwarded={xpAwarded}
        onRetake={resetQuiz}
        onViewAll={exitQuiz}
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
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="text-center">
          {!loadingTimeout ? (
            <>
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent border-l-transparent motion-reduce:animate-none"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                Preparing quiz questions...
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {questions.length > 0
                  ? `Found ${questions.length} questions, shuffling...`
                  : 'Waiting for questions...'}
              </p>
            </>
          ) : (
            <>
              <div className="mb-2 text-yellow-500">⚠️</div>
              <p className="font-medium text-gray-800 dark:text-gray-200">
                Taking longer than expected
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
                  className="min-h-11 rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
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

  const primaryLabel = !checked ? 'Check' : isLast ? 'Finish' : 'Continue';
  const primaryDisabled = submitting || checking || (!checked && !canCheck);
  const currentFeedback = currentQuestion
    ? feedback[currentQuestion.id]
    : undefined;
  const correctTexts =
    currentFeedback && !currentFeedback.isCorrect && currentQuestion
      ? currentQuestion.answers
          ?.filter((a) => currentFeedback.correctOptionIds.includes(a.id))
          .map((a) => a.text)
      : undefined;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-gray-900">
      {showSignInGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signin-gate-title"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3
              id="signin-gate-title"
              className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100"
            >
              Sign in to save your score and XP
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
              You&apos;re browsing as a guest, so this attempt can&apos;t be
              submitted or scored. Sign in to record your result and earn XP.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setShowSignInGate(false)}
                className="min-h-11 rounded-2xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Keep reviewing
              </button>
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="min-h-11 rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      )}

      {showExitConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="exit-quiz-title"
          aria-describedby="exit-quiz-desc"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3
              id="exit-quiz-title"
              className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-100"
            >
              Leave this quiz?
            </h3>
            <p
              id="exit-quiz-desc"
              className="mb-6 text-sm text-gray-600 dark:text-gray-300"
            >
              Your progress won&apos;t be saved.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={() => setShowExitConfirm(false)}
                className="min-h-11 rounded-2xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Keep going
              </button>
              <button
                type="button"
                onClick={exitQuiz}
                className="min-h-11 rounded-2xl border border-gray-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-50 dark:border-gray-600 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <QuizProgress
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        answeredQuestions={currentQuestionIndex + (checked ? 1 : 0)}
        onExit={() => setShowExitConfirm(true)}
        timeLabel={timeLimit ? formatTime(timeRemaining) : undefined}
        timeCritical={!!timeLimit && timeRemaining < 60}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6">
          {currentQuestion && (
            <QuizQuestion
              key={currentQuestion.id}
              ref={headingRef}
              question={currentQuestion}
              selectedAnswers={selectedForCurrent}
              locked={checked}
              correctIds={
                checked ? currentFeedback?.correctOptionIds : undefined
              }
              onAnswerChange={(selectedAnswers) =>
                handleAnswerChange(currentQuestion.id, selectedAnswers)
              }
            />
          )}
        </div>
      </div>

      <div
        className={`border-t px-4 pb-4 pt-3 motion-safe:transition-colors ${
          checked
            ? currentFeedback
              ? currentFeedback.isCorrect
                ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
              : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
            : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
        }`}
      >
        <div className="mx-auto max-w-2xl">
          <div aria-live="polite" role="status">
            {checked && (
              <FeedbackPanel
                key={currentQuestion?.id}
                verdict={currentFeedback}
                correctTexts={correctTexts}
                message={
                  isLast
                    ? 'Answer locked in. Finish to see your score.'
                    : 'Answer locked in.'
                }
              />
            )}
          </div>
          <button
            type="button"
            onClick={handlePrimary}
            disabled={primaryDisabled}
            className="min-h-14 w-full rounded-2xl bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none dark:focus-visible:ring-offset-gray-900 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
          >
            {submitting ? 'Submitting...' : checking ? 'Checking...' : primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface QuestionFeedback {
  isCorrect: boolean;
  correctOptionIds: string[];
  explanation: string | null;
}

// Verdict comes from the server's per-question check endpoint (the answer key
// is never in the quiz payload). If that call fails we fall back to the neutral
// "Answer locked in" message; the final score still comes from submission.
function FeedbackPanel({
  message,
  verdict,
  correctTexts,
}: {
  message: string;
  verdict?: QuestionFeedback;
  correctTexts?: string[];
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const tone = !verdict
    ? 'text-blue-800 dark:text-blue-200'
    : verdict.isCorrect
      ? 'text-green-800 dark:text-green-200'
      : 'text-red-800 dark:text-red-200';
  return (
    <div
      className={`mb-3 text-sm font-semibold ${tone} motion-safe:transition-all motion-safe:duration-200 ${
        shown
          ? 'translate-y-0 opacity-100'
          : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {verdict && !verdict.isCorrect ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M5 12l5 5L20 7" />
          )}
        </svg>
        {verdict ? (verdict.isCorrect ? 'Correct!' : 'Not quite') : message}
      </div>
      {correctTexts && correctTexts.length > 0 && (
        <p className="mt-1 pl-7 font-medium">
          Correct answer: {correctTexts.join(', ')}
        </p>
      )}
      {verdict?.explanation && (
        <p className="mt-1 pl-7 font-normal">{verdict.explanation}</p>
      )}
    </div>
  );
}
