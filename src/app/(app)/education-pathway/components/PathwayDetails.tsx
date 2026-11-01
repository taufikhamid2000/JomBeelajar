'use client';

import { FC } from 'react';
import { EducationPathway, EducationOption } from '../types';
import PathwayComments from './PathwayComments';

interface PathwayDetailsProps {
  pathway: EducationPathway;
}

const PathwayDetails: FC<PathwayDetailsProps> = ({ pathway }) => {
  // Helper function to render individual education option
  const renderEducationOption = (option: EducationOption) => {
    return (
      <div className="bg-muted rounded-md p-4">
        <h5 className="text-sm font-medium text-strong">{option.name}</h5>
        <p className="mt-1 text-sm text-soft">{option.description}</p>
        {option.institutions && option.institutions.length > 0 && (
          <div className="mt-3">
            <h6 className="text-xs font-medium text-soft">
              Example Institutions
            </h6>
            <div className="mt-1 flex flex-wrap gap-1">
              {option.institutions.map((institution, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-strong"
                >
                  {institution}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h6 className="text-xs font-medium text-soft">Advantages</h6>
            <ul className="mt-1 text-xs text-soft list-disc list-inside space-y-1">
              {option.advantages.map((adv, i) => (
                <li key={i}>{adv}</li>
              ))}
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-medium text-soft">Challenges</h6>
            <ul className="mt-1 text-xs text-soft list-disc list-inside space-y-1">
              {option.challenges.map((challenge, i) => (
                <li key={i}>{challenge}</li>
              ))}
            </ul>
          </div>
        </div>
        {option.requirements && (
          <div className="mt-3">
            <h6 className="text-xs font-medium text-soft">Requirements</h6>
            <ul className="mt-1 text-xs text-soft list-disc list-inside space-y-1">
              {option.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}
        {option.link && (
          <div className="mt-3">
            <a
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-brand hover:text-brand"
            >
              Learn more about this option
              <svg
                className="inline-block ml-1 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface shadow overflow-hidden rounded-md">
      <div className="px-4 py-5 border-b border-border sm:px-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-strong">
            {pathway.career}
          </h3>
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
        <p className="mt-2 max-w-2xl text-sm text-soft">
          {pathway.description}
        </p>
        <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-soft">Salary Range</dt>
            <dd className="mt-1 text-sm text-strong">
              RM {pathway.careerOutlook.salaryRange.min.toLocaleString()} - RM{' '}
              {pathway.careerOutlook.salaryRange.max.toLocaleString()} /month
            </dd>
          </div>
          <div className="sm:col-span-1">
            <dt className="text-sm font-medium text-soft">Growth Outlook</dt>
            <dd className="mt-1 text-sm text-strong">
              {pathway.careerOutlook.growthOutlook}
            </dd>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 sm:p-6">
        <div className="space-y-8">
          {pathway.pathways.map((step, index) => (
            <div key={index} className="border-l-2 border-brand/40 pl-4 -ml-px">
              <h4 className="text-lg font-medium text-strong">
                {step.title}
                <span className="ml-2 text-sm font-normal text-soft">
                  ({step.duration})
                </span>
              </h4>
              <p className="mt-1 text-sm text-soft">{step.description}</p>

              <div className="mt-4 space-y-4">
                {step.options.map((option, optionIndex) => (
                  <div key={optionIndex}>{renderEducationOption(option)}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>{' '}
      {/* Add Comments section */}
      <PathwayComments pathwayId={pathway.id} />
    </div>
  );
};

export default PathwayDetails;
