'use client';
// Import dynamic config to optimize build
import './config';

// Import dynamic config to optimize build
import './config';

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { AdminLayout, Message } from '@/components/admin/ui';
import { Subject } from '@/services/subjectService';
import { Chapter } from '@/services/chapterService';
import { Topic } from '@/services/topicService';
import { Quiz } from '@/services/quizService';
import { fetchAdminSubjects } from '@/services/subjectService';
import { fetchAdminChapters } from '@/services/chapterService';
import { fetchAdminTopics } from '@/services/topicService';
import { fetchAdminQuizzes } from '@/services/quizService';
import SubjectManagement from '@/components/admin/content/SubjectManagementSimple';
import ChapterManagement from '@/components/admin/content/ChapterManagement';
import TopicManagement from '@/components/admin/content/TopicManagement';
import QuizManagement from '@/components/admin/content/QuizManagement';

// Function to check admin status
const checkAdminStatus = async () => {
  // Check if user is logged in first by verifying Supabase session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      isAdmin: false,
      message: 'You must be logged in to access the admin area',
    };
  }

  // maybeSingle — most users have no row here, which is expected, not
  // an error.
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    return { isAdmin: false, message: 'Error checking admin status' };
  }

  if (!data || data.role !== 'admin') {
    return { isAdmin: false, message: 'You do not have admin privileges' };
  }

  return { isAdmin: true, message: '' };
};

// Admin check + fetch for one content type. Pure data loading (returns the
// rows or throws); the page applies the result to state.
async function loadAdminContent<T>(
  label: string,
  fetcherName: string,
  fetcher: () => Promise<{ data: T[] | null; error: { message?: string } | null }>
): Promise<T[]> {
  logger.log(`Attempting to fetch ${label} via client-side service...`);

  // Check admin status first
  const adminCheck = await checkAdminStatus();
  if (!adminCheck.isAdmin) {
    throw new Error(
      `${adminCheck.message}. Please check login-first.md for manual fix instructions.`
    );
  }

  // Use the contentService instead of direct Supabase calls
  logger.log(`Admin check passed, calling ${fetcherName}`);
  const { data, error } = await fetcher();

  if (error) {
    logger.error('contentService error:', error);
    // More descriptive error with debugging info
    throw new Error(
      `Failed to fetch ${label}: ${error.message || 'Unknown error'} (Check browser console for more details)`
    );
  }

  if (!data) {
    throw new Error('No data returned from content service');
  }

  return data;
}

