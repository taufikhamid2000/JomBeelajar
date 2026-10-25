import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { checkAdminAccess } from './adminAuthService';
import type { JomBeelajarApiSubjectTreeEntry } from '@/lib/jombeelajar-api';

/**
 * Interface for Chapter structure
 */
export interface Chapter {
  id: string;
  subject_id: string;
  name: string; // Was previously called 'title', standardized as part of field naming conventions
  form: number;
  order_index: number;
  // Not returned by JomBeelajar API's content-tree (and not rendered anywhere in
  // the admin UI) — kept optional rather than backfilled.
  created_at?: string;
  updated_at?: string;
  topic_count?: number;
}

/**
 * Fetches all chapters with topic counts, via JomBeelajar API's content-tree
 * endpoint (GET /api/admin/content-tree) — one call replaces the previous
 * full-table chapters read plus a separate all-topics count query.
 * @returns A promise with chapters data and error status
 */
export async function fetchAdminChapters(): Promise<{
  data: Chapter[] | null;
  error: Error | null;
}> {
  try {
    // Verify admin access
    const { success, error } = await checkAdminAccess();

    if (!success) {
      return { data: null, error };
    } // User is confirmed as admin, proceed with fetch
    logger.log('Fetching chapters as admin via content-tree...');

    const res = await fetch('/api/admin/content-tree');
    const tree = await res.json();

    if (!res.ok) {
      logger.error('Error fetching content tree:', tree);
      return {
        data: null,
        error: new Error(tree.error || 'Failed to fetch chapters'),
      };
    }

    const formattedChapters: Chapter[] = (tree as JomBeelajarApiSubjectTreeEntry[]).flatMap(
      (subject) =>
        subject.chapters.map((chapter) => ({
          id: chapter.id,
          subject_id: subject.id,
          name: chapter.name,
          form: chapter.form,
          order_index: chapter.orderIndex,
          topic_count: chapter.topics.length,
        }))
    );

    logger.log('Chapters fetched successfully:', {
      count: formattedChapters.length,
    });

    return { data: formattedChapters, error: null };
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(
            error && typeof error === 'object'
              ? JSON.stringify(error)
              : 'Unknown error in fetchAdminChapters'
          );

    logger.error('Error in fetchAdminChapters:', err);
    logger.error('Full error details:', error);
    return { data: null, error: err };
  }
}

/**
 * Creates a new chapter via JomBeelajar API (POST /api/v1/chapters, moderator-only)
 * @param chapterData The chapter data to create
 * @returns A promise with the created chapter ID or error
 */
export async function createChapter(chapterData: {
  name: string;
  description?: string;
  subject_id: string;
  form: number;
  order_index?: number;
}): Promise<{
  id: string | null;
  error: Error | null;
}> {
  try {
    // If order_index is not provided, get the max index for the subject and add 1
    let orderIndex = chapterData.order_index;
    if (orderIndex === undefined) {
      const { data: maxOrderData, error: maxOrderError } = await supabase
        .from('chapters')
        .select('order_index')
        .eq('subject_id', chapterData.subject_id)
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

    const res = await fetch('/api/admin/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: chapterData.name,
        description: chapterData.description,
        subjectId: chapterData.subject_id,
        form: chapterData.form,
        orderIndex,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { id: null, error: new Error(data.error || 'Failed to create chapter') };
    }

    return { id: data.id, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in createChapter:', err);
    return { id: null, error: err };
  }
}

/**
 * Updates an existing chapter via JomBeelajar API (PATCH /api/v1/chapters/{id})
 * @param id The ID of the chapter to update
 * @param chapterData The updated chapter data
 * @returns A promise with success status and error
 */
export async function updateChapter(
  id: string,
  chapterData: {
    name?: string;
    description?: string;
    subject_id?: string;
    form?: number;
    order_index?: number;
  }
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/chapters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: chapterData.name,
        description: chapterData.description,
        subjectId: chapterData.subject_id,
        form: chapterData.form,
        orderIndex: chapterData.order_index,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to update chapter'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in updateChapter:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes a chapter via JomBeelajar API (DELETE /api/v1/chapters/{id}). Guarded
 * server-side — returns a 409 (surfaced as an Error here) if any topics
 * still exist under this chapter.
 * @param id The ID of the chapter to delete
 * @returns A promise with success status and error
 */
export async function deleteChapter(id: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/chapters/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to delete chapter'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in deleteChapter:', err);
    return { success: false, error: err };
  }
}
