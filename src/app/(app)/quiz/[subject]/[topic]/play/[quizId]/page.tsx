'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchQuizWithQuestionsAPI } from '@/services/quizService';
import QuizPlayer from '@/components/quiz/QuizPlayer';
import { Question, Quiz, TopicContext } from '@/types/topics';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { DEFAULT_QUIZ_TIME_LIMIT_MINUTES } from '@/config/app';

const API_MSG = 'Unable to connect to the API. Please contact the administrator.';

export default function PlayQuizPage() {
  const params = useParams();
  const quizId = params?.quizId as string;
  const subject = params?.subject as string;
  const topic = params?.topic as string;

  const [loadingQuiz, setLoading] = useState(true);
  const [stateError, setError] = useState<string | null>(null);
  // Without a quiz ID there's nothing to load: derive the error instead of
  // setting it from the effect.
  const loading = quizId ? loadingQuiz : false;
  const error = quizId ? stateError : 'Quiz ID is required';
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [topicContext, setTopicContext] = useState<TopicContext | null>(null);

  useEffect(() => {
    if (!quizId) return;

    let cancelled = false;

    // 20-second hard timeout — MyQuiza cold-starts can be slow
    const timeout = setTimeout(() => {
      if (!cancelled) {
        cancelled = true;
        setError(API_MSG);
        setLoading(false);
      }
    }, 20000);

    async function load() {
      try {
        // Auth + quiz fetch in parallel — no sequential wait
        const [authResult, quizResult] = await Promise.all([
          supabase.auth.getSession(),
          fetchQuizWithQuestionsAPI(quizId),
        ]);

        if (cancelled) return;

        const { data: { session }, error: authError } = authResult;

        if (authError) {
          logger.warn('Session check error while loading quiz:', authError);
        }

        if (quizResult.error || !quizResult.quiz) {
          setError(API_MSG);
          return;
        }

        logger.log('Quiz loaded', {
          quizName: quizResult.quiz.name,
          questions: quizResult.questions?.length ?? 0,
        });

        setUserId(session?.user?.id ?? null);
        setQuiz(quizResult.quiz);
        setQuestions(quizResult.questions || []);
        setTopicContext(quizResult.topicContext);
      } catch (err) {
        logger.error('Error loading quiz page:', err);
        if (!cancelled) setError(API_MSG);
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [quizId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
              <p className="mt-4 text-gray-400 dark:text-gray-600">Loading quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 dark:bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Error Loading Quiz
            </h1>
            <p className="text-gray-300 dark:text-gray-700">
              {error || API_MSG}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <QuizPlayer
          quizId={quizId}
          quizName={quiz.name}
          questions={questions}
          timeLimit={
            quiz.timeLimit != null
              ? quiz.timeLimit / 60
              : DEFAULT_QUIZ_TIME_LIMIT_MINUTES
          }
          userId={userId ?? undefined}
          subject={subject}
          topic={topic}
          topicContext={topicContext}
          isVerified={quiz.verified}
          onComplete={() => logger.log('Quiz completed')}
        />
      </div>
    </div>
  );
}
