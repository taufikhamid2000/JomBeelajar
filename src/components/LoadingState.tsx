'use client';
/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import Stopwatch from './Stopwatch';

export default function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
      <div className="max-w-6xl mx-auto px-8 py-20">
        {/* Loading message */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="inline-block px-6 py-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <p className="text-lg text-blue-800 dark:text-blue-200">
                Hold tight! Loading...
              </p>
              <p className="text-sm mt-2 text-blue-600 dark:text-blue-300">
                🚀 Using Supabase Free Tier (~10 seconds)
              </p>{' '}
              <p className="text-xs mt-2 text-blue-500 dark:text-blue-400">
                Pro tip: If it takes too long, refreshing might help. If it
                still didn't work after ~20 seconds, try clearing the cache.
              </p>{' '}
              <p className="text-xs mt-2 text-blue-600 dark:text-blue-300">
                Having trouble on mobile? 📱{' '}
                <Link href="/static/dashboard" className="underline">
                  Try our static dashboard
                </Link>{' '}
                for instant access without backend connections.
              </p>
              <Stopwatch />
              <div className="mt-4">
                <Link
                  href="/docs/JomBeelajar%20Research.pdf"
                  className="text-xs text-blue-600 dark:text-blue-300 hover:underline"
                  target="_blank"
                >
                  📄 Read our research paper while waiting
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton loader */}
        <div className="animate-pulse">
          {/* Hero section skeleton */}
          <div className="h-8 w-32 bg-gray-700 dark:bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-12 w-64 bg-gray-700 dark:bg-gray-200 rounded-lg mx-auto mb-8"></div>
          <div className="h-1 w-20 bg-gray-700 dark:bg-gray-200 mx-auto mb-12"></div>

          {/* Main content skeleton */}
          <div className="bg-gray-800 dark:bg-white rounded-xl shadow-xl p-8 mb-16">
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                <div className="h-8 bg-gray-700 dark:bg-gray-200 rounded-lg w-3/4"></div>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-700 dark:bg-gray-200 rounded w-full"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Features grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-gray-800 dark:bg-white rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-700 dark:bg-gray-200 rounded-full mr-4"></div>
                  <div className="h-6 w-32 bg-gray-700 dark:bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-start">
                      <div className="w-5 h-5 bg-gray-700 dark:bg-gray-200 rounded mr-2 mt-0.5"></div>
                      <div className="h-4 bg-gray-700 dark:bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Stats section skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 dark:bg-white rounded-xl p-6 text-center"
              >
                <div className="w-16 h-16 bg-gray-700 dark:bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 w-20 bg-gray-700 dark:bg-gray-200 rounded mx-auto mb-2"></div>
                <div className="h-4 w-32 bg-gray-700 dark:bg-gray-200 rounded mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
