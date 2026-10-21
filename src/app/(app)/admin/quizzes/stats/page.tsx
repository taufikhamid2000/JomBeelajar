'use client';
// Import dynamic config to optimize build
import './config';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';

interface QuizStats {
  id: string;
  title: string;
  subject_name: string;
  topic_name: string;
  difficulty: string;
  completion_rate: number;
  avg_score: number;
  attempts: number;
  question_count: number;
  time_limit: number;
}

interface SubjectStats {
  id: string;
  name: string;
  quiz_count: number;
  avg_completion_rate: number;
  avg_score: number;
  total_attempts: number;
}

interface StatsOverview {
  total_quizzes: number;
  total_questions: number;
  total_attempts: number;
  avg_score: number;
  completion_rate: number;
}

// No need for separate interfaces since we're using inline type assertions

export default function AdminQuizStatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizStats, setQuizStats] = useState<QuizStats[]>([]);
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [overview, setOverview] = useState<StatsOverview>({
    total_quizzes: 0,
    total_questions: 0,
    total_attempts: 0,
    avg_score: 0,
    completion_rate: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch quizzes with related data
        const { data: quizzesData, error: quizzesError } = await supabase.from(
          'quizzes'
        ).select(`
            id, name, difficulty, question_count, time_limit,          topics(
              name,
              chapters(
                subjects(name)
              )
            )
          `);

        if (quizzesError) throw quizzesError;

        // Fetch quiz attempts
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, completed');

        if (attemptsError) throw attemptsError; // Process data for quiz statistics
        const quizStatsMap: Record<string, QuizStats> = {};

        // Initialize quiz stats
        // Explicitly type the quiz objects
        (
          quizzesData as Array<{
            id: string;
            name: string; // quizzes table has 'name' column
            difficulty: string;
            question_count?: number;
            time_limit?: number;
            topics?: {
              name?: string; // topics table has 'name' column
              chapters?: {
                subjects?: { name?: string } | null;
              } | null;
            } | null;
          }>
        ).forEach((quiz) => {
          quizStatsMap[quiz.id] = {
            id: quiz.id,
            title: quiz.name, // Use quiz.name instead of quiz.title
            subject_name: quiz.topics?.chapters?.subjects?.name || 'Unknown',
            topic_name: quiz.topics?.name || 'Unknown', // Use topics.name
            difficulty: quiz.difficulty,
            completion_rate: 0,
            avg_score: 0,
            attempts: 0,
            question_count: quiz.question_count || 0,
            time_limit: quiz.time_limit || 0,
          };
        }); // Calculate stats from attempts
        // Explicitly type the attempt objects
        (
          attemptsData as Array<{
            quiz_id: string;
            score: number | null;
            completed: boolean;
          }>
        ).forEach((attempt) => {
          const quizId = attempt.quiz_id;
          if (quizStatsMap[quizId]) {
            const stats = quizStatsMap[quizId];
            stats.attempts += 1;

            if (attempt.completed) {
              stats.completion_rate =
                (stats.completion_rate * (stats.attempts - 1) + 100) /
                stats.attempts;
            }

            stats.avg_score =
              (stats.avg_score * (stats.attempts - 1) + (attempt.score || 0)) /
              stats.attempts;
          }
        });

        const processedQuizStats = Object.values(quizStatsMap);
        setQuizStats(processedQuizStats);

        // Process subject statistics
        const subjectStatsMap: Record<string, SubjectStats> = {};

        processedQuizStats.forEach((quiz: QuizStats) => {
          const subjectName = quiz.subject_name;
          if (!subjectStatsMap[subjectName]) {
            subjectStatsMap[subjectName] = {
              id: subjectName,
              name: subjectName,
              quiz_count: 0,
              avg_completion_rate: 0,
              avg_score: 0,
              total_attempts: 0,
            };
          }

          const subject = subjectStatsMap[subjectName];
          subject.quiz_count += 1;
          subject.total_attempts += quiz.attempts;

          if (quiz.attempts > 0) {
            subject.avg_completion_rate =
              (subject.avg_completion_rate * (subject.quiz_count - 1) +
                quiz.completion_rate) /
              subject.quiz_count;
            subject.avg_score =
              (subject.avg_score * (subject.quiz_count - 1) + quiz.avg_score) /
              subject.quiz_count;
          }
        });

        const processedSubjectStats = Object.values(subjectStatsMap).sort(
          (a, b) => b.total_attempts - a.total_attempts
        );
        setSubjectStats(processedSubjectStats);

        // Calculate overall statistics
        const totalQuizzes = processedQuizStats.length;
        const totalQuestions = processedQuizStats.reduce(
          (total, quiz) => total + quiz.question_count,
          0
        );
        const totalAttempts = processedQuizStats.reduce(
          (total, quiz) => total + quiz.attempts,
          0
        );

        let overallAvgScore = 0;
        let overallCompletionRate = 0;

        if (totalAttempts > 0) {
          const totalScores = processedQuizStats.reduce(
            (total, quiz) => total + quiz.avg_score * quiz.attempts,
            0
          );
          overallAvgScore = totalScores / totalAttempts;

          const totalCompletions = processedQuizStats.reduce(
            (total, quiz) => total + (quiz.completion_rate * quiz.attempts) / 100,
            0
          );
          overallCompletionRate = (totalCompletions / totalAttempts) * 100;
        }

        setOverview({
          total_quizzes: totalQuizzes,
          total_questions: totalQuestions,
          total_attempts: totalAttempts,
          avg_score: overallAvgScore,
          completion_rate: overallCompletionRate,
        });
      } catch (error) {
        logger.error('Error fetching quiz statistics:', error);
        setError('Failed to load quiz statistics. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Filter quizzes based on search and difficulty
  const filteredQuizStats = quizStats.filter((quiz) => {
    const matchesSearch =
      searchTerm === '' ||
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.topic_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === 'all' || quiz.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white dark:text-gray-900">
                Quiz Statistics
              </h1>
              <p className="text-gray-400 dark:text-gray-500 mt-1">
                Performance metrics and completion rates for all quizzes
              </p>
            </div>
            <div>
              <Link
                href="/admin/quizzes"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to Quiz Management
              </Link>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow overflow-hidden p-8 flex justify-center">
              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Quizzes
                  </h3>
                  <p className="text-3xl font-bold">{overview.total_quizzes}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Questions
                  </h3>
                  <p className="text-3xl font-bold">
                    {overview.total_questions}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Total Attempts
                  </h3>
                  <p className="text-3xl font-bold">
                    {overview.total_attempts}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Average Score
                  </h3>
                  <p className="text-3xl font-bold">
                    {overview.avg_score.toFixed(1)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Completion Rate
                  </h3>
                  <p className="text-3xl font-bold">
                    {overview.completion_rate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Subject Performance */}
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Performance by Subject
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quizzes
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Score
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completion Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {subjectStats.map((subject) => (
                          <tr key={subject.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {subject.name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.quiz_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.total_attempts}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {subject.avg_score.toFixed(1)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {subject.avg_completion_rate.toFixed(1)}%
                                </span>
                                <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className="bg-blue-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${Math.min(100, subject.avg_completion_rate)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Quiz List with Stats */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Quiz Performance</h2>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quiz
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Difficulty
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Questions
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attempts
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg. Score
                          </th>
                          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredQuizStats.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              No quizzes match your search criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredQuizStats.map((quiz) => (
                            <tr key={quiz.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {quiz.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {quiz.topic_name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {quiz.subject_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    quiz.difficulty === 'easy'
                                      ? 'bg-green-100 text-green-800'
                                      : quiz.difficulty === 'medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {quiz.difficulty.charAt(0).toUpperCase() +
                                    quiz.difficulty.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {quiz.question_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {quiz.attempts}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {quiz.avg_score > 0 ? (
                                  <div className="flex items-center">
                                    <span className="mr-2">
                                      {quiz.avg_score.toFixed(1)}%
                                    </span>
                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className={`h-1.5 rounded-full ${
                                          quiz.avg_score >= 70
                                            ? 'bg-green-500'
                                            : quiz.avg_score >= 50
                                              ? 'bg-yellow-500'
                                              : 'bg-red-500'
                                        }`}
                                        style={{
                                          width: `${Math.min(100, quiz.avg_score)}%`,
                                        }}
                                      ></div>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">No data</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <Link
                                  href={`/admin/quizzes/${quiz.id}/questions`}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Questions
                                </Link>
                                <Link
                                  href={`/admin/quizzes/${quiz.id}/edit`}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Edit
                                </Link>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
