import { FiZap } from 'react-icons/fi';

interface StreakXpStripProps {
  streak: number;
  xp: number;
  level: number;
}

const XP_PER_LEVEL = 100;

export default function StreakXpStrip({
  streak,
  xp,
  level,
}: StreakXpStripProps) {
  const safeStreak = Math.max(0, streak || 0);
  const safeXp = Math.max(0, xp || 0);
  const safeLevel = Math.max(1, level || 1);
  const into = safeXp % XP_PER_LEVEL;
  const pct = Math.round((into / XP_PER_LEVEL) * 100);

  return (
    <section
      aria-label="Streak and experience"
      className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr]"
    >
      <div className="flex items-center gap-3 jb-card bg-streak-soft px-5 py-4">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-streak"
          aria-hidden="true"
        >
          <FiZap className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-extrabold leading-none text-strong">
            {safeStreak}
            <span className="ml-1 text-sm font-semibold">
              {safeStreak === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="mt-1 text-xs text-soft">
            {safeStreak > 0 ? 'Keep it going!' : 'Start a streak today'}
          </p>
        </div>
      </div>

      <div className="jb-card px-5 py-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-brand">Level {safeLevel}</span>
          <span className="text-soft">
            {safeXp} XP · {XP_PER_LEVEL - into} to next level
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="XP progress to next level"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
