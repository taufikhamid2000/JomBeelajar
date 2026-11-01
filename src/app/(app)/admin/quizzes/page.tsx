'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  topic_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_count: number;
  verified: boolean;
  created_at: string;
  subject_name?: string;
  topic_name?: string;
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);

  // Bumped by the Refresh button to re-run the quiz fetch effect.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name', { ascending: true });

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        logger.error('Error fetching subjects:', error);
      }
    }

    fetchSubjects();
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        let query = supabase
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
          .order('created_at', { ascending: false }); // Apply filters
        if (subjectFilter !== 'all') {
          // Filter by subject through the relationship chain: quizzes -> topics -> chapters -> subjects
          query = query.eq('topics.chapters.subject_id', subjectFilter);
        }

        if (difficultyFilter !== 'all') {
          query = query.eq('difficulty', difficultyFilter);
        }

        const { data, error } = await query;

        if (error) throw error;
        const formattedQuizzes = data.map((quiz) => ({
          id: quiz.id,
          title: quiz.name, // quizzes table has 'name' column, not 'title'
          topic_id: quiz.topic_id,
          difficulty: quiz.difficulty,
          question_count: quiz.question_count || 0,
          verified: quiz.verified || false,
          created_at: quiz.created_at,
          subject_name: quiz.topics?.chapters?.subjects?.name,
          topic_name: quiz.topics?.name, // topics table has 'name' column
        }));

        setQuizzes(formattedQuizzes);
      } catch (error) {
        logger.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, [subjectFilter, difficultyFilter, reloadKey]);

  // Filter changes and Refresh re-run the effect above; loading is set here
  // in the handlers so the effect only sets state asynchronously.
  const refreshQuizzes = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  async function handleDeleteQuiz(quizId: string) {
    if (
      !confirm(
        'Are you sure you want to delete this quiz? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      // First delete associated questions
      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('quiz_id', quizId);

      if (questionsError) throw questionsError;

      // Then delete the quiz
      const { error: quizError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId);

      if (quizError) throw quizError;

      logger.log('Quiz deleted successfully');

      // Update local state
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));
    } catch (error) {
      logger.error('Error deleting quiz:', error);
    }
  }

  // Filter quizzes based on search term
  const filteredQuizzes = quizzes.filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.topic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          {' '}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-strong">Quiz Management</h1>
            <div className="flex space-x-3">
              {' '}
              <Link
                href="/admin/quizzes/stats"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded"
              >
                View Statistics
              </Link>
              <Link
                href="/admin/quizzes/new"
                className="px-4 py-2 bg-[var(--band-via)] hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] text-white rounded"
              >
                Create New Quiz
              </Link>
            </div>
          </div>{' '}
          <div className="bg-surface rounded-lg shadow overflow-hidden mb-6">
            <div className="p-4 border-b border-border">
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search quizzes..."
                    className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-strong placeholder:text-soft focus:outline-none focus:ring-2 focus:ring-brand/40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <select
                    value={subjectFilter}
                    onChange={(e) => {
                      setLoading(true);
                      setSubjectFilter(e.target.value);
                    }}
                    className="px-4 py-2 border border-border rounded-lg bg-surface text-strong focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    <option value="all">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>{' '}
                  <select
                    value={difficultyFilter}
                    onChange={(e) => {
                      setLoading(true);
                      setDifficultyFilter(e.target.value);
                    }}
                    className="px-4 py-2 border border-border rounded-lg bg-surface text-strong focus:outline-none focus:ring-2 focus:ring-brand/40"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <button
                    onClick={refreshQuizzes}
                    className="px-4 py-2 bg-muted text-soft rounded hover:bg-muted"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="p-8 text-center text-soft">
                {quizzes.length === 0 ? (
                  <div>
                    <p className="mb-4">No quizzes found in the system.</p>
                    <Link
                      href="/admin/quizzes/new"
                      className="px-4 py-2 bg-[var(--band-via)] hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] text-white rounded"
                    >
                      Create Your First Quiz
                    </Link>
                  </div>
                ) : (
                  <p>No quizzes match your search criteria.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {' '}
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-surface-2">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Subject / Topic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Difficulty
                      </th>{' '}
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-soft uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border">
                    {filteredQuizzes.map((quiz) => (
                      <tr key={quiz.id}>
                        {' '}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-strong">
                            {quiz.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-strong">
                            {quiz.subject_name}
                          </div>
                          <div className="text-sm text-soft">
                            {quiz.topic_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full                            ${
                              quiz.difficulty === 'easy'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : quiz.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {quiz.difficulty.charAt(0).toUpperCase() +
                              quiz.difficulty.slice(1)}
                          </span>
                        </td>{' '}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                          {quiz.question_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              quiz.verified
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {quiz.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                          {new Date(quiz.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/quizzes/${quiz.id}/audit`}
                            className="text-brand hover:text-brand mr-4"
                          >
                            Audit
                          </Link>
                          <Link
                            href={`/admin/quizzes/${quiz.id}/questions`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-4"
                          >
                            Questions
                          </Link>
                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
