import Link from 'next/link';

interface LeaderboardNavProps {
  activeTab: 'students' | 'schools';
  isStatic?: boolean;
}

export default function LeaderboardNav({
  activeTab,
  isStatic = false,
}: LeaderboardNavProps) {
  return (
    <div className="mb-8">
      <div className="border-b border-border">
        <nav
          className="-mb-px flex space-x-8"
          aria-label="Leaderboard navigation"
        >
          <Link
            href={isStatic ? '/static/leaderboard' : '/leaderboard'}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-brand/40 text-brand'
                : 'border-transparent text-soft hover:text-soft hover:border-border'
            }`}
          >
            Student Rankings
          </Link>
          <Link
            href={
              isStatic ? '/static/leaderboard/schools' : '/leaderboard/schools'
            }
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schools'
                ? 'border-brand/40 text-brand'
                : 'border-transparent text-soft hover:text-soft hover:border-border'
            }`}
          >
            School Rankings
          </Link>
        </nav>
      </div>
    </div>
  );
}
