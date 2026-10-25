import Link from 'next/link';

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
      className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-md sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
        {hasHistory ? 'Continue learning' : 'Start your first lesson'}
      </p>
      <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl"
            aria-hidden="true"
          >
            {subject.icon || '📘'}
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
                  className="h-full rounded-full bg-white"
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
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
        >
          {hasHistory ? 'Continue' : 'Start learning'}
        </Link>
      </div>
    </section>
  );
}
