import React from 'react';
import { Achievement } from '@/types/users';

interface AchievementCardProps {
  achievement: Achievement;
  isNew?: boolean;
}

export default function AchievementCard({
  achievement,
  isNew = false,
}: AchievementCardProps) {
  return (
    <div
      className={`relative bg-surface shadow-md rounded-lg overflow-hidden border ${isNew ? 'border-yellow-400' : 'border-border'}`}
    >
      {isNew && (
        <div className="absolute top-0 right-0">
          <div className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2 py-0.5 rounded-bl-md">
            NEW!
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 mr-3 flex items-center justify-center rounded-full bg-brand-soft dark:bg-[var(--band-via)]/30 text-brand text-xl">
            {achievement.icon}
          </div>
          <h3 className="font-bold text-soft">{achievement.title}</h3>
        </div>

        <p className="text-sm text-soft mb-3">{achievement.description}</p>

        {achievement.progress !== undefined &&
          achievement.max_progress !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Progress</span>
                <span>
                  {achievement.progress}/{achievement.max_progress}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-[var(--band-via)] h-2 rounded-full"
                  style={{
                    width: `${(achievement.progress / achievement.max_progress) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

        <div className="mt-3 text-xs text-soft">
          Earned on {new Date(achievement.earned_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
