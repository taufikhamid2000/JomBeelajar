'use client';

import { useQuery } from '@tanstack/react-query';
import SchoolLeaderboardTable from '@/components/leaderboard/SchoolLeaderboardTable';
import LeaderboardNav from '@/components/leaderboard/LeaderboardNav';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { School } from '@/types/leaderboard';

interface SchoolStatsResponse {
  totalSchools: number;
  averageParticipation: number;
  totalStudents: number;
  growthRates: {
    schools: number;
    participation: number;
    students: number;
  };
}

interface SchoolLeaderboardResponse {
  data: School[];
  stats: SchoolStatsResponse;
}

async function fetchSchoolLeaderboard(): Promise<SchoolLeaderboardResponse> {
  const response = await fetch('/api/leaderboard/schools');
  if (!response.ok) {
    throw new Error('Failed to fetch school leaderboard data');
  }
  return response.json();
}

export default function SchoolLeaderboardPage() {
  const { data, isLoading, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['schoolLeaderboard'],
    queryFn: fetchSchoolLeaderboard,
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep data in cache for 5 minutes
    refetchInterval: 60000, // Auto-refresh every minute
  });

  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <LeaderboardNav activeTab="schools" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-strong"> School Rankings</h1>
        <p className="mt-2 text-soft">
          Compare and track performance across different schools, districts, and
          states
        </p>
      </div>

      {isLoading ? (
        <SkeletonLoader
          variant="full"
          rows={10}
          cols={5}
          message="Loading school rankings..."
          showStopwatch={true}
        />
      ) : error ? (
        <div className="text-center py-12">
          <div className="inline-flex h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/20 items-center justify-center mb-4">
            <svg
              className="h-10 w-10 text-red-500 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-xl font-medium text-strong mb-2">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-[var(--band-via)] text-white rounded-lg hover:bg-[var(--band-from)] transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-surface rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-soft">
                Total Active Schools
              </h3>
              <p className="text-2xl font-semibold text-strong mt-2">
                {data?.stats.totalSchools.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500 mr-2">
                  ↑ {data?.stats.growthRates.schools}%
                </span>
                <span className="text-soft">from last month</span>
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-soft">
                Average Participation
              </h3>
              <p className="text-2xl font-semibold text-strong mt-2">
                {data?.stats.averageParticipation.toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500 mr-2">
                  ↑ {data?.stats.growthRates.participation}%
                </span>
                <span className="text-soft">from last month</span>
              </div>
            </div>
            <div className="bg-surface rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-soft">
                Total Student Users
              </h3>
              <p className="text-2xl font-semibold text-strong mt-2">
                {data?.stats.totalStudents.toLocaleString()}
              </p>
              <div className="mt-2 flex items-center text-sm">
                <span className="text-green-500 mr-2">
                  ↑ {data?.stats.growthRates.students}%
                </span>
                <span className="text-soft">from last month</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-surface rounded-lg shadow-lg border border-border">
            <SchoolLeaderboardTable data={data?.data || []} />
          </div>

          {/* Bottom Info */}
          <div className="mt-8 text-center text-sm text-soft">
            Last updated: {lastUpdated.toLocaleString()} • Rankings are updated
            daily
          </div>
        </>
      )}
    </div>
  );
}
