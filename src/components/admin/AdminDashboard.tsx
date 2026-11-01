import { useState, useEffect } from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import {
  fetchDashboardStats,
  DashboardStats,
} from '@/services/dashboardStatsService';
import { getAuditDashboardStats } from '@/services/auditService';
import type { QuizWithAudit, AuditDashboardStats } from '@/types/audit';

interface StatsCard {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditStats, setAuditStats] = useState<AuditDashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    async function fetchAdminStats() {
      setLoading(true);
      try {
        // Fetch both dashboard stats and audit stats in parallel
        const [dashboardResult, auditResult] = await Promise.all([
          fetchDashboardStats(),
          getAuditDashboardStats(),
        ]);

        if (dashboardResult.error) {
          throw dashboardResult.error;
        }

        setStats(dashboardResult.data);
        setAuditStats(auditResult);
      } catch (error) {
        logger.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminStats();
  }, []);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {' '}
        <StatCard
          title="Total Users"
          value={loading ? '...' : stats?.totalUsers || 0}
          change={5.25}
          icon={
            <div className="rounded-full bg-brand-soft dark:bg-[var(--band-via)]/30 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          }
        />{' '}
        <StatCard
          title="Total Quizzes"
          value={loading ? '...' : stats?.totalQuizzes || 0}
          change={2.5}
          icon={
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          }
        />{' '}
        <StatCard
          title="Subjects"
          value={loading ? '...' : stats?.totalSubjects || 0}
          change={0}
          icon={
            <div className="rounded-full bg-brand-soft dark:bg-[var(--band-via)]/30 p-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          }
        />{' '}
      </div>{' '}
      {/* Audit System Statistics */}
      <div className="bg-surface rounded-lg shadow p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quiz Audit System</h2>
          <Link
            href="/admin/quizzes"
            className="text-brand hover:text-brand text-sm font-medium"
          >
            View All Quizzes →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {auditStats?.total_unverified_quizzes || 0}
                </div>
                <div className="text-sm text-soft">Unverified Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {auditStats?.total_pending_comments || 0}
                </div>
                <div className="text-sm text-soft">Pending Comments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {auditStats?.total_verified_today || 0}
                </div>
                <div className="text-sm text-soft">Verified Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-brand">
                  {auditStats?.total_rejected_today || 0}
                </div>
                <div className="text-sm text-soft">Rejected Today</div>
              </div>
            </div>

            {/* Quizzes Needing Review */}
            {auditStats?.quizzes_needing_review &&
              auditStats.quizzes_needing_review.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">
                    Quizzes Needing Review
                  </h3>
                  <div className="space-y-2">
                    {auditStats.quizzes_needing_review.map(
                      (quiz: QuizWithAudit) => (
                        <div
                          key={quiz.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{quiz.name}</h4>{' '}
                            <p className="text-sm text-soft">
                              Created{' '}
                              {new Date(quiz.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            {' '}
                            {(quiz.unresolved_comments_count || 0) > 0 && (
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs px-2 py-1 rounded-full">
                                {quiz.unresolved_comments_count} comment
                                {quiz.unresolved_comments_count !== 1
                                  ? 's'
                                  : ''}
                              </span>
                            )}
                            <a
                              href={`/admin/quizzes/${quiz.id}/audit`}
                              className="bg-[var(--band-via)] hover:bg-[var(--band-from)] text-white text-sm px-3 py-1 rounded"
                            >
                              Review
                            </a>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </>
        )}
      </div>
      <div className="bg-surface rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-muted rounded w-5/6 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="">
              No recent activities to display. This feature will be implemented
              soon.
            </p>
          </div>
        )}
      </div>{' '}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Top Performing Students
          </h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="">Leaderboard data will be displayed here.</p>
            </div>
          )}
        </div>{' '}
        <div className="bg-surface rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Popular Quizzes</h2>
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="">Quiz analytics will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon }: StatsCard) {
  return (
    <div className="bg-surface rounded-lg shadow p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-soft mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <div className="flex items-center mt-2">
            <span
              className={`text-xs font-medium ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}
            >
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
            <span className="text-xs text-soft ml-1">from last month</span>
          </div>
        </div>
        {icon}
      </div>
    </div>
  );
}
