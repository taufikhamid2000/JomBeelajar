'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Subject {
  id: string;
  name: string;
}

interface Topic {
  id: string;
  name: string;
  subject_id: string;
}

export default function NewQuizPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [selectedTopicId, setTopicId] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(
    'medium'
  );
  const [timeLimit, setTimeLimit] = useState(300); // 5 minutes in seconds
  const [passingScore, setPassingScore] = useState(70); // 70%

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function fetchSubjectsAndTopics() {
      try {
        // Fetch subjects
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id, name')
          .order('name', { ascending: true });

        if (subjectsError) throw subjectsError;
        setSubjects(subjectsData || []);

        // Fetch topics
        const { data: topicsData, error: topicsError } = await supabase
          .from('topics')
          .select('id, name, subject_id')
          .order('name', { ascending: true });

        if (topicsError) throw topicsError;
        setTopics(topicsData || []);
      } catch (error) {
        logger.error('Error fetching subjects and topics:', error);
        setError(
          'Failed to load subjects and topics. Please refresh and try again.'
        );
      } finally {
        setLoading(false);
      }
    }

    fetchSubjectsAndTopics();
  }, []);

  // Topics for the selected subject, and the selected topic only while it
  // still belongs to that subject (derived instead of reset in an effect).
  const filteredTopics = subjectId
    ? topics.filter((topic) => topic.subject_id === subjectId)
    : [];
  const topicId = filteredTopics.some((topic) => topic.id === selectedTopicId)
    ? selectedTopicId
    : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate form
    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (!subjectId) {
      setError('Please select a subject');
      return;
    }

    if (!topicId) {
      setError('Please select a topic');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Insert new quiz into database
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title,
          description: description.trim() || null,
          subject_id: subjectId,
          topic_id: topicId,
          difficulty,
          time_limit: timeLimit,
          passing_score: passingScore,
          question_count: 0, // No questions initially
        })
        .select();

      if (error) throw error;

      const quizId = data[0].id;

      setSuccess('Quiz created successfully!');

      // Redirect to quiz questions page after short delay
      setTimeout(() => {
        router.push(`/admin/quizzes/${quizId}/questions`);
      }, 1000);
    } catch (error) {
      logger.error('Error creating quiz:', error);
      setError('Failed to create quiz. Please try again.');
    } finally {
      setSaving(false);
    }
  }

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
                Create New Quiz
              </h1>
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

          <div className="bg-gray-800 dark:bg-white rounded-lg shadow overflow-hidden">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                >
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter a descriptive quiz title"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Provide a brief description of the quiz (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                  >
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="subject"
                    value={subjectId}
                    onChange={(e) => {
                      const nextSubjectId = e.target.value;
                      setSubjectId(nextSubjectId);
                      // Reset topic selection if it's not valid for the new subject
                      if (
                        !topics.some(
                          (topic) =>
                            topic.id === topicId &&
                            topic.subject_id === nextSubjectId
                        )
                      ) {
                        setTopicId('');
                      }
                    }}
                    className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="topic"
                    className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                  >
                    Topic <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="topic"
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value)}
                    disabled={!subjectId || filteredTopics.length === 0}
                    className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
                  >
                    <option value="">
                      {!subjectId
                        ? 'Select a subject first'
                        : filteredTopics.length === 0
                          ? 'No topics available for this subject'
                          : 'Select a topic'}
                    </option>
                    {filteredTopics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                  >
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(
                        e.target.value as 'easy' | 'medium' | 'hard'
                      )
                    }
                    className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="time-limit"
                    className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                  >
                    Time Limit (seconds)
                  </label>
                  <input
                    type="number"
                    id="time-limit"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Number(e.target.value))}
                    min={60}
                    max={3600}
                    className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {Math.floor(timeLimit / 60)} minutes {timeLimit % 60}{' '}
                    seconds
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="passing-score"
                    className="block text-sm font-medium text-gray-300 dark:text-gray-700"
                  >
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    id="passing-score"
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="mt-1 block w-full border border-gray-600 dark:border-gray-300 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-white dark:text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Link
                  href="/admin/quizzes"
                  className="bg-gray-700 dark:bg-gray-200 py-2 px-4 border border-gray-600 dark:border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-300 dark:text-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 dark:disabled:bg-blue-800"
                >
                  {saving ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
