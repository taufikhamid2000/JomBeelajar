import React from 'react';
import { useRouter } from 'next/navigation';

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

interface SubjectListProps {
  subjects: Subject[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
  error: string | null;
}

const SubjectList = ({
  subjects,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  error,
}: SubjectListProps) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState(1);
  const subjectsPerPage = 12;

  const handleSubjectClick = (slug: string) => {
    router.push(`/quiz/${slug}/chapters`);
  };

  // Filter subjects based on search query and selected category
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (subject.category || 'Uncategorized') === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Calculate pagination
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

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <section id="subjects-section">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4 md:mb-0">
          Subjects
        </h2>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 lg:w-80">
          <input
            type="text"
            placeholder="Search subjects..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}
              onClick={() => {
                setSelectedCategory(category);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              {category === 'all' ? 'All Subjects' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Subjects Grid with Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Showing {currentSubjects.length} of {filteredSubjects.length} subjects
          {searchQuery && ` matching "${searchQuery}"`}
          {selectedCategory !== 'all' && ` in ${selectedCategory}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {error ? (
          <div className="text-red-500 bg-red-100 p-3 sm:p-4 rounded dark:bg-red-900">
            Error loading subjects: {error}
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center p-3 sm:p-4 dark:text-gray-300 col-span-3">
            <p>
              No subjects found matching your search or filter. Try different
              criteria.
            </p>
          </div>
        ) : (
          currentSubjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white rounded-lg p-3 sm:p-4 md:p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:text-gray-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              onClick={() => handleSubjectClick(subject.slug)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl">{subject.icon}</div>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-dashboard-blue">
                    {subject.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                    {subject.description}
                  </p>
                  {subject.category && (
                    <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                      {subject.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
            >
              &laquo;
            </button>

            {pageNumbers.map((number) => (
              <button
                key={number}
                onClick={() => handlePageChange(number)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === number
                    ? 'bg-blue-500 text-white'
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() =>
                handlePageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
            >
              &raquo;
            </button>
          </nav>
        </div>
      )}
    </section>
  );
};

export default SubjectList;
