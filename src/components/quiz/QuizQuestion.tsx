import React, { forwardRef } from 'react';
import { Question } from '@/types/topics';

interface QuizQuestionProps {
  question: Question;
  selectedAnswers: string[];
  onAnswerChange: (selectedAnswers: string[]) => void;
  /** Answer is locked in (after pressing Check) */
  locked?: boolean;
}

const QuizQuestion = forwardRef<HTMLHeadingElement, QuizQuestionProps>(
  function QuizQuestion(
    { question, selectedAnswers, onAnswerChange, locked = false },
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
            className="mb-4 text-xl font-bold text-gray-900 focus:outline-none dark:text-gray-100"
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
          className="mb-2 text-xl font-bold leading-snug text-gray-900 focus:outline-none sm:text-2xl dark:text-gray-100"
        >
          {question.text}
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {isMulti ? 'Select all that apply' : 'Choose one answer'}
          <span className="hidden sm:inline"> &middot; press 1-{Math.min(9, question.answers.length)} to pick</span>
        </p>
        <div
          role={isMulti ? 'group' : 'radiogroup'}
          aria-labelledby={headingId}
          className="space-y-3"
        >
          {question.answers.map((answer, i) => {
            const selected = selectedAnswers.includes(answer.id);
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
                className={`flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-medium shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 motion-safe:transition-colors dark:focus-visible:ring-offset-gray-900 ${
                  selected
                    ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-100'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:border-gray-600 dark:hover:bg-gray-700/60'
                } ${locked ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 text-sm font-bold ${
                    isMulti ? 'rounded-lg' : 'rounded-full'
                  } ${
                    selected
                      ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
                      : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {i + 1}
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
