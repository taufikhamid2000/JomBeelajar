import { Achievement } from '../types';

interface AchievementsTabProps {
  achievements: Achievement[];
  onAwardClick: () => void;
}

export default function AchievementsTab({
  achievements,
  onAwardClick,
}: AchievementsTabProps) {
  return (
    <div>
      <h2 className="text-lg font-medium text-strong mb-4">
        User Achievements
      </h2>
      {!achievements || achievements.length === 0 ? (
        <p className="text-soft py-4">
          This user has not earned any achievements yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="border rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="h-10 w-10 rounded-full bg-brand-soft dark:bg-[var(--band-via)] flex items-center justify-center mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-brand"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-strong">
                    {achievement.title}
                  </h3>
                  <p className="text-sm text-soft">{achievement.description}</p>
                </div>
              </div>
              <div className="text-xs text-soft">
                Earned on{' '}
                {new Date(achievement.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6">
        <button
          onClick={onAwardClick}
          className="px-4 py-2 bg-[var(--band-via)] text-white rounded hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)]"
        >
          Award Achievement
        </button>
      </div>
    </div>
  );
}
