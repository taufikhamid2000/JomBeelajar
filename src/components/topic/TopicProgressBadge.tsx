'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

interface TopicProgress {
  topicId: string | null;
  status: string | null;
  score: number | null;
  attempts: number | null;
  lastAttemptedAt: string | null;
}

interface TopicProgressBadgeProps {
  topicId: string;
}

export default function TopicProgressBadge({
  topicId,
}: TopicProgressBadgeProps) {
  const [progress, setProgress] = useState<TopicProgress | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/me/progress');
        // 401 = not logged in; just render nothing
        if (!res.ok) return;

        const data: TopicProgress[] = await res.json();
        const match = data.find((p) => p.topicId === topicId) ?? null;
        if (!cancelled) setProgress(match);
      } catch (error) {
        logger.error('Error fetching topic progress:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topicId]);

  // Nothing to show for guests or untouched topics
  if (!progress || !progress.status) return null;

  const isCompleted = progress.status === 'completed';

  return (
    <div
      className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        isCompleted
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
          : 'bg-brand-soft text-brand dark:bg-[var(--band-via)]/40'
      }`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isCompleted ? 'bg-green-500' : 'bg-[var(--band-via)]'
        }`}
      />
      {isCompleted ? 'Completed' : 'In progress'}
      {typeof progress.score === 'number' && (
        <span className="opacity-80">· last score {progress.score}%</span>
      )}
    </div>
  );
}
