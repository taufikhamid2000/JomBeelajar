import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { checkAdminAccess } from './adminAuthService';
import { Topic as TopicType, Chapter, Subject, Quiz } from '@/types/topics';
import type { JomBeelajarApiSubjectTreeEntry } from '@/lib/jombeelajar-api';

/**
 * Interface for Topic structure
 */
export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  order_index: number;
  created_at: string;
  // Not returned by JomBeelajar API's content-tree (and not rendered anywhere in
  // the admin UI) — kept optional rather than backfilled.
  updated_at?: string;
  quiz_count?: number;
}

/**
 * Fetches all topics with quiz counts, via JomBeelajar API's content-tree endpoint
 * (GET /api/admin/content-tree) — one call replaces the previous full-table
 * topics read plus a separate all-quizzes count query.
 * @returns A promise with topics data and error status
 */
export async function fetchAdminTopics(): Promise<{
  data: Topic[] | null;
  error: Error | null;
}> {
  try {
    // Verify admin access
    const { success, error } = await checkAdminAccess();

    if (!success) {
      return { data: null, error };
    }

    logger.log('Fetching topics as admin via content-tree...');

    const res = await fetch('/api/admin/content-tree');
    const tree = await res.json();

    if (!res.ok) {
      logger.error('Error fetching content tree:', tree);
      return {
        data: null,
        error: new Error(tree.error || 'Failed to fetch topics'),
      };
    }

    const formattedTopics: Topic[] = (tree as JomBeelajarApiSubjectTreeEntry[]).flatMap(
      (subject) =>
        subject.chapters.flatMap((chapter) =>
          chapter.topics.map((topic) => ({
            id: topic.id,
            chapter_id: chapter.id,
            name: topic.name,
            order_index: topic.orderIndex,
            created_at: topic.createdAt,
            quiz_count: topic.quizCount,
          }))
        )
    );

    logger.log('Topics fetched successfully:', {
      count: formattedTopics.length,
    });

    return { data: formattedTopics, error: null };
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(
            error && typeof error === 'object'
              ? JSON.stringify(error)
              : 'Unknown error in fetchAdminTopics'
          );

    logger.error('Error in fetchAdminTopics:', err);
    logger.error('Full error details:', error);
    return { data: null, error: err };
  }
}

/**
 * Creates a new topic via JomBeelajar API (POST /api/v1/topics, moderator-only)
 * @param topicData The topic data to create
 * @returns A promise with the created topic ID or error
 */
export async function createTopic(topicData: {
  name: string;
  chapter_id: string;
  order_index?: number;
}): Promise<{
  id: string | null;
  error: Error | null;
}> {
  try {
    // If order_index is not provided, get the max index for the chapter and add 1
    let orderIndex = topicData.order_index;
    if (orderIndex === undefined) {
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('topics')
        .select('order_index')
        .eq('chapter_id', topicData.chapter_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      if (maxOrderError && maxOrderError.code !== 'PGRST116') {
        // PGRST116 is the error code for no rows returned
        logger.error('Error getting max order index:', maxOrderError);
        return { id: null, error: maxOrderError };
      }
      orderIndex = maxOrderData ? maxOrderData.order_index + 1 : 0;
    }

    const res = await fetch('/api/admin/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: topicData.name,
        chapterId: topicData.chapter_id,
        orderIndex,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { id: null, error: new Error(data.error || 'Failed to create topic') };
    }

    return { id: data.id, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in createTopic:', err);
    return { id: null, error: err };
  }
}

/**
 * Updates an existing topic via JomBeelajar API (PATCH /api/v1/topics/{id}).
 * `title`/`content` are the historical local field names (pre-dating a
 * `name` standardization elsewhere); mapped onto JomBeelajar API's `name`/
 * `description` fields.
 * @param id The ID of the topic to update
 * @param topicData The updated topic data
 * @returns A promise with success status and error
 */
export async function updateTopic(
  id: string,
  topicData: {
    title?: string;
    chapter_id?: string;
    content?: string;
    order_index?: number;
  }
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/topics/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: topicData.title,
        chapterId: topicData.chapter_id,
        description: topicData.content,
        orderIndex: topicData.order_index,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to update topic'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in updateTopic:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes a topic via JomBeelajar API (DELETE /api/v1/topics/{id}). Guarded
 * server-side — returns a 409 (surfaced as an Error here) if any quizzes
 * still exist under this topic.
 * @param id The ID of the topic to delete
 * @returns A promise with success status and error
 */
export async function deleteTopic(id: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/topics/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to delete topic'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in deleteTopic:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetch topic data with chapter, subject, and quizzes via API
 */
export async function fetchTopicDataAPI(topicId: string): Promise<{
  topic: TopicType | null;
  chapter: Chapter | null;
  subject: Subject | null;
  quizzes: Quiz[];
  error?: string;
}> {
  try {
    logger.log(`Fetching topic data via API: ${topicId}`);

    const response = await fetch(`/api/topics/${topicId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    logger.log(`Successfully fetched topic data via API for topic: ${topicId}`);

    return {
      topic: data.topic,
      chapter: data.chapter,
      subject: data.subject,
      quizzes: data.quizzes,
    };
  } catch (error) {
    logger.error('Error fetching topic data via API:', error);
    return {
      topic: null,
      chapter: null,
      subject: null,
      quizzes: [],
      error:
        error instanceof Error ? error.message : 'Failed to fetch topic data',
    };
  }
}
