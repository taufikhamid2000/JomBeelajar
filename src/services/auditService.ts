// Audit service for quiz verification system.
//
// Comments (quiz/question/answer), the verification log, and the verify/
// unverify action itself all come from JomBeelajar API now (Sprint A item 3),
// proxied through /api/quiz/[quizId]/comments, /api/questions/[id]/comments,
// /api/answers/[id]/comments, /api/quiz/[quizId]/verification-log, and
// /api/quiz/[quizId]/verify. Responses are mapped into the existing
// snake_case shapes below so the consuming pages didn't need to change.
// JomBeelajar API's comment response has no author/admin_user info, so
// admin_user_id/admin_user are left blank/undefined on the mapped result.
//
// getQuizzesNeedingReview/getAuditDashboardStats now come from JomBeelajar API too,
// via GET /api/admin/audit-summary (proxies /api/v1/admin/audit-summary +
// /api/v1/admin/quizzes/unverified) — replaces the old Supabase queries
// plus an admin-side N+1 (one comment-count query per quiz).
import { logger } from '@/lib/logger';
import {
  QuizAuditComment,
  QuestionAuditComment,
  AnswerAuditComment,
  QuizVerificationLog,
  AuditCommentInput,
  VerificationAction,
  QuizWithAudit,
  AuditDashboardStats,
} from '@/types/audit';
import { JomBeelajarApiAuditComment, JomBeelajarApiVerificationLogEntry } from '@/lib/jombeelajar-api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

function mapComment<
  T extends {
    id: string;
    comment_text: string;
    comment_type: 'suggestion' | 'issue' | 'approved' | 'rejected';
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    admin_user_id: string;
  },
>(c: JomBeelajarApiAuditComment, parentField: Extract<keyof T, string>, parentId: string): T {
  return {
    id: c.id,
    [parentField]: parentId,
    admin_user_id: '',
    comment_text: c.commentText,
    comment_type: c.commentType,
    is_resolved: c.isResolved,
    created_at: c.createdAt,
    updated_at: c.createdAt,
  } as unknown as T;
}

/**
 * Get audit comments for a quiz
 */
export async function getQuizAuditComments(
  quizId: string
): Promise<QuizAuditComment[]> {
  try {
    const comments = await fetchJson<JomBeelajarApiAuditComment[]>(
      `/api/quiz/${quizId}/comments`
    );
    return comments.map((c) => mapComment<QuizAuditComment>(c, 'quiz_id', quizId));
  } catch (error) {
    logger.error('Error fetching quiz audit comments:', error);
    return [];
  }
}

/**
 * Get audit comments for a question
 */
export async function getQuestionAuditComments(
  questionId: string
): Promise<QuestionAuditComment[]> {
  try {
    const comments = await fetchJson<JomBeelajarApiAuditComment[]>(
      `/api/questions/${questionId}/comments`
    );
    return comments.map((c) =>
      mapComment<QuestionAuditComment>(c, 'question_id', questionId)
    );
  } catch (error) {
    logger.error('Error fetching question audit comments:', error);
    return [];
  }
}

/**
 * Get audit comments for an answer
 */
export async function getAnswerAuditComments(
  answerId: string
): Promise<AnswerAuditComment[]> {
  try {
    const comments = await fetchJson<JomBeelajarApiAuditComment[]>(
      `/api/answers/${answerId}/comments`
    );
    return comments.map((c) =>
      mapComment<AnswerAuditComment>(c, 'answer_id', answerId)
    );
  } catch (error) {
    logger.error('Error fetching answer audit comments:', error);
    return [];
  }
}

/**
 * Add audit comment to a quiz
 */
