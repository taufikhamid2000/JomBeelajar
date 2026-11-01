import React, { useState } from 'react';
import Link from 'next/link';
import { School, SchoolType } from '@/types/leaderboard';

interface SchoolLeaderboardTableProps {
  data: School[];
}

export default function SchoolLeaderboardTable({
  data,
}: SchoolLeaderboardTableProps) {
  const [selectedType, setSelectedType] = useState<SchoolType | 'all'>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');

  // Get unique states from data
  const states = ['all', ...new Set(data.map((school) => school.state))];

  // School types from the SchoolType enum
  const schoolTypes: Array<SchoolType | 'all'> = [
    'all',
    'SMK',
    'SMKA',
    'MRSM',
    'Sekolah Sains',
    'Sekolah Sukan',
    'Sekolah Seni',
    'SBP',
    'SMJK',
    'KV',
  ];

  // Filter data based on selections
  const filteredData = data.filter((school) => {
    if (selectedType !== 'all' && school.type !== selectedType) return false;
    if (selectedState !== 'all' && school.state !== selectedState) return false;
    if (selectedDistrict !== 'all' && school.district !== selectedDistrict)
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-surface p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-soft">Total Schools</h3>
          <p className="text-2xl font-bold text-strong">{data.length}</p>
        </div>
        <div className="bg-surface p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-soft">Average Score</h3>
          <p className="text-2xl font-bold text-strong">
            {data.length > 0
              ? (
                  data.reduce((acc, school) => acc + school.averageScore, 0) /
                  data.length
                ).toFixed(1)
              : 'N/A'}
          </p>
        </div>
        <div className="bg-surface p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-soft">Participation Rate</h3>
          <p className="text-2xl font-bold text-strong">
            {data.length > 0
              ? (
                  data.reduce(
                    (acc, school) => acc + school.participationRate,
                    0
                  ) / data.length
                ).toFixed(1)
              : 'N/A'}
            {data.length > 0 ? '%' : ''}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-4 rounded-lg shadow space-y-4">
        <h3 className="text-sm font-medium text-soft">Filters</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-soft">School Type</label>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as SchoolType | 'all')
              }
              className="mt-1 block w-full rounded-md border-border text-sm"
            >
              {schoolTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-soft">State</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="mt-1 block w-full rounded-md border-border text-sm"
            >
              {states.map((state) => (
                <option key={state} value={state}>
                  {state === 'all' ? 'All States' : state}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-soft">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="mt-1 block w-full rounded-md border-border text-sm"
            >
              <option value="all">All Districts</option>
              {selectedState !== 'all' &&
                Array.from(
                  new Set(
                    data
                      .filter((school) => school.state === selectedState)
                      .map((school) => school.district)
                  )
                ).map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-surface rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                School
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                Average Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                Participation
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface divide-y divide-border">
            {filteredData.map((school, index) => {
              const rowClass =
                index < 3
                  ? 'bg-brand-soft/50 dark:bg-[var(--band-via)]/20'
                  : 'hover:bg-surface-2';
              return (
                <tr
                  key={school.id}
                  className={`${rowClass} transition-colors duration-150`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index < 3 ? (
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 transition-transform hover:scale-110 ${
                            index === 0
                              ? 'bg-yellow-400 dark:bg-yellow-500'
                              : index === 1
                                ? 'bg-muted'
                                : 'bg-amber-600 dark:bg-amber-700'
                          }`}
                        >
                          <span className="text-white font-bold">
                            {index + 1}
                          </span>
                        </div>
                      ) : (
                        <span className="w-8 text-center mr-2 text-soft">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-strong">
                      <Link
                        href={`/schools/${school.id}`}
                        className="hover:text-brand transition-colors"
                      >
                        {school.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-brand-soft text-brand dark:bg-[var(--band-via)]">
                      {school.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-strong">{school.district}</div>
                    <div className="text-xs text-soft">{school.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        school.averageScore >= 90
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : school.averageScore >= 80
                            ? 'bg-brand-soft text-brand dark:bg-[var(--band-via)]/30'
                            : school.averageScore >= 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-muted text-strong'
                      }`}
                    >
                      {school.averageScore.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-grow">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`absolute h-full rounded-full ${
                              school.participationRate >= 90
                                ? 'bg-green-500'
                                : school.participationRate >= 75
                                  ? 'bg-[var(--band-via)]'
                                  : school.participationRate >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-muted'
                            }`}
                            style={{ width: `${school.participationRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="ml-2 text-sm text-soft">
                        {school.participationRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
