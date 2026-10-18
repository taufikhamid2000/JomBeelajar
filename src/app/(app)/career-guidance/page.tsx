'use client';

import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { PublicSubject } from '@/services/subjectService';
import { careerPathways, subjectMapping } from './data';
import { useSubjectMatcher } from './hooks/useSubjectMatcher';
import CareerSearch from './components/CareerSearch';
import CareerDetails from './components/CareerDetails';
import CareerList from './components/CareerList';

export default function CareerGuidancePage() {
  const router = useRouter();
  const [selectedCareerId, setSelectedCareerId] = useState<string>('');

  // Create local subjects from subject mapping
  const subjects: PublicSubject[] = Object.entries(subjectMapping).map(
    ([id, details]) => ({
      id,
      name: details.name,
      description: details.description,
      slug: id,
      icon: '',
    })
  );

  // No loading state needed since we're using local data
  const isLoading = false;

  // Get selected career details
  const selectedCareer = careerPathways.find(
    (career) => career.id === selectedCareerId
  );

  // Use the custom hook to get the subject matcher
  const { getSubjectsByIds } = useSubjectMatcher(subjects);

  // Mock contribution info for each career
  const contributionInfo = {
    'software-engineer': {
      submitterName: 'Dr. Ahmad Khan',
      submitterEmail: 'ahmad.khan@tech.edu.my',
      additionalNotes:
        'Software Engineering careers in Malaysia are growing rapidly. Students should focus on building practical coding skills through side projects alongside their SPM subjects. Looking ahead to university, consider programs with strong industry partnerships.',
    },
    'medical-doctor': {
      submitterName: 'Dr. Mei Ling Tan',
      submitterEmail: 'mei.tan@medschool.my',
      additionalNotes:
        'Medical education in Malaysia requires excellent academic credentials, particularly in biology, chemistry and physics. Students should also develop strong communication skills and consider volunteer work in healthcare settings to gain experience.',
    },
    'business-manager': {
      submitterName: 'Prof. Raj Kumar',
      submitterEmail: 'raj.kumar@business.edu.my',
      additionalNotes:
        'Business management students should develop analytical thinking through mathematics while also focusing on communication skills through language subjects. Practical experience through small business projects or internships will complement the theoretical knowledge gained in SPM subjects.',
    },
  };

  // Handle selecting a career
  const handleSelectCareer = (careerId: string) => {
    setSelectedCareerId(careerId);
  };

  return (
    <>
      <Head>
        <title>Career Guidance - JomBeelajar</title>
      </Head>
      <div className="min-h-screen bg-gray-900 dark:bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          {' '}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white dark:text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Subject-Based Career Guidance
            </h1>{' '}
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-300 dark:text-gray-500">
              Find careers that match your favorite subjects or discover which
              subjects you need to focus on for your dream career path{' '}
            </p>
          </div>{' '}
          <div className="mt-8 mb-6 max-w-3xl mx-auto">
            <div className="bg-gray-800 dark:bg-gray-100 rounded-lg p-5 shadow-lg">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-blue-400 dark:text-blue-700 hover:text-blue-300 dark:hover:text-blue-600">
                  How to Use This Tool
                </summary>
                <div className="mt-2 pl-4 border-l-2 border-blue-800/30 dark:border-blue-300/30">
                  {' '}
                  <ol className="list-decimal pl-5 text-gray-300 dark:text-gray-600 space-y-2">
                    <li>
                      <span className="font-medium text-gray-200 dark:text-gray-700">
                        Search for careers
                      </span>{' '}
                      by typing keywords in the search box or browse the list
                      below
                    </li>
                    <li>
                      <span className="font-medium text-gray-200 dark:text-gray-700">
                        Click on a career
                      </span>{' '}
                      to see which subjects are most important for that path
                    </li>
                    <li>
                      <span className="font-medium text-gray-200 dark:text-gray-700">
                        Explore subject details
                      </span>{' '}
                      to understand their relevance to your chosen career
                    </li>
                  </ol>
                </div>
              </details>
            </div>
          </div>{' '}
          {/* Career Search Component */}
          <CareerSearch
            careerPathways={careerPathways}
            onSelectCareer={handleSelectCareer}
          />{' '}
          {/* Career List Grid Component */}
          <div className="mt-6">
            <CareerList
              careerPathways={careerPathways}
              onSelectCareer={handleSelectCareer}
            />
          </div>
          {/* Career Details Component - Only shown when a career is selected */}
          {selectedCareer && (
            <>
              <CareerDetails
                career={selectedCareer}
                isLoading={isLoading}
                getSubjectsByIds={getSubjectsByIds}
                contributionInfo={
                  contributionInfo[
                    selectedCareer.id as keyof typeof contributionInfo
                  ]
                }
              />
              <div className="mt-6 text-center">
                <a
                  href="/education-pathway"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-300 dark:text-indigo-700 bg-gray-800 dark:bg-indigo-100 hover:bg-gray-700 dark:hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Explore Education Pathways for {selectedCareer.title}
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
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </a>
              </div>
            </>
          )}{' '}
          {/* Call to action for contributions */}
          <div className="mt-12 pt-8 border-t border-gray-800 dark:border-gray-200">
            <div className="text-center">
              {' '}
              <h2 className="text-2xl font-bold text-white dark:text-gray-900">
                Don&apos;t see your career path or have subject insights to
                share?
              </h2>
              <p className="mt-3 text-lg text-gray-300 dark:text-gray-600">
                Share your knowledge about which subjects are most relevant for
                specific careers and help students make better educational
                choices.
              </p>{' '}
              <div className="mt-4">
                <button
                  onClick={() => router.push('/career-guidance/contribute')}
                  className="inline-flex items-center px-5 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Subject-Career Information
                </button>
              </div>
            </div>{' '}
          </div>
        </div>
      </div>
    </>
  );
}
