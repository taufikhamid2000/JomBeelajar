import React from 'react';
import { User } from '@/types/users';

interface ProfileStatsProps {
  user: User;
}

export default function ProfileStats({ user }: ProfileStatsProps) {
  // Calculate progress to next level (simplified calculation)
  const xpForCurrentLevel = user.level * 100;
  const xpForNextLevel = (user.level + 1) * 100;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const currentProgress = user.xp - xpForCurrentLevel;
  const progressPercentage = Math.min(
    100,
    Math.round((currentProgress / xpNeeded) * 100)
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Your Learning Journey</h2>{' '}
      {/* XP and Level Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-soft">
            Level Progress: {currentProgress}/{xpNeeded} XP to Level{' '}
            {user.level + 1}
          </span>
          <span className="text-sm font-medium text-brand">
            {progressPercentage}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div
            className="bg-[var(--band-via)] dark:bg-[var(--band-via)] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
          <div className="text-3xl font-bold text-brand">
            {user.xp.toLocaleString()}
          </div>
          <div className="text-sm text-soft mt-1">Total XP Earned</div>
        </div>{' '}
        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
          <div className="text-3xl font-bold text-orange-500 dark:text-orange-400">
            {user.streak}
          </div>
          <div className="text-sm text-soft mt-1">Day Streak</div>
        </div>
        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
          <div className="text-3xl font-bold text-green-600 dark:text-green-500">
            {user.level}
          </div>
          <div className="text-sm text-soft mt-1">Current Level</div>
        </div>
      </div>
      {/* Recent Activity Placeholder */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        {user.lastQuizDate ? (
          <p className="text-soft">
            Last quiz completed on{' '}
            {new Date(user.lastQuizDate).toLocaleDateString()}
          </p>
        ) : (
          <p className="text-soft italic">No recent activity</p>
        )}
      </div>
    </div>
  );
}
