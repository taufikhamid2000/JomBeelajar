import React from 'react';

interface Achievement {
  title: string;
  description: string;
  bgColor: string;
}

interface AchievementsProps {
  achievements: Achievement[];
  isStatic?: boolean;
}

const Achievements = ({
  achievements,
  isStatic = false,
}: AchievementsProps) => {
  const leaderboardPath = isStatic ? '/static/leaderboard' : '/leaderboard';

  return (
    <section className="dashboard-section achievements bg-surface p-3 sm:p-4 md:p-6 rounded-lg shadow-md text-strong">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
        Recent Achievements
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {' '}
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className={`achievement-card ${achievement.bgColor} p-3 sm:p-4 rounded-lg shadow dark:bg-opacity-70`}
          >
            <h3 className="text-base sm:text-lg font-semibold text-strong">
              {achievement.title}
            </h3>
            <p className="text-xs sm:text-sm text-soft">
              {achievement.description}
            </p>
          </div>
        ))}{' '}
      </div>{' '}
      <div className="mt-4 text-center">
        <a
          href={leaderboardPath}
          className="inline-block px-4 py-2 bg-brand-soft hover:bg-brand-soft text-brand rounded-full text-sm font-medium transition-colors dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
        >
          {' '}
          View Leaderboard
        </a>
      </div>
    </section>
  );
};

export default Achievements;
