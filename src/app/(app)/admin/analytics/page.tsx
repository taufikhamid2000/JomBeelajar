'use client';
// Import dynamic config to optimize build
import './config';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import AdminNavigation from '@/components/admin/AdminNavigation';

export default function AdminAnalyticsPage() {
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month' | 'year'>(
    'week'
  );
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    dailyActiveUsers: number;
    totalQuizAttempts: number;
    averageQuizScore: number;
    completionRate: number;
    subjectActivity: Array<{
      name: string;
      percentage: number;
    }>;
  }>({
    dailyActiveUsers: 0,
    totalQuizAttempts: 0,
    averageQuizScore: 0,
    completionRate: 0,
    subjectActivity: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchAnalytics() {
      try {
        // In a real application, you would fetch this data from your database
        // This is a placeholder implementation
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock data for now
        if (cancelled) return;
        setAnalyticsData({
          dailyActiveUsers: Math.floor(Math.random() * 100) + 50,
          totalQuizAttempts: Math.floor(Math.random() * 500) + 200,
          averageQuizScore: Math.floor(Math.random() * 30) + 70, // 70-100%
          completionRate: Math.floor(Math.random() * 30) + 0, // 65-95%
          subjectActivity: [
            { name: 'Mathematics', percentage: 87 },
            { name: 'Science', percentage: 75 },
            { name: 'History', percentage: 62 },
            { name: 'English', percentage: 58 },
          ],
        });
      } catch (error) {
        logger.error('Error fetching analytics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, [timeFrame]);

  // Loading is flipped on here (not in the effect) so the fetch effect only
  // ever sets state asynchronously.
  function selectTimeFrame(next: typeof timeFrame) {
    if (next === timeFrame) return;
    setLoading(true);
    setTimeFrame(next);
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="flex">
        <AdminNavigation />
        <div className="flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold dark:text-white">Analytics</h1>
            <div className="flex space-x-2">
              {' '}
              <button
                onClick={() => selectTimeFrame('day')}
                className={`px-4 py-2 rounded ${
                  timeFrame === 'day'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => selectTimeFrame('week')}
                className={`px-4 py-2 rounded ${
                  timeFrame === 'week'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
                }`}
              >
                Week
              </button>{' '}
              <button
                onClick={() => selectTimeFrame('month')}
                className={`px-4 py-2 rounded ${
                  timeFrame === 'month'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => selectTimeFrame('year')}
                className={`px-4 py-2 rounded ${
                  timeFrame === 'year'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border dark:border-gray-600'
                }`}
              >
                Year
              </button>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800 dark:bg-white rounded-lg shadow p-6"
                >
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 dark:bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-gray-700 dark:bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-700 dark:bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-400 dark:text-gray-500 text-sm">
                  Daily Active Users
                </h3>
                <p className="text-3xl font-bold dark:text-white">
                  {analyticsData.dailyActiveUsers}
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  +5.3% from last {timeFrame}
                </p>
              </div>
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-400 dark:text-gray-500 text-sm">
                  Quiz Attempts
                </h3>
                <p className="text-3xl font-bold dark:text-white">
                  {analyticsData.totalQuizAttempts}
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  +2.7% from last {timeFrame}
                </p>
              </div>{' '}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-400 dark:text-gray-500 text-sm">
                  Average Score
                </h3>
                <p className="text-3xl font-bold dark:text-white">
                  {analyticsData.averageQuizScore}%
                </p>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  +1.2% from last {timeFrame}
                </p>
              </div>{' '}
              <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-400 dark:text-gray-500 text-sm">
                  Completion Rate
                </h3>
                <p className="text-3xl font-bold dark:text-white">
                  {analyticsData.completionRate}%
                </p>
                <p className="text-red-600 dark:text-red-400 text-sm">
                  -0.8% from last {timeFrame}
                </p>
              </div>
            </div>
          )}{' '}
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-medium mb-4 dark:text-white">
              User Activity
            </h2>
            <p className="text-gray-400 dark:text-gray-500 mb-6">
              User activity chart will be displayed here. This requires a
              charting library like Chart.js or Recharts.
            </p>
            {/* Placeholder for a chart */}
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-400 dark:text-gray-500">
                Activity Chart Placeholder
              </p>
            </div>
          </div>{' '}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-medium mb-4 dark:text-white">
                Most Active Subjects
              </h2>{' '}
              <div className="space-y-4">
                {analyticsData.subjectActivity.map((subject) => (
                  <div key={subject.name}>
                    <div className="flex justify-between items-center">
                      <span className="dark:text-gray-200">{subject.name}</span>
                      <span className="dark:text-gray-200">
                        {subject.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 dark:bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>{' '}
            <div className="bg-gray-800 dark:bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-medium mb-4 dark:text-white">
                User Demographics
              </h2>
              <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500">
                  Demographics Chart Placeholder
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
