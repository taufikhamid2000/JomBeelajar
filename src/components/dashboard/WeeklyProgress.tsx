import React from 'react';

interface WeeklyProgressProps {
  quizzesCompleted: number;
  quizzesTotal: number;
  averageScore: number;
}

const WeeklyProgress = ({
  quizzesCompleted,
  quizzesTotal,
  averageScore,
}: WeeklyProgressProps) => {
  const quizCompletionPercentage = Math.round(
    (quizzesCompleted / quizzesTotal) * 100
  );

  return (
    <section className="dashboard-section progress bg-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-md text-strong">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
        Weekly Progress
      </h2>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base">Quizzes This Week</span>
          <div className="w-2/3 bg-muted rounded-full h-3 sm:h-4">
            <div
              className="bg-[var(--band-via)] h-3 sm:h-4 rounded-full"
              style={{ width: `${quizCompletionPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm sm:text-base">
            {quizzesCompleted}/{quizzesTotal}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base">Average Score</span>
          <div className="w-2/3 bg-muted rounded-full h-3 sm:h-4">
            <div
              className="bg-green-500 h-3 sm:h-4 rounded-full"
              style={{ width: `${averageScore}%` }}
            ></div>
          </div>
          <span className="text-sm sm:text-base">{averageScore}%</span>
        </div>{' '}
      </div>
      <div className="mt-4 text-right">
        <a
          href="/leaderboard"
          className="text-sm text-brand hover:underline inline-flex items-center"
        >
          See how you rank <span className="ml-1">→</span>
        </a>
      </div>
    </section>
  );
};

export default WeeklyProgress;
