'use client';
// Import dynamic config to optimize build
import './config';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';

interface QuestionAnswer {
  id?: string;
  text: string;
  isCorrect: boolean;
  order_index?: number;
}

interface Question {
  id?: string;
  text: string;
  type: 'radio' | 'checkbox';
  answers: QuestionAnswer[];
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  subject_name: string;
  topic_name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number; // in seconds
  passing_score: number; // percentage
  question_count: number;
}

export default function AdminQuizPreviewPage() {
  const router = useRouter();
  const { quizId } = useParams() as { quizId: string };

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string[]>
  >({});
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(
            `
            *,          topics(
              name,
              chapters(
                subjects(name)
              )
            )
          `
          )
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;

        if (!quizData) {
          setError('Quiz not found');
          return;
        } // Format quiz data
        const formattedQuiz: QuizData = {
          id: quizData.id,
          title: quizData.name, // quizzes table has 'name' column
          description: quizData.description,
          subject_name: quizData.topics?.chapters?.subjects?.name,
          topic_name: quizData.topics?.name, // topics table has 'name' column
          difficulty: quizData.difficulty,
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score,
          question_count: quizData.question_count || 0,
        };

        setQuiz(formattedQuiz);

        // Fetch quiz questions and answers
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*, answers(*)')
          .eq('quiz_id', quizId)
          .order('order_index', { ascending: true });

        if (questionsError) throw questionsError;

        if (questionsData && questionsData.length > 0) {
          // Transform questions data to our format
          const formattedQuestions: Question[] = questionsData.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            answers: q.answers
              ? q.answers
                  .map(
                    (a: {
                      id: string;
                      text: string;
                      is_correct: boolean;
                      order_index?: number;
                    }) => ({
                      id: a.id,
                      text: a.text,
                      isCorrect: a.is_correct,
                    })
                  )
                  .sort(
                    (a: QuestionAnswer, b: QuestionAnswer) =>
                      (a.order_index || 0) - (b.order_index || 0)
                  )
              : [],
          }));

          setQuestions(formattedQuestions);
        }
      } catch (error) {
        logger.error('Error fetching quiz data:', error);
        setError('Failed to load quiz data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId]);

  function handleAnswerSelect(questionId: string, answerId: string) {
    const question = questions.find((q) => q.id === questionId);

    if (!question) return;

    if (question.type === 'radio') {
      // For radio buttons (single choice), replace any existing selection
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: [answerId],
      });
    } else {
      // For checkboxes (multiple choice), toggle selection
      const currentAnswers = selectedAnswers[questionId] || [];

      if (currentAnswers.includes(answerId)) {
        setSelectedAnswers({
          ...selectedAnswers,
          [questionId]: currentAnswers.filter((id) => id !== answerId),
        });
      } else {
        setSelectedAnswers({
          ...selectedAnswers,
          [questionId]: [...currentAnswers, answerId],
        });
      }
    }
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
            <div className="text-center">
              <button
                onClick={() => router.push('/admin/quizzes')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded"
              >
                Back to Quizzes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="flex">
          <AdminNavigation />
          <div className="flex-1 p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Link
                  href={`/admin/quizzes/${quizId}/questions`}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center"
                >
                  ← Back to Questions
                </Link>
                <h1 className="text-3xl font-bold text-white dark:text-gray-900">
                  {quiz?.title || 'Quiz'}: Preview
                </h1>
              </div>
            </div>

            <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
              <div className="text-center py-10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="mt-2 text-lg font-medium text-white dark:text-gray-900">
                  No questions added yet
                </h2>
                <p className="mt-1 text-gray-400 dark:text-gray-500">
                  {' '}
                  This quiz doesn&apos;t have any questions. Add some questions
                  before previewing.
                </p>
                <div className="mt-6">
                  <Link
                    href={`/admin/quizzes/${quizId}/questions`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded"
                  >
                    Add Questions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              {' '}
              <Link
                href={`/admin/quizzes/${quizId}/questions`}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center"
              >
                ← Back to Questions
              </Link>
              <h1 className="text-3xl font-bold text-white dark:text-gray-900">
                {quiz?.title || 'Quiz'}: Preview
              </h1>
              <div className="text-gray-400 dark:text-gray-500 mt-1">
                {quiz?.subject_name} / {quiz?.topic_name}
              </div>
            </div>
            <div>
              <Link
                href={`/admin/quizzes/${quizId}/questions`}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Manage Questions
              </Link>
            </div>
            <div>
              <Link
                href={`/admin/quizzes/${quizId}/questions`}
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Manage Questions
              </Link>
            </div>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                      (quiz?.difficulty || 'medium') === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : (quiz?.difficulty || 'medium') === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {quiz?.difficulty
                      ? quiz.difficulty.charAt(0).toUpperCase() +
                        quiz.difficulty.slice(1)
                      : 'Medium'}
                  </span>
                  <span className="ml-2 text-gray-400 dark:text-gray-500 text-sm">
                    {Math.floor((quiz?.time_limit || 0) / 60)} min{' '}
                    {(quiz?.time_limit || 0) % 60} sec
                  </span>
                </div>{' '}
                <div className="text-sm font-medium text-white dark:text-gray-900">
                  Question {currentQuestionIndex + 1} of{' '}
                  {questions?.length || 0}
                </div>
              </div>{' '}
              <div className="mb-8">
                <h2 className="text-xl font-medium mb-4 text-white dark:text-gray-900">
                  {currentQuestion?.text}
                </h2>

                <div className="space-y-3">
                  {currentQuestion?.answers.map((answer) => (
                    <div key={answer.id} className="flex items-start">
                      {currentQuestion.type === 'radio' ? (
                        <input
                          type="radio"
                          id={`answer-${answer.id}`}
                          name={`question-${currentQuestion.id}`}
                          checked={selectedAnswers[
                            currentQuestion.id as string
                          ]?.includes(answer.id as string)}
                          onChange={() =>
                            handleAnswerSelect(
                              currentQuestion.id as string,
                              answer.id as string
                            )
                          }
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          id={`answer-${answer.id}`}
                          checked={selectedAnswers[
                            currentQuestion.id as string
                          ]?.includes(answer.id as string)}
                          onChange={() =>
                            handleAnswerSelect(
                              currentQuestion.id as string,
                              answer.id as string
                            )
                          }
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                        />
                      )}
                      <label
                        htmlFor={`answer-${answer.id}`}
                        className="ml-3 text-gray-300 dark:text-gray-700"
                      >
                        {answer.text}
                      </label>

                      {/* Show correct/incorrect indicators for admin preview */}
                      <span className="ml-2">
                        {answer.isCorrect ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                {' '}
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2 rounded ${
                    currentQuestionIndex === 0
                      ? 'bg-gray-700 dark:bg-gray-200 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-700 dark:bg-gray-200 text-gray-200 dark:text-gray-800 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className={`px-4 py-2 rounded ${
                    currentQuestionIndex === questions.length - 1
                      ? 'bg-gray-700 dark:bg-gray-200 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Preview Mode Notice
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              You are viewing this quiz in admin preview mode. Correct answers
              are marked for your review. Students taking this quiz will not see
              which answers are correct until after submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
