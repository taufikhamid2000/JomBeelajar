'use client';
// Import dynamic config to optimize build
import './config';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';
import {
  getQuestionAuditComments,
  getAnswerAuditComments,
  addQuestionAuditComment,
  addAnswerAuditComment,
} from '@/services/auditService';
import {
  QuestionAuditComment,
  AnswerAuditComment,
  AuditCommentInput,
} from '@/types/audit';

type QuestionType = 'radio' | 'checkbox';

interface QuestionAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
  order_index?: number;
}

interface Question {
  id: string;
  text: string;
  type: QuestionType;
  answers: QuestionAnswer[];
  order_index?: number;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  subject_name: string;
  topic_name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  passing_score: number;
  question_count: number;
  verified: boolean;
  created_at: string;
}

export default function AdminQuizQuestionsPage() {
  const { quizId } = useParams() as { quizId: string };

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionComments, setQuestionComments] = useState<
    Record<string, QuestionAuditComment[]>
  >({});
  const [answerComments, setAnswerComments] = useState<
    Record<string, AnswerAuditComment[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCommentForm, setShowCommentForm] = useState<{
    type: 'question' | 'answer';
    id: string;
  } | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<
    'suggestion' | 'issue' | 'approved' | 'rejected'
  >('suggestion');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    async function fetchQuizData() {
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
        }

        // Format quiz data
        const formattedQuiz: QuizData = {
          id: quizData.id,
          title: quizData.name,
          description: quizData.description,
          subject_name: quizData.topics?.chapters?.subjects?.name,
          topic_name: quizData.topics?.name,
          difficulty: quizData.difficulty,
          time_limit: quizData.time_limit,
          passing_score: quizData.passing_score,
          question_count: quizData.question_count || 0,
          verified: quizData.verified || false,
          created_at: quizData.created_at,
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
            type: q.type as QuestionType,
            order_index: q.order_index,
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
                      order_index: a.order_index,
                    })
                  )
                  .sort(
                    (a: QuestionAnswer, b: QuestionAnswer) =>
                      (a.order_index || 0) - (b.order_index || 0)
                  )
              : [],
          }));

          setQuestions(formattedQuestions);

          // Fetch audit comments for all questions and answers
          await fetchAuditComments(formattedQuestions);
        }
      } catch (error) {
        logger.error('Error fetching quiz data:', error);
        setError('Failed to load quiz data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    async function fetchAuditComments(questions: Question[]) {
      try {
        const questionCommentsMap: Record<string, QuestionAuditComment[]> = {};
        const answerCommentsMap: Record<string, AnswerAuditComment[]> = {};

        // Fetch comments for all questions
        for (const question of questions) {
          const comments = await getQuestionAuditComments(question.id);
          questionCommentsMap[question.id] = comments;

          // Fetch comments for all answers in this question
          for (const answer of question.answers) {
            const answerComments = await getAnswerAuditComments(answer.id);
            answerCommentsMap[answer.id] = answerComments;
          }
        }

        setQuestionComments(questionCommentsMap);
        setAnswerComments(answerCommentsMap);
      } catch (error) {
        logger.error('Error fetching audit comments:', error);
      }
    }

    fetchQuizData();
  }, [quizId]);

  async function handleAddComment() {
    if (!showCommentForm || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const commentInput: AuditCommentInput = {
        comment_text: commentText.trim(),
        comment_type: commentType,
      };

      if (showCommentForm.type === 'question') {
        await addQuestionAuditComment(showCommentForm.id, commentInput);
        // Refresh question comments
        const updatedComments = await getQuestionAuditComments(
          showCommentForm.id
        );
        setQuestionComments((prev) => ({
          ...prev,
          [showCommentForm.id]: updatedComments,
        }));
      } else {
        await addAnswerAuditComment(showCommentForm.id, commentInput);
        // Refresh answer comments
        const updatedComments = await getAnswerAuditComments(
          showCommentForm.id
        );
        setAnswerComments((prev) => ({
          ...prev,
          [showCommentForm.id]: updatedComments,
        }));
      }

      setSuccess('Comment added successfully');
      setShowCommentForm(null);
      setCommentText('');
      setCommentType('suggestion');
    } catch (error) {
      logger.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  }

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'issue':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div>
                <Link
                  href="/admin/quizzes"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center"
                >
                  ← Back to Quizzes
                </Link>
                <h1 className="text-3xl font-bold text-white dark:text-gray-900">
                  {quiz?.title || 'Quiz'}: Questions Audit
                </h1>
                <div className="text-gray-400 dark:text-gray-500 mt-1">
                  {quiz?.subject_name} / {quiz?.topic_name}
                </div>
                <div className="mt-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      quiz?.verified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {quiz?.verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              <div>
                <Link
                  href={`/admin/quizzes/${quizId}/preview`}
                  className="bg-blue-500 text-white py-2 px-4 rounded mr-2 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Preview Quiz
                </Link>
                <Link
                  href={`/admin/quizzes/${quizId}/audit`}
                  className="bg-gray-200 text-gray-800 py-2 px-4 rounded mr-2 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Quiz Audit
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex">
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
                  Questions Audit Mode
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <p>
                    This page is now in audit mode. Questions and answers are
                    displayed as read-only. Use the comment system to provide
                    feedback for quiz verification.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          <div className="bg-gray-800 dark:bg-white rounded-lg shadow mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-300 dark:text-gray-700">
                  Difficulty
                </p>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      quiz?.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : quiz?.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {quiz?.difficulty
                      ? quiz.difficulty.charAt(0).toUpperCase() +
                        quiz.difficulty.slice(1)
                      : 'Medium'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 dark:text-gray-700">
                  Time Limit
                </p>
                <p className="mt-1 text-white dark:text-gray-900">
                  {Math.floor((quiz?.time_limit || 0) / 60)} minutes{' '}
                  {(quiz?.time_limit || 0) % 60} seconds
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-300 dark:text-gray-700">
                  Passing Score
                </p>
                <p className="mt-1 text-white dark:text-gray-900">
                  {quiz?.passing_score || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-white dark:text-gray-900">
                Questions for Review
              </h2>

              {questions.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-400 dark:text-gray-500">
                    No questions found for this quiz.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {questions.map((question, qIndex) => (
                    <div
                      key={question.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-5 bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-medium text-white dark:text-gray-900">
                          Question {qIndex + 1}
                        </h3>
                        <button
                          onClick={() =>
                            setShowCommentForm({
                              type: 'question',
                              id: question.id,
                            })
                          }
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                        >
                          Add Comment
                        </button>
                      </div>

                      <div className="mb-4">
                        <p className="text-white dark:text-gray-900 font-medium mb-2">
                          {question.text}
                        </p>
                        <div className="text-sm text-gray-400 dark:text-gray-500">
                          Type:{' '}
                          {question.type === 'radio'
                            ? 'Single Choice'
                            : 'Multiple Choice'}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                          Answers:
                        </h4>{' '}
                        <div className="space-y-2">
                          {question.answers.map((answer) => (
                            <div
                              key={answer.id}
                              className="flex items-center justify-between p-3 bg-gray-800 dark:bg-white rounded border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center">
                                <div className="flex-shrink-0 mr-3">
                                  {question.type === 'radio' ? (
                                    <div
                                      className={`w-4 h-4 rounded-full border-2 ${
                                        answer.isCorrect
                                          ? 'bg-green-500 border-green-500'
                                          : 'border-gray-600 dark:border-gray-300'
                                      }`}
                                    >
                                      {answer.isCorrect && (
                                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                      )}
                                    </div>
                                  ) : (
                                    <div
                                      className={`w-4 h-4 rounded border-2 ${
                                        answer.isCorrect
                                          ? 'bg-green-500 border-green-500'
                                          : 'border-gray-600 dark:border-gray-300'
                                      }`}
                                    >
                                      {answer.isCorrect && (
                                        <svg
                                          className="w-3 h-3 text-white"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`${answer.isCorrect ? 'font-medium text-green-700 dark:text-green-300' : 'text-gray-300 dark:text-gray-700'}`}
                                >
                                  {answer.text}
                                </span>
                                {answer.isCorrect && (
                                  <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                    Correct
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  setShowCommentForm({
                                    type: 'answer',
                                    id: answer.id,
                                  })
                                }
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                              >
                                Comment
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Question Comments */}
                      {questionComments[question.id] &&
                        questionComments[question.id].length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                              Question Comments:
                            </h4>{' '}
                            <div className="space-y-2">
                              {questionComments[question.id].map((comment) => (
                                <div
                                  key={comment.id}
                                  className="bg-gray-800 dark:bg-white p-3 rounded border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${getCommentTypeColor(comment.comment_type)}`}
                                    >
                                      {comment.comment_type}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      {new Date(
                                        comment.created_at
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-300 dark:text-gray-700 mt-2">
                                    {comment.comment_text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Answer Comments */}
                      {question.answers.some(
                        (answer) =>
                          answerComments[answer.id] &&
                          answerComments[answer.id].length > 0
                      ) && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                            Answer Comments:
                          </h4>{' '}
                          <div className="space-y-3">
                            {question.answers.map(
                              (answer, answerIndex) =>
                                answerComments[answer.id] &&
                                answerComments[answer.id].length > 0 && (
                                  <div key={answer.id}>
                                    {' '}
                                    <p className="text-sm font-medium text-gray-400 dark:text-gray-600 mb-1">
                                      Answer {answerIndex + 1}: &ldquo;
                                      {answer.text}&rdquo;
                                    </p>
                                    <div className="space-y-2 ml-4">
                                      {answerComments[answer.id].map(
                                        (comment) => (
                                          <div
                                            key={comment.id}
                                            className="bg-gray-800 dark:bg-white p-3 rounded border border-gray-200 dark:border-gray-600"
                                          >
                                            <div className="flex justify-between items-start mb-1">
                                              <span
                                                className={`text-xs px-2 py-1 rounded ${getCommentTypeColor(comment.comment_type)}`}
                                              >
                                                {comment.comment_type}
                                              </span>
                                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {new Date(
                                                  comment.created_at
                                                ).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-300 dark:text-gray-700 mt-2">
                                              {comment.comment_text}
                                            </p>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comment Form Modal */}
          {showCommentForm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-gray-800 dark:bg-white">
                <div className="mt-3">
                  <h3 className="text-lg font-medium text-white dark:text-gray-900 mb-4">
                    Add{' '}
                    {showCommentForm.type === 'question'
                      ? 'Question'
                      : 'Answer'}{' '}
                    Comment
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                      Comment Type
                    </label>
                    <select
                      value={commentType}
                      onChange={(e) =>
                        setCommentType(
                          e.target.value as
                            | 'suggestion'
                            | 'issue'
                            | 'approved'
                            | 'rejected'
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="suggestion">Suggestion</option>
                      <option value="issue">Issue</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2">
                      Comment
                    </label>
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter your comment..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCommentForm(null);
                        setCommentText('');
                        setCommentType('suggestion');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddComment}
                      disabled={submittingComment || !commentText.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Adding...' : 'Add Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
