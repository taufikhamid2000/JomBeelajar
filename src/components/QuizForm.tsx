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
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            Quiz Context
          </h3>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            {subjectName && (
              <div className="flex">
                <dt className="font-medium text-gray-400 dark:text-gray-500 w-24">
                  Subject:
                </dt>
                <dd className="text-gray-100 dark:text-gray-800">
                  {subjectName}
                </dd>
              </div>
            )}
            {chapterName && (
              <div className="flex">
                <dt className="font-medium text-gray-400 dark:text-gray-500 w-24">
                  Chapter:
                </dt>
                <dd className="text-gray-100 dark:text-gray-800">
                  {chapterName}
                </dd>
              </div>
            )}
            {topicName && (
              <div className="flex">
                <dt className="font-medium text-gray-400 dark:text-gray-500 w-24">
                  Topic:
                </dt>
                <dd className="text-gray-100 dark:text-gray-800">
                  {topicName}
                </dd>
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
            className="block text-sm font-medium text-gray-300 dark:text-gray-700"
          >
            Quiz Code
          </label>
          <div className="relative">
            <input
              id="quizName"
              className="w-full px-3 py-2 border rounded-md shadow-sm bg-gray-700/50 dark:bg-gray-50 border-gray-300 dark:border-gray-700 text-gray-200 dark:text-gray-800 font-mono"
              readOnly
              value={quizCode}
              {...register('name', {
                required: true,
                value: quizCode,
              })}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Auto-generated unique quiz identifier
          </p>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-300 dark:text-gray-700"
          >
            Description
          </label>{' '}
          <textarea
            id="description"
            rows={3}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 dark:bg-white text-gray-200 dark:text-gray-800 placeholder-gray-400 dark:placeholder-gray-500
              ${errors.description ? 'border-red-400 focus:ring-red-500' : 'border-gray-600 dark:border-gray-300'}`}
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
            className="block text-sm font-medium text-gray-300 dark:text-gray-700"
          >
            Difficulty Level
          </label>
          <select
            id="difficulty"
            className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 bg-gray-700 dark:bg-white text-gray-200 dark:text-gray-800 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="block text-sm font-medium text-gray-300 dark:text-gray-700"
          >
            Time Limit (minutes)
          </label>
          <input
            id="timeLimit"
            type="number"
            min="1"
            max="120"
            className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 bg-gray-700 dark:bg-white text-gray-200 dark:text-gray-800 placeholder-gray-400 dark:placeholder-gray-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave blank for no limit"
            {...register('timeLimit', { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2 opacity-50">
          <label className="flex items-center text-sm font-medium text-gray-300 dark:text-gray-700">
            Number of Questions
            <span className="ml-2 text-xs py-0.5 px-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
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
              className="w-full h-2 bg-gray-700 dark:bg-gray-200 rounded-lg appearance-none cursor-not-allowed"
            />
            <span className="w-8 text-center">{questionCount}</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Questions are added after creating the quiz
          </p>
        </div>
        <div className="flex items-center mt-2">
          <input
            id="isPublic"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('isPublic')}
          />
          <label
            htmlFor="isPublic"
            className="ml-2 text-sm text-gray-300 dark:text-gray-700"
          >
            Make this quiz public
          </label>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 text-white font-medium rounded-md shadow-sm 
            bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Creating Quiz...' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
}
