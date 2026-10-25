import React from 'react';

interface QuizProgressProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
  onExit?: () => void;
  timeLabel?: string;
  timeCritical?: boolean;
}

/**
 * Lesson-style top bar: exit (X), thin progress bar, "Question N of M" and
 * the optional countdown.
 */
export default function QuizProgress({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  onExit,
  timeLabel,
  timeCritical = false,
}: QuizProgressProps) {
  const percentage =
    totalQuestions > 0 ? Math.min(100, (answeredQuestions / totalQuestions) * 100) : 0;

  return (
    <div className="border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit quiz"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            aria-valuenow={Math.round(percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Question ${currentQuestion} of ${totalQuestions}`}
          >
            <div
              className="h-full rounded-full bg-blue-600 motion-safe:transition-[width] motion-safe:duration-300 dark:bg-blue-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Question {currentQuestion} of {totalQuestions}
          </p>
        </div>
        {timeLabel && (
          <div
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-sm font-semibold ${
              timeCritical
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200'
            }`}
          >
            <span className="sr-only">Time remaining: </span>
            {timeLabel}
          </div>
        )}
      </div>
    </div>
  );
}
