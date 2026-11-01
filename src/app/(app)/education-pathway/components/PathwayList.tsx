'use client';

import { FC } from 'react';
import { EducationPathway } from '../types';

interface PathwayListProps {
  pathways: EducationPathway[];
  onSelect: (pathway: EducationPathway) => void;
  selectedId?: string;
}

const PathwayList: FC<PathwayListProps> = ({
  pathways,
  onSelect,
  selectedId,
}) => {
  if (pathways.length === 0) {
    return (
      <div className="px-4 py-5 text-center text-soft">
        No pathways match your search.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {pathways.map((pathway) => (
        <li key={pathway.id}>
          <button
            className={`w-full text-left px-4 py-5 focus:outline-none ${
              selectedId === pathway.id
                ? 'bg-muted dark:bg-brand-soft'
                : 'hover:bg-muted'
            }`}
            onClick={() => onSelect(pathway)}
          >
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-brand">
                  {pathway.career}
                </h3>
                <p className="mt-1 text-xs text-soft line-clamp-2">
                  {pathway.description}
                </p>
              </div>
              <div className="flex-shrink-0 ml-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pathway.careerOutlook.demand === 'high'
                      ? 'bg-green-900 text-green-200 dark:bg-green-100 dark:text-green-800'
                      : pathway.careerOutlook.demand === 'medium'
                        ? 'bg-yellow-900 text-yellow-200 dark:bg-yellow-100 dark:text-yellow-800'
                        : 'bg-red-900 text-red-200 dark:bg-red-100 dark:text-red-800'
                  }`}
                >
                  {pathway.careerOutlook.demand.charAt(0).toUpperCase() +
                    pathway.careerOutlook.demand.slice(1)}{' '}
                  demand
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-soft">
              <span className="font-medium">Salary range:</span> RM
              {pathway.careerOutlook.salaryRange.min.toLocaleString()} - RM
              {pathway.careerOutlook.salaryRange.max.toLocaleString()} /month
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
};

export default PathwayList;
