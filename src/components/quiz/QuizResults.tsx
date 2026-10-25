import React, { useEffect, useRef } from 'react';
import { Question } from '@/types/topics';
import { logger } from '@/lib/logger';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onRetake: () => void;
  onViewAll: () => void;
  isVerified?: boolean; // Quiz verification status
  // Per-question correctness + correct option ids from the server (MyQuiza),
  // ordered by question. The answer key only arrives here, post-submission.
  perQuestion?: Array<{
    questionId: string;
    correct: boolean;
    correctAnswerIds: string[];
  }>;
  // The quiz questions (for option text) and the user's selections, used to
  // render the per-question breakdown with correct/selected highlighting.
  questions?: Question[];
  userAnswers?: Record<string, string[]>;
  timeTakenSeconds?: number;
  xpAwarded?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QuizResults({
  score,
  totalQuestions,
  onRetake,
  onViewAll,
  isVerified = true,
  perQuestion,
  questions = [],
  userAnswers = {},
  timeTakenSeconds,
  xpAwarded,
}: QuizResultsProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const tone =
    score >= 80
      ? 'text-green-600 dark:text-green-400'
      : score >= 60
        ? 'text-blue-600 dark:text-blue-400'
        : score >= 40
          ? 'text-orange-500 dark:text-orange-400'
          : 'text-red-600 dark:text-red-400';
  const ringColor =
    score >= 80 ? '#16a34a' : score >= 60 ? '#2563eb' : score >= 40 ? '#f97316' : '#ef4444';

  const statusText =
    score >= 80
      ? 'Excellent!'
      : score >= 60
        ? 'Good job!'
        : score >= 40
          ? 'Not bad!'
          : 'Keep practicing!';

  const correctCount = perQuestion
    ? perQuestion.filter((q) => q.correct).length
    : Math.round((score / 100) * totalQuestions);

  const shareText = `I scored ${score}% on the JomBeelajar quiz! Try it out!`;
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'My JomBeelajar Quiz Result',
          text: shareText,
          url: window.location.href,
        })
        .catch((error) => logger.log('Error sharing', error));
    } else {
      navigator.clipboard
        .writeText(shareText + ' ' + window.location.href)
        .then(() => alert('Result copied to clipboard!'))
        .catch((err) => logger.error('Failed to copy: ', err));
    }
  };

  const circumference = 2 * Math.PI * 45;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const stat = (label: string, value: string, extra = '') => (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800 ${extra}`}
    >
      <span className="block text-xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="mb-8 text-center" role="status">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mb-4 text-2xl font-extrabold text-gray-900 focus:outline-none dark:text-gray-100"
            >
              Quiz Completed!
            </h1>
            <div className="relative mx-auto mb-4 h-44 w-44">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  strokeWidth="9"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-extrabold ${tone}`}>{score}%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Score</span>
              </div>
            </div>
            <p className={`text-xl font-bold ${tone}`}>{statusText}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              You scored {score}% ({correctCount}/{totalQuestions} correct)
            </p>
            {!isVerified && (
              <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>No points awarded:</strong> This was an unverified quiz
                </p>
              </div>
            )}
          </div>

          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat('Score', `${correctCount}/${totalQuestions}`)}
            {stat('Accuracy', `${totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0}%`)}
            {stat('Time', typeof timeTakenSeconds === 'number' ? formatDuration(timeTakenSeconds) : '-')}
            {xpAwarded && isVerified ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center shadow-sm dark:border-orange-800 dark:bg-orange-900/20">
                <span className="block text-xl font-bold text-orange-600 dark:text-orange-300">
                  XP earned
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-orange-600/80 dark:text-orange-300/80">
                  Reward
                </span>
              </div>
            ) : (
              stat('Status', score >= 60 ? 'Passed' : 'Try again')
            )}
          </div>

          {/* Per-question breakdown (server-scored; answer key arrives only here) */}
          {perQuestion && perQuestion.length > 0 && (
            <div className="mb-8 space-y-3">
              <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-gray-100">
                Performance Breakdown
              </h2>
              {perQuestion.map((q, index) => {
                const question = questions.find((qq) => qq.id === q.questionId);
                const correctIds = new Set(q.correctAnswerIds);
                const selectedIds = new Set(userAnswers[q.questionId] || []);
                const explanation = (question as { explanation?: string } | undefined)
                  ?.explanation;

                return (
                  <div
                    key={q.questionId}
                    className={`rounded-2xl border-l-4 bg-white p-4 shadow-sm dark:bg-gray-800 ${
                      q.correct ? 'border-green-500' : 'border-red-500'
                    }`}
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        Question {index + 1}
                      </span>
                      <span
                        className={`font-semibold ${
                          q.correct
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {q.correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    {question && (
                      <>
                        {question.text && (
                          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                            {question.text}
                          </p>
                        )}
                        <ul className="mt-2 space-y-1">
                          {(question.answers || []).map((opt) => {
                            const isCorrect = correctIds.has(opt.id);
                            const isSelected = selectedIds.has(opt.id);
                            return (
                              <li
                                key={opt.id}
                                className={`flex items-center gap-2 text-sm ${
                                  isCorrect
                                    ? 'font-medium text-green-600 dark:text-green-400'
                                    : isSelected
                                      ? 'text-red-600 line-through dark:text-red-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                }`}
                              >
                                <span aria-hidden="true">
                                  {isCorrect ? '✓' : isSelected ? '✗' : '•'}
                                </span>
                                <span>{opt.text}</span>
                                {isSelected && (
                                  <span className="text-xs opacity-70">(your answer)</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                        {explanation && (
                          <p className="mt-2 rounded-xl bg-gray-50 p-2 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                            {explanation}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetake}
            className="min-h-12 flex-1 rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={onViewAll}
            className="min-h-12 flex-1 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 font-bold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            Back to subject
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="min-h-12 rounded-2xl px-4 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Share Result
          </button>
        </div>
      </div>
    </div>
  );
}
