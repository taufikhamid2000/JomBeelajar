'use client';

import { useEffect, useState } from 'react';
import ContinueLearningCard from '@/components/dashboard/ContinueLearningCard';
import StreakXpStrip from '@/components/dashboard/StreakXpStrip';

const LAST_SUBJECT_KEY = 'jombeelajar:last-subject';
import { useRouter } from 'next/navigation';
import EnhancedWelcomeBanner from '@/components/dashboard/EnhancedWelcomeBanner';
import SubjectSearch from '@/components/dashboard/SubjectSearch';
import SubjectGrid from '@/components/dashboard/SubjectGrid';
import EnhancedWeeklyProgress from '@/components/dashboard/EnhancedWeeklyProgress';
import Achievements from '@/components/dashboard/Achievements';
import { WEEKLY_QUIZ_TARGET } from '@/config/app';

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category?: string;
  category_priority?: number;
  order_index?: number;
}

interface UserStats {
  weeklyProgress: {
    quizzesCompleted: number;
    quizzesTotal: number;
    averageScore: number;
  };
  achievements: Array<{
    title: string;
    description: string;
    bgColor: string;
  }>;
}

interface DashboardClientProps {
  initialUser: {
    email: string;
    display_name?: string;
    streak: number;
    xp: number;
    level: number;
    lastQuizDate: string;
  };
  initialSubjects: Subject[];
  initialCategories: string[];
  userStats?: UserStats;
  statsLoading?: boolean;
  statsError?: Error | null;
}

export default function DashboardClient({
  initialUser,
  initialSubjects,
  initialCategories,
  userStats,
  // statsLoading = false,
  // statsError,
}: DashboardClientProps) {
  const router = useRouter();
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        setLastSlug(localStorage.getItem(LAST_SUBJECT_KEY));
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const subjectsPerPage = 9;

  // Filter subjects based on search query and category
  const filteredSubjects = initialSubjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subject.description?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      );
    const matchesCategory =
      selectedCategory === 'all' || subject.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get current subjects for the selected page
  const indexOfLastSubject = currentPage * subjectsPerPage;
  const indexOfFirstSubject = indexOfLastSubject - subjectsPerPage;
  const currentSubjects = filteredSubjects.slice(
    indexOfFirstSubject,
    indexOfLastSubject
  );
  const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Scroll to top of subjects section
    document
      .getElementById('subjects-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const rememberSubject = (slug: string) => {
    try {
      localStorage.setItem(LAST_SUBJECT_KEY, slug);
    } catch {
      /* ignore */
    }
    setLastSlug(slug);
  };

  const handleSubjectClick = (subject: Subject) => {
    rememberSubject(subject.slug);
    router.push(`/quiz/${subject.slug}/chapters`);
  };

  const lastSubject = initialSubjects.find((s) => s.slug === lastSlug);
  const heroSubject = lastSubject || initialSubjects[0];
  const hasHistory = !!lastSubject;
  // Achievement data - use from userStats or fallback to static
  const achievements = userStats?.achievements || [
    {
      title: 'Quiz Master',
      description: 'Completed 10 quizzes in a week',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'High Scorer',
      description: 'Scored above 90% in 5 quizzes',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Consistent Learner',
      description: 'Maintained a 7-day streak',
      bgColor: 'bg-yellow-100',
    },
  ];

  // Weekly progress data - use from userStats or fallback
  const weeklyProgress = userStats?.weeklyProgress || {
    quizzesCompleted: 7,
    quizzesTotal: WEEKLY_QUIZ_TARGET,
    averageScore: 85,
  };
  return (
    <main className="container mx-auto py-6 px-4 sm:px-6 md:px-8">
      <div className="flex flex-col gap-8 sm:gap-10 md:gap-12">
        {/* Welcome Section */}
        <EnhancedWelcomeBanner initialUser={initialUser} />
        <ContinueLearningCard
          subject={heroSubject}
          hasHistory={hasHistory}
          percent={0}
          onNavigate={rememberSubject}
        />
        <StreakXpStrip
          streak={initialUser.streak}
          xp={initialUser.xp}
          level={initialUser.level}
        />
        {/* Subjects Section */}
        <section id="subjects-section">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Courses
            </h2>
          </div>
          <SubjectSearch
            searchTerm={searchQuery}
            selectedCategory={selectedCategory}
            categories={initialCategories}
            handleSearchChange={handleSearchChange}
            handleCategoryChange={handleCategoryChange}
          />
          {/* Subjects Grid with Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {currentSubjects.length} of {filteredSubjects.length}{' '}
              subjects
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            </p>
          </div>
          <SubjectGrid
            subjects={currentSubjects}
            error={null}
            currentPage={currentPage}
            totalPages={totalPages}
            handleSubjectClick={handleSubjectClick}
            handlePageChange={handlePageChange}
            lastSlug={lastSlug}
          />
        </section>
        {/* Weekly Progress Section */}
        <EnhancedWeeklyProgress
          initialData={{
            quizzesCompleted: weeklyProgress.quizzesCompleted,
            quizzesTotal: weeklyProgress.quizzesTotal,
            averageScore: weeklyProgress.averageScore,
          }}
        />
        {/* Recent Achievements Section */}
        <Achievements achievements={achievements} />
      </div>
    </main>
  );
}
