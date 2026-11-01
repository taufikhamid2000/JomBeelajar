'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Type definitions
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

interface QuestionsAggregate {
  count: number;
}

// The shape of the quiz response from Supabase
interface QuizResponseData {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_feedback: string | null;
  topic_id: string;
  topic?: {
    name: string;
    chapter?: {
      name: string;
      subject?: {
        name: string;
      };
    };
  };
  questions?: QuestionsAggregate[];
}

// Our processed quiz object
interface Quiz {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  verification_feedback: string | null;
  topic_id: string;
  question_count: number;
  creator?: Creator;
  verifier?: Creator;
  topic?: Topic;
}

interface UserProfile {
  id: string;
  display_name: string;
}

export default function AllQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>(
    'all'
  );

  // Load all quizzes
  useEffect(() => {
    async function fetchAllQuizzes() {
      try {
        setLoading(true);

        // Create a query based on the filter
        let query = supabase
          .from('quizzes')
          .select(
            `
            id, name, created_by, created_at, 
            verified, verified_by, verified_at, verification_feedback,
            topic_id,
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
          .order('created_at', { ascending: false });

        // Apply filter if needed
        if (filter === 'verified') {
          query = query.eq('verified', true);
        } else if (filter === 'unverified') {
          query = query.eq('verified', false);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Error fetching quizzes:', error);
          setError('Failed to load quizzes');
          return;
        } // Process the quiz data
        const processedQuizzes: Quiz[] = (
          data as unknown as QuizResponseData[]
        ).map((quiz) => ({
          id: quiz.id,
          name: quiz.name,
          created_by: quiz.created_by,
          created_at: quiz.created_at,
          verified: quiz.verified,
          verified_at: quiz.verified_at,
          verified_by: quiz.verified_by,
          verification_feedback: quiz.verification_feedback,
          topic_id: quiz.topic_id,
          question_count: quiz.questions?.[0]?.count || 0,
          // Format the topic structure
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
        }));

        // Get unique user IDs for creators and verifiers
        const userIds = [
          ...new Set([
            ...processedQuizzes.map((q) => q.created_by),
            ...processedQuizzes
              .map((q) => q.verified_by)
              .filter((id): id is string => id !== null),
          ]),
        ];

        // Fetch user profiles for creators and verifiers
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, display_name')
            .in('id', userIds);

          if (profiles) {
            const profileMap: Record<string, Creator> = {};

            (profiles as UserProfile[]).forEach((profile) => {
              profileMap[profile.id] = {
                display_name: profile.display_name || 'Unknown User',
              };
            });

            // Add creator and verifier info to each quiz
            processedQuizzes.forEach((quiz) => {
              quiz.creator = profileMap[quiz.created_by];
              if (quiz.verified_by) {
                quiz.verifier = profileMap[quiz.verified_by];
              }
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

    fetchAllQuizzes();
  }, [filter]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Handle filter change
  const handleFilterChange = (newFilter: 'all' | 'verified' | 'unverified') => {
    setFilter(newFilter);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Quizzes</h1>

        <div className="flex space-x-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1 rounded ${
              filter === 'all'
                ? 'bg-[var(--band-via)] text-white'
                : 'bg-muted text-strong'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('verified')}
            className={`px-3 py-1 rounded ${
              filter === 'verified'
                ? 'bg-green-500 text-white'
                : 'bg-muted text-strong'
            }`}
          >
            Verified
          </button>
          <button
            onClick={() => handleFilterChange('unverified')}
            className={`px-3 py-1 rounded ${
              filter === 'unverified'
                ? 'bg-red-500 text-white'
                : 'bg-muted text-strong'
            }`}
          >
            Unverified
          </button>
        </div>
      </div>

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
          <p className="text-soft">No quizzes found!</p>
        </div>
      ) : (
        <div className="bg-surface shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-2">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Quiz Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Topic/Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Verified By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-strong">
                      {quiz.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      <div>{quiz.topic?.name || 'Unknown Topic'}</div>
                      <div className="text-xs text-soft">
                        {quiz.topic?.chapter?.subject?.name ||
                          'Unknown Subject'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {quiz.creator?.display_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {formatDate(quiz.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          quiz.verified
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {quiz.verified ? 'Verified' : 'Unverified'}
                      </span>
                      {quiz.verification_feedback && (
                        <span
                          className="ml-2 cursor-pointer text-brand"
                          title={quiz.verification_feedback}
                        >
                          ℹ️
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {quiz.verifier?.display_name || 'Not Verified'}
                      {quiz.verified_at && (
                        <div className="text-xs text-soft">
                          {formatDate(quiz.verified_at)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {quiz.question_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
