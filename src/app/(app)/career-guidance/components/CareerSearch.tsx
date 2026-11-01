'use client';

import { FC, useState, useMemo } from 'react';
import { CareerPathway } from '../types';

interface CareerSearchProps {
  careerPathways: CareerPathway[];
  onSelectCareer: (careerId: string) => void;
}

const CareerSearch: FC<CareerSearchProps> = ({
  careerPathways,
  onSelectCareer,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter careers based on search term
  const filteredCareers = useMemo(() => {
    if (!searchTerm) return [];

    return careerPathways.filter((career) =>
      career.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, careerPathways]);

  return (
    <div className="mt-12 max-w-lg mx-auto">
      {' '}
      <label
        htmlFor="career-search"
        className="block text-sm font-medium text-soft"
      >
        Search for a career to see required subjects:
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="text"
          name="career-search"
          id="career-search"
          className="focus:ring-brand/40 focus:border-brand/40 block w-full pl-4 pr-12 py-3 sm:text-lg border-border rounded-md bg-surface text-strong"
          placeholder="Type a career title (e.g., Software Engineer, Doctor, Accountant)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>{' '}
      {searchTerm && (
        <ul className="mt-2 bg-surface shadow-md rounded-md divide-y divide-border">
          {filteredCareers.length > 0 ? (
            filteredCareers.map((career) => (
              <li
                key={career.id}
                className="px-4 py-3 cursor-pointer hover:bg-muted"
                onClick={() => {
                  onSelectCareer(career.id);
                  setSearchTerm('');
                }}
              >
                <div className="flex items-center">
                  <div className="text-lg font-medium text-strong">
                    {career.title}
                  </div>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--band-via)] text-brand dark:bg-brand-soft">
                    Click to view subjects
                  </span>
                </div>
                <div className="text-sm text-soft">{career.description}</div>
              </li>
            ))
          ) : (
            <li className="px-4 py-3">
              <div className="text-center">
                <p className="text-soft">No matching careers found</p>
                <p className="text-sm text-soft mt-1">
                  Try a different search term or browse the careers below
                </p>
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CareerSearch;