export async function addQuizAuditComment(
  quizId: string,
  commentInput: AuditCommentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetchJson(`/api/quiz/${quizId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentText: commentInput.comment_text,
        commentType: commentInput.comment_type,
      }),
    });
    return { success: true };
  } catch (error) {
    logger.error('Error adding quiz audit comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add audit comment to a question
 */
export async function addQuestionAuditComment(
  questionId: string,
  commentInput: AuditCommentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetchJson(`/api/questions/${questionId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentText: commentInput.comment_text,
        commentType: commentInput.comment_type,
      }),
    });
    return { success: true };
  } catch (error) {
    logger.error('Error adding question audit comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Add audit comment to an answer
 */
export async function addAnswerAuditComment(
  answerId: string,
  commentInput: AuditCommentInput
): Promise<{ success: boolean; error?: string }> {
  try {
    await fetchJson(`/api/answers/${answerId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commentText: commentInput.comment_text,
        commentType: commentInput.comment_type,
      }),
    });
    return { success: true };
  } catch (error) {
    logger.error('Error adding answer audit comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve an audit comment. Unlike the old Supabase version (update by
 * comment id alone), JomBeelajar API scopes comments under their parent entity, so
 * the parent id is now required too.
 */
export async function resolveAuditComment(
  entityId: string,
  commentId: string,
  commentType: 'quiz' | 'question' | 'answer'
): Promise<{ success: boolean; error?: string }> {
  try {
    const base =
      commentType === 'quiz'
        ? `/api/quiz/${entityId}`
        : commentType === 'question'
          ? `/api/questions/${entityId}`
          : `/api/answers/${entityId}`;

    await fetchJson(`${base}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isResolved: true }),
    });
    return { success: true };
  } catch (error) {
    logger.error('Error resolving audit comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify or unverify a quiz via JomBeelajar API's POST /api/v1/quizzes/{id}/verify.
 * That endpoint takes a single `verified` boolean (no separate action enum) —
 * 'reject' is our own client-side composition: unverify + a 'rejected'
 * comment, same as before the migration.
 */
export async function updateQuizVerification(
  quizId: string,
  action: VerificationAction
): Promise<{ success: boolean; error?: string }> {
  try {
    const verified = action.action === 'verify';
    const feedback =
      action.action === 'reject'
        ? action.reason || 'Quiz rejected'
        : action.reason || undefined;

    await fetchJson(`/api/quiz/${quizId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified, feedback }),
    });

    if (action.action === 'reject') {
      await addQuizAuditComment(quizId, {
        comment_text: action.reason || 'Quiz rejected by admin',
        comment_type: 'rejected',
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Error updating quiz verification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get verification history for a quiz
 */
export async function getQuizVerificationHistory(
  quizId: string
): Promise<QuizVerificationLog[]> {
  try {
    const log = await fetchJson<JomBeelajarApiVerificationLogEntry[]>(
      `/api/quiz/${quizId}/verification-log`
    );
    return log.map((entry) => ({
      id: entry.id,
      quiz_id: quizId,
      admin_user_id: '',
      action: entry.action,
      reason: entry.reason ?? undefined,
      created_at: entry.createdAt,
    }));
  } catch (error) {
    logger.error('Error fetching quiz verification history:', error);
    return [];
  }
}

interface AuditSummaryResponse {
  summary: {
    unresolvedQuizComments: number;
    unresolvedQuestionComments: number;
    unresolvedAnswerComments: number;
    verifiedToday: number;
    unverifiedToday: number;
    rejectedToday: number;
    unverifiedQuizCount: number;
  };
  unverifiedQuizzes: Array<{
    id: string;
    name: string;
    topicId: string;
    createdAt: string | null;
    unresolvedCommentCount: number;
  }>;
}

function mapUnverifiedQuiz(
  q: AuditSummaryResponse['unverifiedQuizzes'][number]
): QuizWithAudit {
  return {
    id: q.id,
    topic_id: q.topicId,
    name: q.name,
    created_by: '',
    created_at: q.createdAt || '',
    verified: false,
    unresolved_comments_count: q.unresolvedCommentCount,
  };
}

/**
 * Get quizzes that need review (unverified with activity)
 */
export async function getQuizzesNeedingReview(): Promise<QuizWithAudit[]> {
  try {
    const data = await fetchJson<AuditSummaryResponse>('/api/admin/audit-summary');
    return data.unverifiedQuizzes.map(mapUnverifiedQuiz);
  } catch (error) {
    logger.error('Error fetching quizzes needing review:', error);
    return [];
  }
}

/**
 * Get audit dashboard statistics
 */
export async function getAuditDashboardStats(): Promise<AuditDashboardStats> {
  try {
    const data = await fetchJson<AuditSummaryResponse>('/api/admin/audit-summary');
    const pendingComments =
      data.summary.unresolvedQuizComments +
      data.summary.unresolvedQuestionComments +
      data.summary.unresolvedAnswerComments;

    return {
      total_unverified_quizzes: data.summary.unverifiedQuizCount,
      total_pending_comments: pendingComments,
      total_verified_today: data.summary.verifiedToday,
      total_rejected_today: data.summary.rejectedToday,
      quizzes_needing_review: data.unverifiedQuizzes
        .slice(0, 5) // Top 5 for dashboard
        .map(mapUnverifiedQuiz),
    };
  } catch (error) {
    logger.error('Error fetching audit dashboard stats:', error);
    return {
      total_unverified_quizzes: 0,
      total_pending_comments: 0,
      total_verified_today: 0,
      total_rejected_today: 0,
      quizzes_needing_review: [],
    };
  }
}
