import React from 'react';
import Link from 'next/link';
import { School, SchoolStats } from '@/types/schools';

interface SchoolProfileContentProps {
  school: School & {
    stats: SchoolStats;
    teacherCount: number;
    studentCount: number;
    topStudents: Array<{
      id: string;
      full_name: string;
      total_points: number;
      total_correct_answers: number;
      total_quizzes_completed: number;
    }>;
  };
}

export default function SchoolProfileContent({
  school,
}: SchoolProfileContentProps) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li>
              <Link
                href="/leaderboard/schools"
                className="text-sm text-brand hover:text-brand"
              >
                Schools
              </Link>
            </li>
            <li>
              <span className="text-soft mx-2">/</span>
            </li>
            <li>
              <span className="text-soft">{school.name}</span>
            </li>
          </ol>
        </nav>
        <h1 className="text-3xl font-bold text-strong">{school.name}</h1>
        <div className="mt-2 flex items-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-soft text-brand dark:bg-[var(--band-via)]">
            {school.type}
          </span>
          <span className="mx-2 text-soft">•</span>
          <span className="text-soft">
            {school.district}, {school.state}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-soft">Average Score</h3>
          <p className="mt-2 text-3xl font-bold text-strong">
            {school.stats?.average_score?.toFixed(1) ?? 'N/A'}
            {school.stats?.average_score ? '%' : ''}
          </p>
          <div className="mt-2 flex items-center text-sm">
            <div
              className={`h-2 w-full rounded-full ${
                school.stats?.average_score >= 90
                  ? 'bg-green-500'
                  : school.stats?.average_score >= 80
                    ? 'bg-[var(--band-via)]'
                    : school.stats?.average_score >= 70
                      ? 'bg-yellow-500'
                      : 'bg-muted'
              }`}
            />
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-soft">Student Population</h3>
          <p className="mt-2 text-3xl font-bold text-strong">
            {school.studentCount?.toLocaleString() ?? 'N/A'}
          </p>
          <p className="mt-2 text-sm text-soft">
            {school.teacherCount} teachers
          </p>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-soft">Participation Rate</h3>
          <p className="mt-2 text-3xl font-bold text-strong">
            {school.stats?.participation_rate?.toFixed(1) ?? 'N/A'}
            {school.stats?.participation_rate ? '%' : ''}
          </p>
          <div className="mt-2 flex items-center text-sm">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--band-via)] rounded-full"
                style={{
                  width: `${school.stats?.participation_rate}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-soft">Total Quizzes Taken</h3>
          <p className="mt-2 text-3xl font-bold text-strong">
            {school.stats?.total_quizzes_taken.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-soft">
            {(
              ((school.stats?.correct_answers || 0) /
                (school.stats?.total_questions_answered || 1)) *
              100
            ).toFixed(1)}
            % correct answers
          </p>
        </div>{' '}
      </div>

      {/* Hall of Fame */}
      <div className="bg-surface rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-strong mb-4">Hall of Fame</h2>
        {school.topStudents.length > 0 ? (
          <div className="grid gap-4">
            {school.topStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center space-x-4 p-4 rounded-lg bg-surface-2"
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-brand-soft dark:bg-[var(--band-via)]">
                  <span className="text-xl font-bold text-brand">
                    #{index + 1}
                  </span>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-strong">
                    {student.full_name}
                  </h3>
                  <div className="mt-1 text-sm text-soft">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mr-2">
                      {student.total_points.toLocaleString()} points
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-soft text-brand dark:bg-[var(--band-via)]">
                      {student.total_quizzes_completed} quizzes completed
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="text-sm font-medium text-strong">
                    {(
                      (student.total_correct_answers /
                        (student.total_quizzes_completed * 10)) *
                      100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="text-xs text-soft">accuracy</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-soft text-center py-4">
            No students have completed any quizzes yet.
          </p>
        )}
      </div>

      {/* School Details */}
      <div className="bg-surface rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold text-strong mb-4">
          School Information
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-soft mb-2">
              Contact Information
            </h3>
            <dl className="space-y-2">
              {school.phone && (
                <div>
                  <dt className="text-sm text-soft">Phone</dt>
                  <dd className="text-sm font-medium text-strong">
                    {school.phone}
                  </dd>
                </div>
              )}
              {school.website && (
                <div>
                  <dt className="text-sm text-soft">Website</dt>
                  <dd className="text-sm font-medium text-strong">
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:text-brand"
                    >
                      {school.website}
                    </a>
                  </dd>
                </div>
              )}
              {school.address && (
                <div>
                  <dt className="text-sm text-soft">Address</dt>
                  <dd className="text-sm font-medium text-strong">
                    {school.address}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-medium text-soft mb-2">
              Administration
            </h3>
            <dl className="space-y-2">
              {school.principal_name && (
                <div>
                  <dt className="text-sm text-soft">Principal</dt>
                  <dd className="text-sm font-medium text-strong">
                    {school.principal_name}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-soft">School Code</dt>
                <dd className="text-sm font-medium text-strong">
                  {school.code || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
