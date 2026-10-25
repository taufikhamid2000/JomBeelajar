'use client';

import Link from 'next/link';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { ServerWaking } from '@/components/ui/ServerWaking';

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSkeleton />
      <div className="px-4 text-center">
        <ServerWaking />
        <p className="mt-2 text-sm text-soft">
          Having trouble on mobile?{' '}
          <Link
            href="/static/dashboard"
            className="font-semibold text-brand underline"
          >
            Try our static dashboard
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
