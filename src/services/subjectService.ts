import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { checkAdminAccess } from './adminAuthService';
import type { JomBeelajarApiSubjectTreeEntry } from '@/lib/jombeelajar-api';

/**
 * Interface for Subject data structure
 */
export interface Subject {
  id: string;
  name: string;
  description: string;
  topic_count: number;
  quiz_count: number;
}

/**
 * Interface for public subject data (simpler structure for public API)
 */
export interface PublicSubject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category?: string;
}

/**
 * Interface for chapter data
 */
export interface Chapter {
  id: number;
  name: string;
  form: number;
  order_index?: number;
}

/**
 * Interface for topic data
 */
export interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  time_estimate_minutes: number;
  order_index: number;
}

/**
 * Interface for chapter with topics data
 */
export interface ChapterWithTopics {
  id: number;
  name: string;
  form: number;
  order_index: number;
  topics: Topic[];
}

/**
 * Interface for subject with chapters and topics response
 */
export interface SubjectWithChaptersAndTopics {
  subject: PublicSubject;
  chapters: ChapterWithTopics[];
}

/**
 * Fetches all subjects with their related topic and quiz counts, via
 * JomBeelajar API's content-tree endpoint (GET /api/admin/content-tree) — one call
 * replaces what used to be a Supabase nested-join query.
 * @returns A promise with subjects data and error status
 */
export async function fetchAdminSubjects(): Promise<{
  data: Subject[] | null;
  error: Error | null;
}> {
  try {
    // Verify admin access
    const { success, error } = await checkAdminAccess();

    if (!success) {
      return { data: null, error };
    }

    logger.log('Fetching subjects as admin via content-tree...');

    const res = await fetch('/api/admin/content-tree');
    const tree = await res.json();

    if (!res.ok) {
      logger.error('Error fetching content tree:', tree);
      return {
        data: null,
        error: new Error(tree.error || 'Failed to fetch subjects'),
      };
    }

    const formattedSubjects = (tree as JomBeelajarApiSubjectTreeEntry[]).map(
      (subject) => ({
        id: subject.id,
        name: subject.name,
        description: subject.description || '',
        topic_count: subject.chapters.reduce(
          (sum, chapter) => sum + chapter.topics.length,
          0
        ),
        quiz_count: subject.quizCount,
      })
    );

    return { data: formattedSubjects, error: null };
  } catch (error) {
    const err =
      error instanceof Error
        ? error
        : new Error(
            error && typeof error === 'object'
              ? JSON.stringify(error)
              : 'Unknown error in fetchAdminSubjects'
          );

    logger.error('Error in fetchAdminSubjects:', err);
    logger.error('Full error details:', error);
    return { data: null, error: err };
  }
}

/**
 * Fetches basic subjects without counts (for dashboard - FAST)
 * @returns A promise with basic subjects data
 */
export async function fetchSubjects(): Promise<{
  data: Subject[] | null;
  error: Error | null;
}> {
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name, description');

    if (error) {
      logger.error('Error fetching subjects:', error);
      return { data: null, error };
    }

    // Return subjects with zero counts for dashboard (fast loading)
    const formattedSubjects =
      subjects?.map((subject) => ({
        ...subject,
        topic_count: 0,
        quiz_count: 0,
      })) || [];

    return { data: formattedSubjects, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error in fetchSubjects:', err);
    return { data: null, error: err };
  }
}

/**
 * Creates a new subject via JomBeelajar API (POST /api/v1/subjects, moderator-only)
 * @param subjectData The subject data to create
 * @returns A promise with the created subject ID or error
 */
export async function createSubject(subjectData: {
  name: string;
  description: string;
  slug?: string;
  icon?: string;
}): Promise<{
  id: string | null;
  error: Error | null;
}> {
  try {
    const slug =
      subjectData.slug ||
      subjectData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const res = await fetch('/api/admin/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: subjectData.name,
        description: subjectData.description,
        slug,
        icon: subjectData.icon || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { id: null, error: new Error(data.error || 'Failed to create subject') };
    }

    return { id: data.id, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in createSubject:', err);
    return { id: null, error: err };
  }
}

/**
 * Updates an existing subject via JomBeelajar API (PATCH /api/v1/subjects/{id})
 * @param id The ID of the subject to update
 * @param subjectData The updated subject data
 * @returns A promise with success status and error
 */
export async function updateSubject(
  id: string,
  subjectData: {
    name?: string;
    description?: string;
    slug?: string;
    icon?: string;
  }
): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/subjects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subjectData),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to update subject'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in updateSubject:', err);
    return { success: false, error: err };
  }
}

