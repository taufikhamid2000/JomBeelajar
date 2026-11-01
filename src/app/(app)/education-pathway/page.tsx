'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  PathwaySearch,
  PathwayList,
  PathwayDetails,
  ContributionForm,
} from './components';
import { pathwayData, type EducationPathway } from '.';

export default function EducationPathwayPage() {
  const [selectedPathway, setSelectedPathway] =
    useState<EducationPathway | null>(null);
  const [isContributing, setIsContributing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPathways = searchQuery
    ? pathwayData.filter(
        (pathway) =>
          pathway.career.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pathway.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pathwayData;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setSelectedPathway(null);
  };

  const handleSelectPathway = (pathway: EducationPathway) => {
    setSelectedPathway(pathway);
    setIsContributing(false);
  };

  const handleStartContribution = () => {
    setIsContributing(true);
    setSelectedPathway(null);
  };

  const handleCancelContribution = () => {
    setIsContributing(false);
  };

  const handleContributionSuccess = () => {
    setIsContributing(false);
    // We could show a success message or other feedback here
  };

  return (
    <div className="min-h-screen bg-surface py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-strong sm:text-4xl">
            Education Pathway Guide
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-soft sm:mt-4">
            Discover the right educational path after SPM to reach your career
            goals
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/career-guidance"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-brand bg-surface dark:bg-brand-soft hover:bg-muted dark:hover:bg-brand-soft focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40"
            >
              View Subject Guidance
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 -mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
            <button
              onClick={handleStartContribution}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand/40"
            >
              Contribute a Pathway
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 -mr-1 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        {isContributing ? (
          <div className="mt-8">
            <ContributionForm
              onCancel={handleCancelContribution}
              onSubmitSuccess={handleContributionSuccess}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                <PathwaySearch
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <div className="mt-6 bg-surface shadow overflow-hidden rounded-md">
                  <PathwayList
                    pathways={filteredPathways}
                    onSelect={handleSelectPathway}
                    selectedId={selectedPathway?.id}
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              {selectedPathway ? (
                <PathwayDetails pathway={selectedPathway} />
              ) : (
                <div className="bg-surface shadow overflow-hidden rounded-md p-6 text-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto h-12 w-12 text-soft"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-strong">
                    No pathway selected
                  </h3>
                  <p className="mt-1 text-sm text-soft">
                    Select a career pathway from the list or search for a
                    specific career
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
