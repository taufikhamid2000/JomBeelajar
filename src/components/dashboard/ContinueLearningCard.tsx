import Link from 'next/link';
import { FiBookOpen } from 'react-icons/fi';

interface ContinueLearningCardProps {
  subject?: { name: string; slug: string; icon?: string };
  hasHistory: boolean;
  percent: number;
  onNavigate?: (slug: string) => void;
}

export default function ContinueLearningCard({
  subject,
  hasHistory,
  percent,
  onNavigate,
}: ContinueLearningCardProps) {
  if (!subject) return null;
  return (
    <section
      aria-label="Continue learning"
      className="band-gradient rounded-3xl p-5 shadow-card sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
        {hasHistory ? 'Continue learning' : 'Start your first lesson'}
      </p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl"
            aria-hidden="true"
          >
            {subject.icon || <FiBookOpen className="h-7 w-7" />}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold sm:text-2xl">
              {subject.name}
            </h2>
            <div className="mt-2 flex items-center gap-3">
              <div
                role="progressbar"
                aria-label={`${subject.name} progress`}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-40 overflow-hidden rounded-full bg-white/25 sm:w-56"
              >
                <div
                  className="h-full rounded-full bg-surface"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{percent}%</span>
            </div>
          </div>
        </div>
        <Link
          href={`/quiz/${subject.slug}/chapters`}
          onClick={() => onNavigate?.(subject.slug)}
          className="press inline-flex min-h-[48px] items-center justify-center rounded-full bg-surface px-8 text-base font-bold text-[#0b5f58] transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {hasHistory ? 'Continue' : 'Start learning'}
        </Link>
      </div>
    </section>
  );
}
