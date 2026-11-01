'use client';

import { FC } from 'react';
import SubjectCard from './SubjectCard';
import { EnhancedSubject } from '../types';

interface SubjectCategoryProps {
  title: string;
  description: string;
  colorScheme: 'red' | 'amber' | 'green';
  subjects: EnhancedSubject[];
  isLoading: boolean;
}

const SubjectCategory: FC<SubjectCategoryProps> = ({
  title,
  description,
  colorScheme,
  subjects,
  isLoading,
}) => {
  const colorMap = {
    red: {
      bg: 'bg-red-950/30',
      border: 'border-red-900/30',
      header: 'bg-red-500/80',
      text: 'text-red-100',
      loading: 'border-red-400',
      divider: 'divide-red-900/50',
    },
    amber: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-900/30',
      header: 'bg-amber-500/80',
      text: 'text-amber-100',
      loading: 'border-amber-400',
      divider: 'divide-amber-900/50',
    },
    green: {
      bg: 'bg-green-950/30',
      border: 'border-green-900/30',
      header: 'bg-green-500/80',
      text: 'text-green-100',
      loading: 'border-green-400',
      divider: 'divide-green-900/50',
    },
  };

  return (
    <div
      className={`${colorMap[colorScheme].bg} rounded-lg shadow-lg overflow-hidden border ${colorMap[colorScheme].border}`}
    >
      <div className={`px-6 py-4 ${colorMap[colorScheme].header}`}>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className={`${colorMap[colorScheme].text} text-sm`}>{description}</p>
      </div>
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div
              className={`animate-spin rounded-full h-8 w-8 border-b-2 ${colorMap[colorScheme].loading}`}
            ></div>
          </div>
        ) : subjects.length > 0 ? (
          <ul className={`divide-y ${colorMap[colorScheme].divider}`}>
            {subjects.map((subject, index) => (
              <SubjectCard
                key={`${subject.id}-${title}-${index}`}
                subject={subject}
                colorScheme={colorScheme}
              />
            ))}
          </ul>
        ) : (
          <div className="py-4 text-center text-soft">
            No SPM subjects found for this category
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectCategory;
