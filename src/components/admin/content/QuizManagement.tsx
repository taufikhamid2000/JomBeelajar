'use client';

import { useCallback } from 'react';
import {
  Quiz,
  Topic,
  createAdminQuiz as createQuiz,
  deleteQuiz,
} from '@/services';
import ContentManagement from './ContentManagementSimple';
import { Column, CardField } from '@/components/admin/ui';
import Link from 'next/link';

interface QuizManagementProps {
  quizzes: Quiz[];
  topics: Topic[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  refreshQuizzes: () => Promise<void>;
}

export default function QuizManagement({
  quizzes,
  topics,
  loading,
  setLoading,
  setError,
  setSuccessMessage,
  refreshQuizzes,
}: QuizManagementProps) {
  // Function to get topic title by ID
  const getTopicTitle = useCallback(
    (topicId: string) => {
      const topic = topics.find((t) => t.id === topicId);
      return topic ? topic.name : 'Unknown Topic';
    },
    [topics]
  );

  // Define columns for data table
  const columns: Column<Quiz>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (quiz: Quiz) => (
        <div className="text-sm font-medium text-strong">{quiz.name}</div>
      ),
    },
    {
      key: 'topic',
      header: 'Topic',
      render: (quiz: Quiz) => (
        <div className="text-sm text-soft">{getTopicTitle(quiz.topic_id)}</div>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (quiz: Quiz) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            quiz.difficulty_level === 'easy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : quiz.difficulty_level === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {quiz.difficulty_level || 'Medium'}
        </span>
      ),
    },
    {
      key: 'questions',
      header: 'Questions',
      render: (quiz: Quiz) => (
        <div className="text-sm text-soft">{quiz.question_count || 0}</div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (quiz: Quiz) => (
        <div className="flex space-x-2">
          <Link
            href={`/admin/quizzes/${quiz.id}/questions`}
            className="text-brand hover:text-brand text-sm"
          >
            Edit Questions
          </Link>
        </div>
      ),
    },
  ];

  // Define card fields for mobile view
  const cardFields: CardField<Quiz>[] = [
    {
      key: 'name',
      label: 'Name',
      isHeader: true,
      render: (quiz: Quiz) => (
        <div className="text-base font-medium text-strong">{quiz.name}</div>
      ),
    },
    {
      key: 'topic',
      label: 'Topic',
      render: (quiz: Quiz) => (
        <div className="text-sm text-strong">
          {getTopicTitle(quiz.topic_id)}
        </div>
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      render: (quiz: Quiz) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            quiz.difficulty_level === 'easy'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : quiz.difficulty_level === 'medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {quiz.difficulty_level || 'Medium'}
        </span>
      ),
    },
    {
      key: 'questions',
      label: 'Questions',
      render: (quiz: Quiz) => (
        <div className="text-sm text-strong">{quiz.question_count || 0}</div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (quiz: Quiz) => (
        <div className="mt-2">
          <Link
            href={`/admin/quizzes/${quiz.id}/questions`}
            className="text-brand hover:text-brand text-sm"
          >
            Edit Questions
          </Link>
        </div>
      ),
    },
  ];

  // Initial form state
  const initialFormState = {
    name: '',
    topic_id: '',
    difficulty_level: 'medium',
    time_limit_seconds: 300,
    passing_score: 70,
  };

  // Form renderer with topic dependencies
  const renderQuizForm = (
    formState: Record<string, unknown>,
    setFormState: (state: Record<string, unknown>) => void,
    loading: boolean
  ) => (
    <>
      <div className="mb-3">
        <label
          htmlFor="quiz-name"
          className="block text-sm font-medium text-soft mb-1"
        >
          Quiz Name
        </label>
        <input
          id="quiz-name"
          type="text"
          value={String(formState.name || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter quiz name"
          disabled={loading}
          required
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="quiz-topic"
          className="block text-sm font-medium text-soft mb-1"
        >
          Topic
        </label>
        <select
          id="quiz-topic"
          value={String(formState.topic_id || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              topic_id: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
          required
        >
          <option value="">Select a Topic</option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label
          htmlFor="quiz-difficulty"
          className="block text-sm font-medium text-soft mb-1"
        >
          Difficulty Level
        </label>
        <select
          id="quiz-difficulty"
          value={String(formState.difficulty_level || 'medium')}
          onChange={(e) =>
            setFormState({
              ...formState,
              difficulty_level: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div className="mb-3">
        <label
          htmlFor="quiz-time-limit"
          className="block text-sm font-medium text-soft mb-1"
        >
          Time Limit (seconds)
        </label>
        <input
          id="quiz-time-limit"
          type="number"
          value={Number(formState.time_limit_seconds || 300)}
          onChange={(e) =>
            setFormState({
              ...formState,
              time_limit_seconds: parseInt(e.target.value) || 300,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          min="60"
          max="3600"
          disabled={loading}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="quiz-passing-score"
          className="block text-sm font-medium text-soft mb-1"
        >
          Passing Score (%)
        </label>
        <input
          id="quiz-passing-score"
          type="number"
          value={Number(formState.passing_score || 70)}
          onChange={(e) =>
            setFormState({
              ...formState,
              passing_score: parseInt(e.target.value) || 70,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          min="1"
          max="100"
          disabled={loading}
        />
      </div>
    </>
  );
  // Adapter function to match the expected interface for createItem
  const createItemAdapter = async (
    item: Record<string, unknown>
  ): Promise<{ id: string | null; error: Error | null }> => {
    // Validate topic selection
    if (!item.topic_id) {
      return { id: null, error: new Error('Please select a topic') };
    }

    // Convert the generic item to the shape expected by createQuiz
    const result = await createQuiz({
      name: String(item.name || ''),
      topic_id: String(item.topic_id),
      difficulty_level: String(item.difficulty_level || 'medium') as
        'easy' | 'medium' | 'hard',
      time_limit_seconds: Number(item.time_limit_seconds || 300),
      passing_score: Number(item.passing_score || 70),
    });

    // Convert the result to match ContentManagement interface
    if (result.error) {
      return { id: null, error: new Error(result.error.message) };
    }

    return { id: result.id || null, error: null };
  };

  // Adapter function for deleteQuiz to match expected interface
  const deleteItemAdapter = async (
    id: string
  ): Promise<{ success: boolean; error: Error | null }> => {
    const result = await deleteQuiz(id);

    if (result.error) {
      return { success: false, error: new Error(result.error.message) };
    }

    return { success: true, error: null };
  };
  return (
    <ContentManagement<Quiz>
      // Core data
      items={quizzes}
      entityName="Quiz"
      entityNamePlural="Quizzes"
      // UI Configuration
      columns={columns}
      cardFields={cardFields}
      // State management
      loading={loading}
      setLoading={setLoading}
      setError={setError}
      setSuccessMessage={setSuccessMessage} // Actions
      refreshItems={refreshQuizzes}
      createItem={createItemAdapter}
      deleteItem={deleteItemAdapter}
      // Form handling
      initialFormState={initialFormState}
      renderForm={renderQuizForm}
      // Search functionality
      searchField="name"
      // Base route for edit pages (for future use)
      baseRoute="/admin/quizzes"
      // Disable creation since quizzes should be created through quiz builder
      disableCreation={true}
    />
  );
}