// Logs a failed content fetch and returns the message to show the admin.
function reportContentError(label: string, error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Error fetching ${label}:`, error);
  const capitalized = label.charAt(0).toUpperCase() + label.slice(1, -1);
  logger.error(`${capitalized} fetch error details:`, {
    error,
    message: errorMessage,
    errorType: typeof error,
    hasFields: error && typeof error === 'object' ? Object.keys(error) : 'N/A',
    timestamp: new Date().toISOString(),
  });
  return errorMessage;
}

function logAuthStateForDebugging() {
  supabase.auth.getSession().then(({ data }) => {
    logger.log('Current auth state:', {
      hasSession: !!data?.session,
      isExpired: data?.session?.expires_at
        ? new Date(data.session.expires_at * 1000) < new Date()
        : 'N/A',
      userId: data?.session?.user?.id || 'not authenticated',
    });
  });
}

export default function AdminContentPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'subjects' | 'chapters' | 'topics' | 'quizzes'
  >('subjects');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Each loadX fetches one content type and applies it to state. State is
  // only set in promise callbacks, so the tab effects below can call them;
  // fetchX adds the synchronous loading reset for user-triggered refreshes.
  const handleContentError = useCallback((label: string, error: unknown) => {
    setError(reportContentError(label, error));
  }, []);

  const loadSubjects = useCallback(
    () =>
      loadAdminContent('subjects', 'fetchAdminSubjects', fetchAdminSubjects)
        .then(setSubjects, (error) => {
          handleContentError('subjects', error);
          logAuthStateForDebugging();
        })
        .finally(() => setLoading(false)),
    [handleContentError]
  );

  const loadChapters = useCallback(
    () =>
      loadAdminContent('chapters', 'fetchAdminChapters', fetchAdminChapters)
        .then((data) => {
          setChapters(data);
          logger.log('Admin content page - chapters fetched:', {
            chaptersCount: data.length,
            chapters: data.map((c) => ({ id: c.id, name: c.name })),
          });
        }, (error) => handleContentError('chapters', error))
        .finally(() => setLoading(false)),
    [handleContentError]
  );

  const loadTopics = useCallback(
    () =>
      loadAdminContent('topics', 'fetchAdminTopics', fetchAdminTopics)
        .then(setTopics, (error) => handleContentError('topics', error))
        .finally(() => setLoading(false)),
    [handleContentError]
  );

  const loadQuizzes = useCallback(
    () =>
      loadAdminContent('quizzes', 'fetchAdminQuizzes', fetchAdminQuizzes)
        .then(setQuizzes, (error) => handleContentError('quizzes', error))
        .finally(() => setLoading(false)),
    [handleContentError]
  );

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };
  const fetchSubjects = useCallback(() => {
    startLoading();
    return loadSubjects();
  }, [loadSubjects]);
  const fetchChapters = useCallback(() => {
    startLoading();
    return loadChapters();
  }, [loadChapters]);
  const fetchTopics = useCallback(() => {
    startLoading();
    return loadTopics();
  }, [loadTopics]);
  const fetchQuizzes = useCallback(() => {
    startLoading();
    return loadQuizzes();
  }, [loadQuizzes]);

  // Function to handle current content refresh based on active tab
  const refreshCurrentContent = async () => {
    if (activeTab === 'subjects') {
      await fetchSubjects();
    } else if (activeTab === 'chapters') {
      await fetchChapters();
    } else if (activeTab === 'topics') {
      await fetchTopics();
    } else if (activeTab === 'quizzes') {
      await fetchQuizzes();
    }
  };

  // Function to handle the retry button
  const handleRetry = () => {
    refreshCurrentContent();
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  // Fetch subjects when active tab changes
  useEffect(() => {
    if (activeTab === 'subjects') {
      loadSubjects();
    }
  }, [activeTab, loadSubjects]);

  // Fetch chapters when active tab changes
  useEffect(() => {
    if (activeTab === 'chapters') {
      loadChapters();
    }
  }, [activeTab, loadChapters]); // Fetch topics when active tab changes
  useEffect(() => {
    if (activeTab === 'topics') {
      // Fetch both chapters and topics since topics depend on chapters for the dropdown
      loadChapters().then(() => {
        startLoading();
        loadTopics();
      });
    }
  }, [activeTab, loadChapters, loadTopics]);

  // Fetch quizzes when active tab changes
  useEffect(() => {
    if (activeTab === 'quizzes') {
      loadQuizzes();
    }
  }, [activeTab, loadQuizzes]);

  // The tab effects above only set state asynchronously, so the loading
  // reset for a tab switch happens here in the event handler.
  const selectTab = (tab: typeof activeTab) => {
    if (tab === activeTab) return;
    startLoading();
    setActiveTab(tab);
  };
  return (
    <AdminLayout
      title="Content Management"
      refreshAction={refreshCurrentContent}
      isLoading={loading}
    >
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => selectTab('subjects')}
            className={`px-4 py-2 rounded ${
              activeTab === 'subjects'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
            }`}
          >
            Subjects
          </button>
          <button
            onClick={() => selectTab('chapters')}
            className={`px-4 py-2 rounded ${
              activeTab === 'chapters'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
            }`}
          >
            Chapters
          </button>
          <button
            onClick={() => selectTab('topics')}
            className={`px-4 py-2 rounded ${
              activeTab === 'topics'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
            }`}
          >
            Topics
          </button>
          <button
            onClick={() => selectTab('quizzes')}
            className={`px-4 py-2 rounded ${
              activeTab === 'quizzes'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
            }`}
          >
            Quizzes
          </button>
        </div>
      </div>

      {/* Error and Success Messages */}
      <Message
        type="error"
        message={error}
        onDismiss={() => setError(null)}
        onRetry={handleRetry}
      />

      <Message
        type="success"
        message={successMessage}
        onDismiss={() => setSuccessMessage(null)}
      />

      <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
        {activeTab === 'subjects' && (
          <SubjectManagement
            subjects={subjects}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            refreshSubjects={fetchSubjects}
          />
        )}
        {activeTab === 'chapters' && (
          <ChapterManagement
            chapters={chapters}
            subjects={subjects}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            refreshChapters={fetchChapters}
          />
        )}
        {activeTab === 'topics' && (
          <TopicManagement
            topics={topics}
            chapters={chapters}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            refreshTopics={fetchTopics}
          />
        )}{' '}
        {activeTab === 'quizzes' && (
          <QuizManagement
            quizzes={quizzes}
            topics={topics}
            loading={loading}
            setLoading={setLoading}
            setError={setError}
            setSuccessMessage={setSuccessMessage}
            refreshQuizzes={fetchQuizzes}
          />
        )}
      </div>
    </AdminLayout>
  );
}
