'use client';

import { ReactNode } from 'react';
import Stopwatch from '../Stopwatch';

interface SkeletonLoaderProps {
  variant?: 'simple' | 'table' | 'full' | 'spinner';
  rows?: number;
  cols?: number;
  message?: string;
  showStopwatch?: boolean;
  children?: ReactNode;
}

export function SkeletonLoader({
  variant = 'simple',
  rows = 5,
  cols = 1,
  message = 'Loading...',
  showStopwatch = false,
  children,
}: SkeletonLoaderProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand/40"></div>
        {message && (
          <div className="mt-4">
            <p className="text-lg font-medium text-soft">{message}</p>
          </div>
        )}
        {showStopwatch && <Stopwatch />}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="grid grid-cols-3 gap-4">
              {[...Array(cols)].map((_, j) => (
                <div key={j} className="h-10 bg-muted rounded"></div>
              ))}
            </div>
          ))}
        </div>
        {showStopwatch && (
          <div className="text-center mt-4">
            <Stopwatch />
          </div>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className="animate-pulse space-y-8">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="h-8 bg-muted rounded-full w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-full max-w-md mx-auto"></div>
          {showStopwatch && (
            <div className="mt-4">
              <Stopwatch />
            </div>
          )}
        </div>

        <div className="space-y-6">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="bg-surface rounded-xl p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded w-full"></div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {children}
      </div>
    );
  }

  // Simple variant (default)
  return (
    <div className="animate-pulse flex flex-col items-center justify-center py-8 space-y-4 text-center">
      <div className="h-4 bg-muted rounded w-48"></div>
      {message && <p className="text-sm text-soft">{message}</p>}
      {showStopwatch && <Stopwatch />}
      {children}
    </div>
  );
}
