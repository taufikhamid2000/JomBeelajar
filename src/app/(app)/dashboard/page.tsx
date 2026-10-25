'use client';
import { logger } from '@/lib/logger';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardData,
  fetchUserStats,
} from '@/services/dashboardService';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { ServerWaking } from '@/components/ui/ServerWaking';
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  // Fetch dashboard data with React Query - no authentication required
  const { data: dashboardData, error: dashboardError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Log dashboard data when it changes
  useEffect(() => {
    if (dashboardData) {
      logger.log('Dashboard data received:', {
        isGuest: dashboardData.user?.display_name === 'Guest User',
        displayName: dashboardData.user?.display_name,
        email: dashboardData.user?.email,
      });
    }
  }, [dashboardData]);

  // Fetch user stats with React Query - progressive enhancement
  const {
    data: userStats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
    staleTime: 600000, // 10 minutes
    gcTime: 1200000, // 20 minutes cache
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Show upgrading indicator while real data is being fetched
  const isUpgrading = isStatsLoading;

  // Never show loading spinner for dashboard data - show guest data immediately
  // Only show error if critical dashboard data fails
  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Unable to connect to the API. Please contact the administrator.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-[44px] px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Still loading (no data, no error): skeleton + delayed "server waking" hint
  if (!dashboardData) {
    return (
      <div>
        <DashboardSkeleton />
        <ServerWaking />
      </div>
    );
  }
  return (
    <div className="relative">
      {/* Upgrading indicator */}
      {isUpgrading && (
        <div className="fixed top-4 right-4 z-50">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full shadow-lg">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent mr-2"></div>
            Loading your data...
          </div>
        </div>
      )}

      <DashboardClient
        initialUser={dashboardData.user}
        initialSubjects={dashboardData.subjects}
        initialCategories={dashboardData.categories}
        userStats={userStats}
        statsLoading={isStatsLoading}
        statsError={statsError}
      />
    </div>
  );
}
