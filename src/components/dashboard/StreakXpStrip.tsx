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
      <div className="flex items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 shadow-sm dark:border-orange-900/50 dark:bg-orange-950/30">
        <span className="text-3xl" aria-hidden="true">
          🔥
        </span>
        <div>
          <p className="text-2xl font-extrabold leading-none text-orange-600 dark:text-orange-400">
            {safeStreak}
            <span className="ml-1 text-sm font-semibold">
              {safeStreak === 1 ? 'day' : 'days'}
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {safeStreak > 0 ? 'Keep it going!' : 'Start a streak today'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-blue-600 dark:text-blue-400">
            Level {safeLevel}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {safeXp} XP · {XP_PER_LEVEL - into} to next level
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="XP progress to next level"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
