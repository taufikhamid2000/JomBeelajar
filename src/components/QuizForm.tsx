import React, { useState } from 'react';

// Function to generate a random alphanumeric code of specified length
const generateQuizCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface QuizFormProps {
  register: any;
  handleSubmit: any;
  errors: any;
  onSubmit: any;
  isLoading?: boolean;
  subjectName?: string;
  chapterName?: string;
  topicName?: string;
}

export function QuizForm({
  register,
  handleSubmit,
  errors,
  onSubmit,
  isLoading = false,
  subjectName,
  chapterName,
  topicName,
}: QuizFormProps) {
  const [questionCount] = useState(3);
  const [quizCode] = useState(() => generateQuizCode());

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Quiz Context Information */}
      {(subjectName || chapterName || topicName) && (
        <div className="bg-brand-soft dark:bg-[var(--band-via)]/30 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-brand mb-2">Quiz Context</h3>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            {subjectName && (
              <div className="flex">
                <dt className="font-medium text-soft w-24">Subject:</dt>
                <dd className="text-strong">{subjectName}</dd>
              </div>
            )}
            {chapterName && (
              <div className="flex">
                <dt className="font-medium text-soft w-24">Chapter:</dt>
                <dd className="text-strong">{chapterName}</dd>
              </div>
            )}
            {topicName && (
              <div className="flex">
                <dt className="font-medium text-soft w-24">Topic:</dt>
                <dd className="text-strong">{topicName}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Quiz Basic Information */}
      <div className="space-y-4">
        {' '}
        <div className="space-y-2">
          <label
            htmlFor="quizName"
            className="block text-sm font-medium text-soft"
          >
            Quiz Code
          </label>
          <div className="relative">
            <input
              id="quizName"
              className="w-full px-3 py-2 border rounded-md shadow-sm bg-muted/50 border-border text-strong font-mono"
              readOnly
              value={quizCode}
              {...register('name', {
                required: true,
                value: quizCode,
              })}
            />
          </div>
          <p className="text-xs text-soft">
            Auto-generated unique quiz identifier
          </p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-soft"
          >
            Description
          </label>{' '}
          <textarea
            id="description"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 bg-surface text-strong placeholder-gray-400 dark:placeholder-gray-500
              ${errors.description ? 'border-red-400 focus:ring-red-500' : 'border-border'}`}
            placeholder="Describe what this quiz covers"
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.description.message}
            </p>
          )}
        </div>{' '}
        <div className="space-y-2">
          <label
            htmlFor="difficulty"
            className="block text-sm font-medium text-soft"
          >
            Difficulty Level
          </label>
          <select
            id="difficulty"
            className="w-full px-3 py-2 border border-border bg-muted text-strong rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            {...register('difficulty')}
          >
            <option value="">Unspecified</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="timeLimit"
            className="block text-sm font-medium text-soft"
          >
            Time Limit (minutes)
          </label>
          <input
            id="timeLimit"
            type="number"
            min="1"
            max="120"
            className="w-full px-3 py-2 border border-border bg-muted text-strong placeholder:text-soft rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder="Leave blank for no limit"
            {...register('timeLimit', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2 opacity-50">
          <label className="flex items-center text-sm font-medium text-soft">
            Number of Questions
            <span className="ml-2 text-xs py-0.5 px-1.5 bg-brand-soft dark:bg-[var(--band-via)] text-brand rounded">
              Coming soon
            </span>
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="20"
              disabled
              value={questionCount}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-not-allowed"
            />
            <span className="w-8 text-center">{questionCount}</span>
          </div>
          <p className="text-xs text-soft">
            Questions are added after creating the quiz
          </p>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="isPublic"
            type="checkbox"
            className="h-4 w-4 text-brand focus:ring-brand/40 border-border rounded"
            {...register('isPublic')}
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-soft">
            Make this quiz public
          </label>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 text-white font-medium rounded-md shadow-sm 
            bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-brand/40 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Creating Quiz...' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
}
