import React, { useState } from 'react';
import { FiAward } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@/types/users';
import { getRewardsByTimeFrame } from '@/services/rewardService';

interface LeaderboardTableProps {
  data: User[];
  timeFrame: 'daily' | 'weekly' | 'allTime';
}

// Helper function to validate image URLs
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;

  // Check if it's a data URL
  if (url.startsWith('data:image/')) return true;

  // Check if it's a URL from ui-avatars.com (default avatar)
  if (url.includes('ui-avatars.com')) return true;

  // Simple check for http/https URLs
  return url.startsWith('http://') || url.startsWith('https://');
};

export default function LeaderboardTable({
  data,
  timeFrame,
}: LeaderboardTableProps) {
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);

  const rewards = getRewardsByTimeFrame(timeFrame);

  const filteredData = data;

  return (
    <div className="space-y-6">
      <div className="bg-muted rounded-lg shadow">
        <button
          onClick={() => setIsRewardsOpen(!isRewardsOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted transition-colors"
        >
          <div className="flex items-center space-x-2">
            <FiAward className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="text-lg font-medium text-strong">
              Current Reward Pool
            </h2>
          </div>
          <svg
            className={`w-5 h-5 text-soft transform transition-transform ${
              isRewardsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isRewardsOpen && (
          <div className="px-6 pb-4 border-t border-border">
            <div className="py-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="text-yellow-600 dark:text-yellow-600 font-medium">
                    {rewards[0].name}
                  </div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-600">
                    RM {rewards[0].amount.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-surface-2 rounded-lg border border-border">
                  <div className="text-soft font-medium">{rewards[1].name}</div>
                  <div className="text-2xl font-bold text-soft">
                    RM {rewards[1].amount.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-orange-600 dark:text-orange-600 font-medium">
                    {rewards[2].name}
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-600">
                    RM {rewards[2].amount.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-brand-soft dark:bg-[var(--band-via)]/20 rounded-lg border border-brand/40">
                  <div className="text-brand font-medium">
                    {rewards[3].name}
                  </div>
                  <div className="text-2xl font-bold text-brand">
                    RM {rewards[3].amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-soft">
                  {timeFrame === 'daily'
                    ? 'Daily rewards reset at midnight MYT'
                    : timeFrame === 'weekly'
                      ? 'Weekly rewards reset every Sunday at midnight MYT'
                      : 'All-time rewards are updated monthly'}
                </div>
                <Link
                  href="/rewards"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40 dark:hover:bg-brand-soft0 transition-colors"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"
                    />
                  </svg>
                  Claim Reward
                </Link>
              </div>

              <div className="text-xs text-center text-soft">
                Top 3 performers and most active participants are eligible for
                rewards
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                  Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {filteredData.map((user, index) => {
                return (
                  <tr
                    key={user.id}
                    className={`${
                      index < 3
                        ? 'bg-[var(--band-via)]/20 dark:bg-brand-soft/50'
                        : 'hover:bg-muted/50'
                    } transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 transition-transform hover:scale-110 ${
                              index === 0
                                ? 'bg-yellow-400 dark:bg-yellow-500'
                                : index === 1
                                  ? 'bg-muted'
                                  : 'bg-orange-600 dark:bg-orange-700'
                            }`}
                          >
                            <span className="text-white font-bold">
                              {index + 1}
                            </span>
                          </div>
                        ) : (
                          <span className="w-8 text-center mr-2 text-soft">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-[var(--band-via)] dark:bg-brand-soft flex items-center justify-center mr-3 overflow-hidden">
                          {isValidImageUrl(user.avatar_url) ? (
                            <Image
                              src={user.avatar_url!}
                              alt={`${user.display_name}'s avatar`}
                              width={40}
                              height={40}
                              className="object-cover"
                              priority={index < 5}
                              unoptimized={
                                user.avatar_url?.startsWith('data:') ||
                                user.avatar_url?.includes('ui-avatars.com')
                              }
                            />
                          ) : (
                            <span className="text-lg font-bold text-brand">
                              {user.display_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/profile/${user.id}`}
                            className="text-sm font-medium text-strong hover:text-brand transition-colors"
                          >
                            {user.display_name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-sm font-medium text-strong">
                          Lv. {user.level}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-soft">
                    No leaderboard data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
