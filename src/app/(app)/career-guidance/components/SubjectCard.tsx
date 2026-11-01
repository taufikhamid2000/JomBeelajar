'use client';

import { FC } from 'react';
import Link from 'next/link';
import { EnhancedSubject } from '../types';

interface SubjectCardProps {
  subject: EnhancedSubject;
  colorScheme: 'red' | 'amber' | 'green';
}

const SubjectCard: FC<SubjectCardProps> = ({ subject, colorScheme }) => {
  const colorClasses = {
    red: {
      topic: 'bg-red-800/30 text-red-300',
    },
    amber: {
      topic: 'bg-amber-800/30 text-amber-300',
    },
    green: {
      topic: 'bg-green-800/30 text-green-300',
    },
  }; // Generate the URL for the subject using the name converted to kebab-case
  // This matches the format in your table (mathematics, bahasa-melayu, etc.)
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const subjectSlug = generateSlug(subject.name);
  const subjectUrl = `/quiz/${subjectSlug}/chapters`;

  return (
    <li className="py-4">
      <Link href={subjectUrl} className="group">
        <h4 className="text-lg font-semibold text-strong group-hover:text-brand transition-colors">
          {subject.name}
          <span className="inline-block ml-1 text-brand opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </h4>
      </Link>
      <p className="mt-2 text-sm text-soft">{subject.description}</p>{' '}
      {subject.topics && subject.topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {subject.topics.map((topic: string, idx: number) => (
            <span
              key={idx}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[colorScheme].topic}`}
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </li>
  );
};

export default SubjectCard;
