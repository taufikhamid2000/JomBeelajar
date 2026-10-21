'use client';

import { FC, useState } from 'react';
import { PathwayOptionDetail } from '../types';

interface PathwayOptionInputProps {
  option: PathwayOptionDetail;
  onChange: (updatedOption: PathwayOptionDetail) => void;
  onDelete: () => void;
  index: number;
}

// Component to render array items with delete button
const ArrayItems = ({
  items,
  onRemove,
  colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
}: {
  items: string[];
  onRemove: (index: number) => void;
  colorClass?: string;
}) => (
  <div className="mt-2">
    {items.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${colorClass}`}
          >
            {item}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Remove {item}</span>
              <svg
                className="h-3 w-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        ))}
      </div>
    )}
  </div>
);

const PathwayOptionInput: FC<PathwayOptionInputProps> = ({
  option,
  onChange,
  onDelete,
  index,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleChange = (
    field: keyof PathwayOptionDetail,
    value: string | string[]
  ) => {
    onChange({
      ...option,
      [field]: value,
    });
  };

  const handleAddItem = (
    field: 'institutions' | 'advantages' | 'challenges' | 'requirements',
    value: string
  ) => {
    if (value.trim()) {
      const currentArray = option[field] || [];
      handleChange(field, [...currentArray, value.trim()]);
      return true;
    }
    return false;
  };

  const handleRemoveItem = (
    field: 'institutions' | 'advantages' | 'challenges' | 'requirements',
    index: number
  ) => {
    const currentArray = option[field] || [];
    handleChange(
      field,
      currentArray.filter((_, i) => i !== index)
    );
  };

  const [institutionInput, setInstitutionInput] = useState('');
  const [advantageInput, setAdvantageInput] = useState('');
  const [challengeInput, setChallengeInput] = useState('');
  const [requirementInput, setRequirementInput] = useState('');

  return (
    <div className="bg-gray-700 dark:bg-gray-100 p-4 rounded-md mb-4 border border-gray-600 dark:border-gray-300">
      <div className="flex justify-between items-center mb-3">
        <div className="font-medium text-white dark:text-gray-900">
          Option {index + 1}
        </div>
        <button
          onClick={onDelete}
          type="button"
          className="text-red-400 hover:text-red-300 dark:text-red-600 dark:hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="mb-3">
        <label
          htmlFor={`option-name-${index}`}
          className="block text-sm font-medium text-gray-300 dark:text-gray-700"
        >
          Name*
        </label>
        <input
          type="text"
          id={`option-name-${index}`}
          value={option.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
          placeholder="e.g., STPM, Foundation in Computing, Bachelor of Computer Science"
          required
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor={`option-description-${index}`}
          className="block text-sm font-medium text-gray-300 dark:text-gray-700"
        >
          Description*
        </label>
        <textarea
          id={`option-description-${index}`}
          value={option.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
          placeholder="Brief description of this education option"
          required
        />
      </div>

      <div className="mb-3">
        <label
          htmlFor={`option-duration-${index}`}
          className="block text-sm font-medium text-gray-300 dark:text-gray-700"
        >
          Duration
        </label>
        <input
          type="text"
          id={`option-duration-${index}`}
          value={option.duration || ''}
          onChange={(e) => handleChange('duration', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
          placeholder="e.g., 1-2 years, 3-4 years"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="mt-1 text-sm flex items-center text-indigo-400 hover:text-indigo-300 dark:text-indigo-700 dark:hover:text-indigo-800"
      >
        {showDetails ? 'Hide' : 'Show'} additional details
        <svg
          className={`ml-1 h-4 w-4 transform ${showDetails ? 'rotate-180' : ''}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDetails && (
        <div className="mt-4 space-y-4">
          {/* Institutions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-700">
              Institutions
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={institutionInput}
                onChange={(e) => setInstitutionInput(e.target.value)}
                className="flex-1 min-w-0 block w-full rounded-l-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
                placeholder="Add an institution offering this option"
              />
              <button
                type="button"
                onClick={() => {
                  if (handleAddItem('institutions', institutionInput)) {
                    setInstitutionInput('');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white"
              >
                Add
              </button>
            </div>
            <ArrayItems
              items={option.institutions || []}
              onRemove={(idx) => handleRemoveItem('institutions', idx)}
              colorClass="bg-gray-600 text-white dark:bg-gray-200 dark:text-gray-800"
            />
          </div>

          {/* Advantages */}
          <div>
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-700">
              Advantages
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={advantageInput}
                onChange={(e) => setAdvantageInput(e.target.value)}
                className="flex-1 min-w-0 block w-full rounded-l-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
                placeholder="Add an advantage of this option"
              />
              <button
                type="button"
                onClick={() => {
                  if (handleAddItem('advantages', advantageInput)) {
                    setAdvantageInput('');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white"
              >
                Add
              </button>
            </div>
            <ArrayItems
              items={option.advantages || []}
              onRemove={(idx) => handleRemoveItem('advantages', idx)}
              colorClass="bg-green-900/50 text-green-300 dark:bg-green-100 dark:text-green-800"
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-700">
              Challenges
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                className="flex-1 min-w-0 block w-full rounded-l-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
                placeholder="Add a challenge of this option"
              />
              <button
                type="button"
                onClick={() => {
                  if (handleAddItem('challenges', challengeInput)) {
                    setChallengeInput('');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white"
              >
                Add
              </button>
            </div>
            <ArrayItems
              items={option.challenges || []}
              onRemove={(idx) => handleRemoveItem('challenges', idx)}
              colorClass="bg-red-900/50 text-red-300 dark:bg-red-100 dark:text-red-800"
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-300 dark:text-gray-700">
              Requirements
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                className="flex-1 min-w-0 block w-full rounded-l-md border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-600 dark:bg-white text-white dark:text-gray-900 sm:text-sm"
                placeholder="Add a requirement for this option"
              />
              <button
                type="button"
                onClick={() => {
                  if (handleAddItem('requirements', requirementInput)) {
                    setRequirementInput('');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-white"
              >
                Add
              </button>
            </div>
            <ArrayItems
              items={option.requirements || []}
              onRemove={(idx) => handleRemoveItem('requirements', idx)}
              colorClass="bg-amber-900/50 text-amber-300 dark:bg-amber-100 dark:text-amber-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PathwayOptionInput;
