'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { QuizForm } from '@/components/QuizForm';
import { logger } from '@/lib/logger';

interface QuizData {
  name: string;
  subject: string;
  topic: string;
  description?: string;
  difficulty?: string;
  timeLimit?: number;
  isPublic?: boolean;
}

interface SubjectData {
  id: string;
  name: string;
  slug: string;
}

interface TopicData {
  id: string;
  title: string;
  chapter_id: string;
}

interface ChapterData {
  id: string;
  title: string;
  form: number;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const params = useParams();

  const subject = (params?.subject as string) || '';
  const topic = (params?.topic as string) || '';

  const [isLoadingTopic, setIsLoading] = useState(true);
  const [stateError, setError] = useState<string | null>(null);
  // No topic in the URL means there's nothing to load: show the error
  // straight away instead of setting it from the effect.
  const isLoading = topic ? isLoadingTopic : false;
  const error = topic
    ? stateError
    : 'Unable to connect to the API. Please contact the administrator.';
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [topicData, setTopicData] = useState<TopicData | null>(null);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizData>({
    defaultValues: {
      difficulty: 'beginner',
      timeLimit: 10,
      isPublic: false,
    },
  });

  useEffect(() => {
    if (!topic) return;

    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setError('Unable to connect to the API. Please contact the administrator.');
        setIsLoading(false);
      }
    }, 10000);

    fetch(`/api/topics/${topic}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        if (data.subject) setSubjectData({ id: data.subject.id, name: data.subject.name, slug: data.subject.slug });
        if (data.topic) setTopicData({ id: data.topic.id, title: data.topic.name, chapter_id: data.topic.chapter_id });
        if (data.chapter) setChapterData({ id: data.chapter.id, title: data.chapter.name, form: data.chapter.form });
      })
      .catch((err) => {
        logger.error('Error fetching topic metadata:', err);
        if (!cancelled) setError('Unable to connect to the API. Please contact the administrator.');
      })
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; clearTimeout(timeout); };
  }, [topic]);

  const mutation = useMutation({
    mutationFn: async (data: QuizData) => {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topicData?.id,
          name: data.name,
          timeLimit: data.timeLimit ? data.timeLimit * 60 : undefined, // minutes → seconds
          difficulty: data.difficulty || undefined,
          isPublic: data.isPublic ?? false,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create quiz');
      return json;
    },
    onSuccess: (result) => {
      router.push(`/quiz/${subject}/${topic}/${result.quizId}/questions`);
    },
    onError: (error) => {
      logger.error('Error creating quiz:', error);
      setError('Unable to connect to the API. Please contact the administrator.');
    },
  });

  const onSubmit = (data: QuizData) => {
    if (!topicData?.id) {
      setError('Cannot create a quiz: topic not loaded yet.');
      return;
    }
    mutation.mutate(data);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent mb-4"></div>
            <p className="text-gray-400 dark:text-gray-600">
              Loading quiz information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center"
          >
            ← Back
          </button>
        </div>

        <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Create New Quiz
            </h1>
            <p className="text-gray-400 dark:text-gray-600">
              Design a quiz for students to test their knowledge
            </p>
          </div>
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
              {error}
            </div>
          )}{' '}
          <QuizForm
            register={register}
            handleSubmit={handleSubmit}
            errors={errors}
            onSubmit={onSubmit}
            isLoading={mutation.status === 'pending'}
            subjectName={subjectData?.name}
            topicName={topicData?.title}
            chapterName={
              chapterData?.title
                ? `Form ${chapterData.form} · ${chapterData.title}`
                : undefined
            }
          />
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-700 dark:border-gray-200 rounded-lg p-5">
          <h2 className="text-lg font-medium mb-3 text-gray-200 dark:text-gray-800">
            Tips for creating effective quizzes
          </h2>
          <ul className="space-y-2 text-sm text-gray-400 dark:text-gray-600">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>Use clear, concise language in your questions</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                Include a variety of question types (multiple choice,
                true/false, etc.)
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                Make sure all questions relate to the topic being assessed
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <span>
                Set an appropriate time limit for the number of questions
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
