import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchTopicDataAPI } from '@/services/topicService';
import { logger } from '@/lib/logger';
import { Subject, Topic, Chapter, Quiz } from '@/types/topics';

export function useTopicData(subject: string, topic: string) {
  const [loadingState, setLoading] = useState(true);
  const [errorState, setError] = useState<string | null>(null);
  // Missing params mean there's nothing to fetch: derive the error rather
  // than setting it from the effect.
  const hasParams = Boolean(subject && topic);
  const loading = hasParams ? loadingState : false;
  const error = hasParams
    ? errorState
    : 'Missing subject or topic parameters';
  const [subjectData, setSubjectData] = useState<Subject | null>(null);
  const [topicData, setTopicData] = useState<Topic | null>(null);
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!subject || !topic) return;
    (async () => {
      try {
        logger.log(`Fetching topic data via API for topic: ${topic}`);

        const result = await fetchTopicDataAPI(topic);

        if (result.error) {
          throw new Error(result.error);
        }

        // Set the data from the API response
        setSubjectData(result.subject);
        setTopicData(result.topic);

        // Handle chapter data - use API result or fallback to query parameters
        let chapterToSet = result.chapter;

        if (!chapterToSet) {
          logger.log('No chapter data from API, checking query parameters...');
          const chapterId = searchParams.get('chapterId');
          const chapterName = searchParams.get('chapterName');

          if (chapterId && chapterName) {
            logger.log('Using chapter data from query parameters:', {
              chapterId,
              chapterName,
            });
            chapterToSet = {
              id: chapterId,
              name: decodeURIComponent(chapterName),
              form: 0, // Default form, could be enhanced
              order_index: 0,
            };
          }
        }

        setChapterData(chapterToSet);
        setQuizzes(result.quizzes);
      } catch (err) {
        // Log the error
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error(`[ERROR] useTopicData: ${error.message}`);
        if (process.env.NODE_ENV !== 'production') {
          logger.error(error);
        }

        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );

        // Redirect on certain types of errors
        const errorMessage = err instanceof Error ? err.message : '';
        if (
          errorMessage.includes('not found') ||
          errorMessage.includes('does not exist')
        ) {
          setTimeout(() => router.push('/dashboard'), 3000);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [subject, topic, router, searchParams]);

  return { loading, error, subjectData, topicData, chapterData, quizzes };
}
