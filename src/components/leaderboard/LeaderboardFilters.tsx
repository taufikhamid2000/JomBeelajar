import React from 'react';

interface LeaderboardFiltersProps {
  timeFrame: 'daily' | 'weekly' | 'allTime';
  onTimeFrameChange: (value: 'daily' | 'weekly' | 'allTime') => void;
  subjectFilter: string | null;
  onSubjectFilterChange: (subjectId: string | null) => void;
}

export default function LeaderboardFilters({
  timeFrame,
  onTimeFrameChange,
  // subjectFilter,
  // onSubjectFilterChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <div className="flex items-center space-x-2 md:space-x-4">
        <span className="text-sm text-soft font-medium">Time:</span>
        <div className="inline-flex bg-muted rounded-lg p-1">
          <button
            onClick={() => onTimeFrameChange('daily')}
            className={`px-3 py-2.5 text-sm rounded-md transition-colors ${
              timeFrame === 'daily'
                ? 'bg-surface shadow-sm text-brand font-medium'
                : 'text-soft hover:bg-muted'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => onTimeFrameChange('weekly')}
            className={`px-3 py-2.5 text-sm rounded-md transition-colors ${
              timeFrame === 'weekly'
                ? 'bg-surface shadow-sm text-brand font-medium'
                : 'text-soft hover:bg-muted'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => onTimeFrameChange('allTime')}
            className={`px-3 py-2.5 text-sm rounded-md transition-colors ${
              timeFrame === 'allTime'
                ? 'bg-surface shadow-sm text-brand font-medium'
                : 'text-soft hover:bg-muted'
            }`}
          >
            All Time
          </button>
        </div>
      </div>
      {/* <div className="flex items-center space-x-2 md:space-x-4">
        <span className="text-sm text-soft font-medium">
          Subject:
        </span>
        <select
          value={subjectFilter || ''}
          onChange={(e) => onSubjectFilterChange(e.target.value || null)}
          className="border rounded-md px-3 py-1.5 text-sm bg-surface text-strong focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="">All Subjects</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div> */}
    </div>
  );
}
