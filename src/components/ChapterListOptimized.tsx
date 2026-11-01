'use client';

import React, { useState } from 'react';
import { ChapterWithTopics, Topic } from '@/services/subjectService';
import Link from 'next/link';

interface ChapterListOptimizedProps {
  chapters: ChapterWithTopics[];
  subject: string;
}

export default function ChapterListOptimized({
  chapters,
  subject,
}: ChapterListOptimizedProps) {
  const [expandedChapters, setExpandedChapters] = useState<
    Record<number, boolean>
  >({});

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Group chapters by form
  const groupedChapters = chapters.reduce(
    (acc, chapter) => {
      if (!acc[chapter.form]) {
        acc[chapter.form] = [];
      }
      acc[chapter.form].push(chapter);
      return acc;
    },
    {} as Record<number, ChapterWithTopics[]>
  );

  return (
    <div>
      {Object.keys(groupedChapters)
        .sort((a, b) => Number(a) - Number(b)) // Sort forms numerically
        .map((form: string) => (
          <div key={form} className="mb-6">
            <h2 className="text-2xl font-bold mb-4 text-strong">Form {form}</h2>
            <ol className="list-decimal pl-6 space-y-3">
              {groupedChapters[Number(form)].map(
                (chapter: ChapterWithTopics) => (
                  <li key={chapter.id} className="mb-2">
                    <div className="bg-surface rounded-lg shadow-sm border border-border">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="text-left w-full p-4 hover:bg-muted rounded-lg transition-colors duration-200 flex items-center justify-between"
                      >
                        <span className="font-medium text-strong">
                          {chapter.name}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-soft">
                            {chapter.topics?.length || 0} topics
                          </span>
                          <svg
                            className={`w-5 h-5 text-soft transition-transform duration-200 ${
                              expandedChapters[chapter.id] ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {expandedChapters[chapter.id] && (
                        <div className="px-4 pb-4 border-t border-border bg-surface-2">
                          {chapter.topics && chapter.topics.length > 0 ? (
                            <ul className="mt-3 space-y-3">
                              {chapter.topics.map((topic: Topic) => (
                                <li
                                  key={topic.id}
                                  className="bg-surface rounded-md p-3 border border-border hover:shadow-sm transition-shadow duration-200"
                                >
                                  {' '}
                                  <Link
                                    href={`/quiz/${subject}/${topic.id}?chapterId=${chapter.id}&chapterName=${encodeURIComponent(chapter.name)}`}
                                    className="block group"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className="font-medium text-brand group-hover:text-brand transition-colors">
                                          {topic.name}
                                        </h4>
                                        {topic.description && (
                                          <p className="text-sm text-soft mt-1">
                                            {topic.description}
                                          </p>
                                        )}
                                      </div>
                                      <svg
                                        className="w-4 h-4 text-soft group-hover:text-brand ml-2 mt-1 transition-colors"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M9 5l7 7-7 7"
                                        />
                                      </svg>
                                    </div>
                                    <div className="flex items-center space-x-4 mt-2 text-xs text-soft">
                                      <span className="flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-1"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {topic.difficulty_level || 'N/A'}
                                      </span>
                                      <span className="flex items-center">
                                        <svg
                                          className="w-3 h-3 mr-1"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                        {topic.time_estimate_minutes || 'N/A'}{' '}
                                        mins
                                      </span>
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-3 text-center py-6">
                              <svg
                                className="mx-auto h-8 w-8 text-strong mb-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <p className="text-sm text-strong">
                                No topics available for this chapter.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                )
              )}
            </ol>
          </div>
        ))}
    </div>
  );
}
