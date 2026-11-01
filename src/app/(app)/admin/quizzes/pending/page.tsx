'use client';

import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

// Improved types for better type safety
interface Creator {
  display_name: string;
}

interface Subject {
  name: string;
}

interface Chapter {
  name: string;
  subject?: Subject;
}

interface Topic {
  name: string;
  chapter?: Chapter;
}

interface Quiz {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  verified: boolean;
  topic_id: string;
  question_count: number;
  creator?: Creator;
  topic?: Topic;
}

interface QuestionCount {
  count: number;
}

interface QuizResponse {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  verified: boolean;
  topic_id: string;
  topic?: Topic;
  questions?: QuestionCount[];
}

interface UserProfile {
  id: string;
  display_name: string;
}

export default function PendingQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pending quizzes
  useEffect(() => {
    async function fetchPendingQuizzes() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from('quizzes')
          .select(
            `
            id, name, created_by, created_at, verified, topic_id,
            topic:topic_id (
              name, 
              chapter:chapter_id (
                name, 
                subject:subject_id (
                  name
                )
              )
            ),
            questions:questions(count)
          `
          )
          .eq('verified', false)
          .order('created_at', { ascending: false });

        if (error) {
          logger.error('Error fetching pending quizzes:', error);
          setError('Failed to load pending quizzes');
          return;
        } // Process the quiz data with proper type safety
        const processedQuizzes: Quiz[] = (
          data as unknown as QuizResponse[]
        ).map((quiz) => {
          return {
            id: quiz.id,
            name: quiz.name,
            created_by: quiz.created_by,
            created_at: quiz.created_at,
            verified: quiz.verified,
            topic_id: quiz.topic_id,
            question_count: quiz.questions?.[0]?.count || 0,
            // Format the topic structure correctly
            topic: quiz.topic
              ? {
                  name: quiz.topic.name,
                  chapter: quiz.topic.chapter
                    ? {
                        name: quiz.topic.chapter.name,
                        subject: quiz.topic.chapter.subject
                          ? {
                              name: quiz.topic.chapter.subject.name,
                            }
                          : undefined,
                      }
                    : undefined,
                }
              : undefined,
          };
        });

        // Fetch creator names
        const creatorIds = [
          ...new Set(processedQuizzes.map((q) => q.created_by)),
        ];

        if (creatorIds.length > 0) {
          const { data: creators } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', creatorIds);

          if (creators) {
            const creatorMap: Record<string, Creator> = {};

            (creators as UserProfile[]).forEach((c) => {
              creatorMap[c.id] = {
                display_name: c.display_name || 'Unknown User',
              };
            });

            // Add creator info to each quiz
            processedQuizzes.forEach((quiz) => {
              quiz.creator = creatorMap[quiz.created_by];
            });
          }
        }

        setQuizzes(processedQuizzes);
      } catch (err) {
        logger.error('Unexpected error loading quizzes:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPendingQuizzes();
  }, []);

  // Handle verification
  const handleVerify = async (quizId: string, verified: boolean) => {
    try {
      setSubmitting((prev) => ({ ...prev, [quizId]: true }));

      const feedbackText = feedback[quizId] || '';

      const response = await fetch('/api/admin/quizzes/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId,
          verified,
          feedback: feedbackText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      // On success, update the local state
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      setSuccessMessage(
        `Quiz ${verified ? 'approved' : 'rejected'} successfully!`
      );

      // Clear message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      logger.error('Error verifying quiz:', err);
      setError(`Failed to ${verified ? 'approve' : 'reject'} quiz`);

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setSubmitting((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Pending Quizzes for Verification
      </h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 rounded-lg">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="bg-muted p-6 rounded-lg text-center">
          <p className="text-soft">No quizzes pending verification!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-surface shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-2">{quiz.name}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-soft">
                    <strong>Subject:</strong>{' '}
                    {quiz.topic?.chapter?.subject?.name || 'Unknown'}
                  </p>
                  <p className="text-soft">
                    <strong>Chapter:</strong>{' '}
                    {quiz.topic?.chapter?.name || 'Unknown'}
                  </p>
                  <p className="text-soft">
                    <strong>Topic:</strong> {quiz.topic?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-soft">
                    <strong>Created By:</strong>{' '}
                    {quiz.creator?.display_name || 'Unknown User'}
                  </p>
                  <p className="text-soft">
                    <strong>Created:</strong>{' '}
                    {new Date(quiz.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-soft">
                    <strong>Questions:</strong> {quiz.question_count}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-soft mb-2">
                  Feedback (optional):
                </label>
                <textarea
                  className="w-full p-2 border rounded-lg bg-surface-2 text-strong"
                  rows={2}
                  placeholder="Provide feedback about this quiz..."
                  value={feedback[quiz.id] || ''}
                  onChange={(e) =>
                    setFeedback((prev) => ({
                      ...prev,
                      [quiz.id]: e.target.value,
                    }))
                  }
                ></textarea>

                <div className="flex justify-end mt-4 space-x-3">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    onClick={() => handleVerify(quiz.id, false)}
                    disabled={submitting[quiz.id]}
                  >
                    {submitting[quiz.id] ? 'Rejecting...' : 'Reject Quiz'}
                  </button>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    onClick={() => handleVerify(quiz.id, true)}
                    disabled={submitting[quiz.id]}
                  >
                    {submitting[quiz.id] ? 'Approving...' : 'Approve Quiz'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