/**
 * Deletes a subject via JomBeelajar API (DELETE /api/v1/subjects/{id}). Guarded
 * server-side — returns a 409 (surfaced as an Error here) if any chapters
 * still exist under this subject.
 * @param id The ID of the subject to delete
 * @returns A promise with success status and error
 */
export async function deleteSubject(id: string): Promise<{
  success: boolean;
  error: Error | null;
}> {
  try {
    const res = await fetch(`/api/admin/subjects/${id}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: false,
        error: new Error(data.error || 'Failed to delete subject'),
      };
    }

    return { success: true, error: null };
  } catch (error) {
    const err = error as Error;
    logger.error('Error in deleteSubject:', err);
    return { success: false, error: err };
  }
}

/**
 * Fetches subjects for public API (no auth required) via JomBeelajar API
 * (GET /api/v1/subjects, proxied through /api/subjects)
 * @returns A promise with public subjects data
 */
export async function fetchPublicSubjects(): Promise<{
  data: PublicSubject[] | null;
  error: Error | null;
}> {
  try {
    const res = await fetch('/api/subjects');
    const data = await res.json();

    if (!res.ok) {
      return { data: null, error: new Error(data.error || 'Failed to fetch subjects') };
    }

    return { data: data as PublicSubject[], error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error in fetchPublicSubjects:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetches a single subject by ID for public API (no auth required)
 * @param id The ID of the subject to fetch
 * @returns A promise with the subject data or error
 */
export async function fetchPublicSubjectById(id: string): Promise<{
  data: PublicSubject | null;
  error: Error | null;
}> {
  try {
    const { data: subject, error } = await supabase
      .from('subjects')
      .select('id, name, slug, description, icon')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error fetching public subject by ID:', error);
      return { data: null, error };
    }

    return { data: subject as PublicSubject, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error in fetchPublicSubjectById:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetches chapters for a subject by subject ID (no auth required)
 * @param subjectId The ID of the subject
 * @returns A promise with the chapters data or error
 */
export async function fetchChaptersBySubjectId(subjectId: string): Promise<{
  data: Chapter[] | null;
  error: Error | null;
}> {
  try {
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('id, name, form, order_index')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });

    if (error) {
      logger.error('Error fetching chapters by subject ID:', error);
      return { data: null, error };
    }

    return { data: chapters as Chapter[], error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error in fetchChaptersBySubjectId:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetch subject data by slug via API route (no authentication required)
 */
export async function fetchSubjectBySlug(slug: string): Promise<PublicSubject> {
  try {
    const response = await fetch(`/api/subjects/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch subject data');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching subject:', error);
    throw error;
  }
}

/**
 * Fetch chapters for a subject by subject slug via API route (no authentication required)
 */
export async function fetchChaptersBySubjectSlug(
  slug: string
): Promise<Chapter[]> {
  try {
    const response = await fetch(`/api/subjects/${slug}/chapters`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch chapters');
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching chapters:', error);
    throw error;
  }
}

/**
 * Fetches subjects with chapters and topics for a subject by ID
 * @param subjectId The ID of the subject
 * @returns A promise with the subject, chapters, and topics data or error
 */
export async function fetchSubjectWithChaptersAndTopics(
  subjectId: string
): Promise<{
  data: SubjectWithChaptersAndTopics | null;
  error: Error | null;
}> {
  try {
    // Fetch subject data
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, slug, description, icon')
      .eq('id', subjectId)
      .single();

    if (subjectError) {
      logger.error('Error fetching subject:', subjectError);
      return { data: null, error: subjectError };
    }

    // Fetch chapters with topics for the subject
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select(
        'id, name, form, order_index, topics(id, name, description, difficulty_level, time_estimate_minutes, order_index)'
      )
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: true });

    if (chaptersError) {
      logger.error('Error fetching chapters with topics:', chaptersError);
      return { data: null, error: chaptersError };
    }

    // Format the response
    const responseData: SubjectWithChaptersAndTopics = {
      subject: subject as PublicSubject,
      chapters: (chapters || []).map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        form: chapter.form,
        order_index: chapter.order_index,
        topics: chapter.topics || [],
      })),
    };

    return { data: responseData, error: null };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    logger.error('Error in fetchSubjectWithChaptersAndTopics:', err);
    return { data: null, error: err };
  }
}

/**
 * Fetches chapters with topics for a subject using API route (authentication-optional)
 * @param slug - The subject slug
 * @returns Promise with subject and chapters with topics data
 */
export async function fetchChaptersWithTopicsAPI(
  slug: string
): Promise<SubjectWithChaptersAndTopics> {
  try {
    const response = await fetch(`/api/subjects/${slug}/chapters-with-topics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 'Failed to fetch chapters with topics'
      );
    }

    return await response.json();
  } catch (error) {
    logger.error('Error fetching chapters with topics:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to fetch chapters with topics');
  }
}
