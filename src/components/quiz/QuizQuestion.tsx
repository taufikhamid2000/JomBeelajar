import React, { forwardRef } from 'react';
import { Question } from '@/types/topics';

interface QuizQuestionProps {
  question: Question;
  selectedAnswers: string[];
  onAnswerChange: (selectedAnswers: string[]) => void;
  /** Answer is locked in (after pressing Check) */
  locked?: boolean;
  /** Correct option ids, once the server has checked this question */
  correctIds?: string[];
}

const QuizQuestion = forwardRef<HTMLHeadingElement, QuizQuestionProps>(
  function QuizQuestion(
    { question, selectedAnswers, onAnswerChange, locked = false, correctIds },
    headingRef
  ) {
    const isMulti = question.type === 'checkbox';

    const toggle = (answerId: string) => {
      if (locked) return;
      if (!isMulti) {
        onAnswerChange([answerId]);
        return;
      }
      onAnswerChange(
        selectedAnswers.includes(answerId)
          ? selectedAnswers.filter((id) => id !== answerId)
          : [...selectedAnswers, answerId]
      );
    };

    const headingId = `question-heading-${question.id}`;

    if (!question.answers || question.answers.length === 0) {
      return (
        <div className="py-4">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="mb-4 text-xl font-bold text-strong focus:outline-none"
          >
            {question.text}
          </h2>
          <p className="text-yellow-600 dark:text-yellow-400">
            No answer options available for this question.
          </p>
        </div>
      );
    }

    return (
      <div className="py-4">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="mb-2 text-xl font-bold leading-snug text-strong focus:outline-none sm:text-2xl"
        >
          {question.text}
        </h2>
        <p className="mb-5 text-sm text-soft">
          {isMulti ? 'Select all that apply' : 'Choose one answer'}
          <span className="hidden sm:inline">
            {' '}
            &middot; press 1-{Math.min(9, question.answers.length)} to pick
          </span>
        </p>
        <div
          role={isMulti ? 'group' : 'radiogroup'}
          aria-labelledby={headingId}
          className="space-y-3"
        >
          {question.answers.map((answer, i) => {
            const selected = selectedAnswers.includes(answer.id);
            const revealed = locked && !!correctIds;
            const isRight = revealed && correctIds!.includes(answer.id);
            const isWrong = revealed && selected && !isRight;
            return (
              <button
                key={answer.id}
                id={answer.id}
                type="button"
                role={isMulti ? 'checkbox' : 'radio'}
                aria-checked={selected}
                aria-disabled={locked}
                data-option
                onClick={() => toggle(answer.id)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 motion-safe:transition-colors dark:focus-visible:ring-offset-gray-900 ${
                  isRight
                    ? 'border-green-600 bg-green-50 text-green-900 dark:border-green-400 dark:bg-green-900/30 dark:text-green-100'
                    : isWrong
                      ? 'border-red-600 bg-red-50 text-red-900 dark:border-red-400 dark:bg-red-900/30 dark:text-red-100'
                      : selected
                        ? 'border-brand/40 bg-brand-soft text-brand dark:bg-[var(--band-via)]/30'
                        : 'border-border bg-surface text-strong hover:border-border hover:bg-surface-2'
                } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 text-sm font-bold ${
                    isMulti ? 'rounded-lg' : 'rounded-full'
                  } ${
                    isRight
                      ? 'border-green-600 bg-green-600 text-white dark:border-green-400 dark:bg-green-500'
                      : isWrong
                        ? 'border-red-600 bg-red-600 text-white dark:border-red-400 dark:bg-red-500'
                        : selected
                          ? 'border-brand/40 bg-[var(--band-via)] text-white dark:bg-[var(--band-via)]'
                          : 'border-border text-soft'
                  }`}
                >
                  {isRight ? '✓' : isWrong ? '✕' : i + 1}
                </span>
                <span className="flex-1">{answer.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);

export default QuizQuestion;
