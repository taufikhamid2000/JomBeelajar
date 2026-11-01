'use client';

import { FC } from 'react';
import { CareerPathway } from '../types';

interface CareerListProps {
  careerPathways: CareerPathway[];
  onSelectCareer: (careerId: string) => void;
}

const CareerList: FC<CareerListProps> = ({
  careerPathways,
  onSelectCareer,
}) => {
  return (
    <div className="mt-20 pb-12">
      {' '}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-strong">
          Explore Careers by Required Subjects
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-soft">
          Click on any career below to see which school subjects are most
          important for success in that field
        </p>
        <div className="mt-4 inline-flex items-center px-4 py-2 rounded-md bg-muted/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-amber-400 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm text-soft">
            Tip: Each career card shows the subjects most relevant for that
            career path
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {careerPathways.map((career) => (
          <div
            key={career.id}
            className="bg-surface shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 border border-border"
            onClick={() => {
              onSelectCareer(career.id);
              // Scroll to the career details section
              document
                .getElementById('career-details')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <div className="px-6 py-6">
              <div className="mb-4 w-12 h-12 rounded-full bg-[var(--band-via)]/30 dark:bg-brand-soft flex items-center justify-center">
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
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-strong">{career.title}</h3>
              <p className="mt-2 text-soft">{career.description}</p>
            </div>{' '}
            <div className="px-6 py-3 bg-muted bg-opacity-50 flex justify-between items-center">
              <span className="text-sm font-medium text-brand">
                See recommended subjects
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-brand"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerList;
