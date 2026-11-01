'use client';

/**
 * Loading component for the dashboard page
 * This is automatically picked up by Next.js App Router
 */
export default function DashboardLoading() {
  return (
    <main className="container mx-auto py-6 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
        {/* Welcome Banner Skeleton */}
        <div className="bg-surface rounded-xl shadow-lg p-6">
          <div className="animate-pulse flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="h-8 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 bg-muted rounded-full"></div>
              <div className="h-12 w-24 bg-muted rounded"></div>
            </div>
          </div>
        </div>

        {/* Subjects Section Skeleton */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="h-8 bg-muted rounded w-48 mb-4 md:mb-0"></div>
          </div>

          {/* Search and Filter Skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
            <div className="w-48">
              <div className="h-10 bg-muted rounded w-full"></div>
            </div>
          </div>

          {/* Subject Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-xl p-6 shadow-lg animate-pulse"
              >
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-muted rounded-full mr-4"></div>
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Progress Skeleton */}
        <section className="bg-surface rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements Skeleton */}
        <section className="bg-surface rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted rounded-lg p-4 text-center">
                  <div className="h-16 w-16 bg-muted rounded-full mx-auto mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
