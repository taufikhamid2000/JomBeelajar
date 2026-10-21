'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  getQuizAuditComments,
  addQuizAuditComment,
  updateQuizVerification,
  getQuizVerificationHistory,
} from '@/services/auditService';
import { QuizAuditComment, QuizVerificationLog } from '@/types/audit';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  subject_id: string;
  topic_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  passing_score: number;
  verified: boolean;
  created_by: string;
  created_at: string;
  subject?: { name: string };
  topic?: { name: string };
}

export default function QuizAuditPage() {
  const params = useParams<{ quizId: string }>();
  const quizId = params?.quizId || '';

  // Quiz data
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Audit data
  const [auditComments, setAuditComments] = useState<QuizAuditComment[]>([]);
  const [verificationLog, setVerificationLog] = useState<QuizVerificationLog[]>(
    []
  );

  // Comment form
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<
    'suggestion' | 'issue' | 'approved' | 'rejected'
  >('suggestion');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Verification actions
  const [verifyingQuiz, setVerifyingQuiz] = useState(false);
  const [verificationReason, setVerificationReason] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationAction, setVerificationAction] = useState<
    'verify' | 'unverify'
  >('verify');

  // Bumped after a verification change to re-run the fetch effect.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        // Fetch quiz with related data
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select(
            `
            *,
            topics!inner(
              name,
              chapters!inner(
                subjects!inner(name)
              )
            )
          `
          )
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        if (!quizData) throw new Error('Quiz not found');

        // Transform the nested data to match our Quiz interface
        const transformedQuiz = {
          ...quizData,
          topic: { name: quizData.topics?.name },
          subject: { name: quizData.topics?.chapters?.subjects?.name },
        };

        setQuiz(transformedQuiz);

        // Fetch audit comments
        const comments = await getQuizAuditComments(quizId);
        setAuditComments(comments); // Fetch verification log
        const logs = await getQuizVerificationHistory(quizId);
        setVerificationLog(logs);
      } catch (error) {
        logger.error('Error fetching quiz data:', error);
        setError('Failed to load quiz data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuizData();
  }, [quizId, reloadKey]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await addQuizAuditComment(quizId, {
        comment_text: newComment.trim(),
        comment_type: commentType,
      });

      setNewComment('');
      setCommentType('suggestion');

      // Refresh comments
      const comments = await getQuizAuditComments(quizId);
      setAuditComments(comments);
    } catch (error) {
      logger.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVerificationAction = async () => {
    if (!quiz) return;

    try {
      setVerifyingQuiz(true);
      const result = await updateQuizVerification(quizId, {
        action: verificationAction,
        reason: verificationReason.trim() || undefined,
      });

      if (result.success) {
        setShowVerificationModal(false);
        setVerificationReason('');

        // Refresh quiz data and logs
        setLoading(true);
        setError('');
        setReloadKey((k) => k + 1);
      }
    } catch (error) {
      logger.error('Error updating verification:', error);
      setError(`Failed to ${verificationAction} quiz. Please try again.`);
    } finally {
      setVerifyingQuiz(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'issue':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const unresolvedCommentsCount = auditComments.filter(
    (c) => !c.is_resolved
  ).length;

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link
                href="/admin/quizzes"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2 inline-flex items-center"
              >
                ← Back to Quizzes
              </Link>
              <h1 className="text-3xl font-bold text-white dark:text-gray-900">
                Quiz Audit & Review
              </h1>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/quizzes/${quizId}/questions`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Review Questions
              </Link>
              <Link
                href={`/admin/quizzes/${quizId}/preview`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Preview Quiz
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 dark:bg-red-900 dark:border-red-700 dark:text-red-200">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden p-6">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          ) : quiz ? (
            <div className="space-y-6">
              {/* Quiz Information */}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white dark:text-gray-900">
                    Quiz Information
                  </h2>
                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        quiz.verified
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {quiz.verified ? 'Verified' : 'Unverified'}
                    </span>
                    {unresolvedCommentsCount > 0 && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {unresolvedCommentsCount} Unresolved Issues
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Title
                      </label>
                      <p className="text-white dark:text-gray-900 font-medium">
                        {quiz.title}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Subject
                      </label>
                      <p className="text-white dark:text-gray-900">
                        {quiz.subject?.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Topic
                      </label>
                      <p className="text-white dark:text-gray-900">
                        {quiz.topic?.name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Difficulty
                      </label>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          quiz.difficulty === 'easy'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : quiz.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}
                      >
                        {quiz.difficulty}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Time Limit
                      </label>
                      <p className="text-white dark:text-gray-900">
                        {Math.floor(quiz.time_limit / 60)} minutes
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Passing Score
                      </label>
                      <p className="text-white dark:text-gray-900">
                        {quiz.passing_score}%
                      </p>
                    </div>
                  </div>
                  {quiz.description && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-1">
                        Description
                      </label>
                      <p className="text-white dark:text-gray-900">
                        {quiz.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Actions */}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200">
                  <h2 className="text-xl font-semibold text-white dark:text-gray-900">
                    Verification Actions
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setVerificationAction('verify');
                        setShowVerificationModal(true);
                      }}
                      disabled={quiz.verified}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {quiz.verified ? 'Already Verified' : 'Verify Quiz'}
                    </button>
                    {quiz.verified && (
                      <button
                        onClick={() => {
                          setVerificationAction('unverify');
                          setShowVerificationModal(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        Unverify Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Comment */}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200">
                  <h2 className="text-xl font-semibold text-white dark:text-gray-900">
                    Add Audit Comment
                  </h2>
                </div>
                <form onSubmit={handleAddComment} className="p-6 space-y-4">
                  <div>
                    <label
                      htmlFor="comment-type"
                      className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2"
                    >
                      Comment Type
                    </label>
                    <select
                      id="comment-type"
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
                      className="block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="suggestion">Suggestion</option>
                      <option value="issue">Issue</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="comment-text"
                      className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2"
                    >
                      Comment
                    </label>
                    <textarea
                      id="comment-text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={4}
                      className="block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your feedback or comments..."
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Adding...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Audit Comments */}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200">
                  <h2 className="text-xl font-semibold text-white dark:text-gray-900">
                    Audit Comments ({auditComments.length})
                  </h2>
                </div>
                <div className="p-6">
                  {auditComments.length === 0 ? (
                    <p className="text-gray-400 dark:text-gray-500 text-center py-8">
                      No audit comments yet. Add the first comment above.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {auditComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${getCommentTypeColor(comment.comment_type)}`}
                              >
                                {comment.comment_type}
                              </span>
                              {comment.is_resolved && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-white dark:text-gray-900 mb-2">
                            {comment.comment_text}
                          </p>{' '}
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            By:{' '}
                            {comment.admin_user?.user_metadata?.full_name ||
                              comment.admin_user?.email ||
                              `Admin (${comment.admin_user_id.slice(0, 8)}...)`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Log */}
              {verificationLog.length > 0 && (
                <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200">
                    <h2 className="text-xl font-semibold text-white dark:text-gray-900">
                      Verification History
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {verificationLog.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                log.action === 'verified'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : log.action === 'unverified'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}
                            >
                              {log.action}
                            </span>
                            {log.reason && (
                              <span className="ml-2 text-sm text-gray-300 dark:text-gray-600">
                                - {log.reason}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-gray-400 dark:text-gray-500">
                            {formatDate(log.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden p-6">
              <p className="text-center text-gray-400 dark:text-gray-500">
                Quiz not found.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-200">
              <h3 className="text-lg font-semibold text-white dark:text-gray-900">
                {verificationAction === 'verify'
                  ? 'Verify Quiz'
                  : 'Unverify Quiz'}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-300 dark:text-gray-700 mb-4">
                {verificationAction === 'verify'
                  ? 'Are you sure you want to verify this quiz? This will make it available to students.'
                  : 'Are you sure you want to unverify this quiz? This will make it unavailable to students.'}
              </p>
              <div className="mb-4">
                <label
                  htmlFor="verification-reason"
                  className="block text-sm font-medium text-gray-300 dark:text-gray-700 mb-2"
                >
                  Reason (optional)
                </label>
                <textarea
                  id="verification-reason"
                  value={verificationReason}
                  onChange={(e) => setVerificationReason(e.target.value)}
                  rows={3}
                  className="block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reason for verification change..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="px-4 py-2 border border-gray-600 dark:border-gray-300 rounded-md text-gray-300 dark:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerificationAction}
                  disabled={verifyingQuiz}
                  className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    verificationAction === 'verify'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {verifyingQuiz
                    ? 'Processing...'
                    : verificationAction === 'verify'
                      ? 'Verify'
                      : 'Unverify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
