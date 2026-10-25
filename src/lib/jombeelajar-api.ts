const BASE_URL = process.env.JOMBEELAJAR_API_URL ?? '';

// ---- Types ----

export interface JomBeelajarApiQuiz {
  id: string;
  topicId: string;
  name: string;
  verified: boolean;
  questionCount: number;
  difficulty: string | null;
  isPublic: boolean;
}

export interface QuizDetailOption {
  id: string;
  text: string;
  orderIndex: number;
}

export interface QuizDetailQuestion {
  id: string;
  text: string;
  type: string; // "radio" | "checkbox"
  orderIndex: number;
  options: QuizDetailOption[];
}

export interface QuizDetail {
  id: string;
  topicId: string;
  name: string;
  verified: boolean;
  timeLimit: number | null; // seconds; null -> client falls back to default
  difficulty: string | null;
  isPublic: boolean;
  questions: QuizDetailQuestion[];
}

export interface CreateQuizPayload {
  topicId: string;
  name: string;
  timeLimit?: number;
  difficulty?: string;
  isPublic?: boolean;
}

export interface UpdateQuizPayload {
  name?: string;
  difficulty?: string;
  timeLimit?: number;
  isPublic?: boolean;
}

// Author-only view of a quiz: same shape as QuizDetail but answer options
// carry `isCorrect` (never exposed on the public quiz-detail endpoint).
export interface QuizAuthorOption extends QuizDetailOption {
  isCorrect: boolean;
}

export interface QuizAuthorQuestion extends Omit<QuizDetailQuestion, 'options'> {
  options: QuizAuthorOption[];
}

export interface QuizAuthorDetail extends Omit<QuizDetail, 'questions'> {
  questions: QuizAuthorQuestion[];
}

export interface CreateQuestionPayload {
  text: string;
  type: 'radio' | 'checkbox';
  orderIndex: number;
  answers: Array<{ text: string; isCorrect: boolean; orderIndex: number }>;
}

export interface UpdateQuestionPayload {
  text?: string;
  type?: 'radio' | 'checkbox';
  orderIndex?: number;
}

export interface CreateAnswerPayload {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface UpdateAnswerPayload {
  text?: string;
  isCorrect?: boolean;
  orderIndex?: number;
}

export interface SubmitAttemptPayload {
  answers: Array<{
    questionId: string;
    selectedAnswerIds: string[];
  }>;
  timeTaken?: number;
}

export interface AttemptResult {
  attemptId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  maxScore: number;
  xpAwarded: boolean;
  // Per-question correctness, ordered by question orderIndex. Returned only in
  // the attempt response (post-submission) — the answer key stays hidden on
  // the quiz-detail endpoint. correctAnswerIds lists the option ids that were
  // correct, for highlighting on the results screen.
  questions?: Array<{
    questionId: string;
    correct: boolean;
    correctAnswerIds: string[];
  }>;
}

export interface UpdateMePayload {
  displayName?: string;
  avatarUrl?: string;
}

// Audit comments: identical shape on quizzes/questions/answers, per JomBeelajar API.
export type AuditEntityType = 'quizzes' | 'questions' | 'answers';

export interface JomBeelajarApiAuditComment {
  id: string;
  commentText: string;
  commentType: 'suggestion' | 'issue' | 'approved' | 'rejected';
  isResolved: boolean;
  createdAt: string;
}

export interface CreateAuditCommentPayload {
  commentText: string;
  commentType: 'suggestion' | 'issue' | 'approved' | 'rejected';
}

export interface JomBeelajarApiVerificationLogEntry {
  id: string;
  action: 'verified' | 'unverified';
  reason: string | null;
  createdAt: string;
}

export interface TopicProgress {
  topicId: string | null;
  status: string | null;
  score: number | null;
  attempts: number | null;
  lastAttemptedAt: string | null;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  weeklyXp: number;
}

// ---- Core fetch ----

async function apiFetch<T>(
  path: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Include the response body's error detail when present (e.g. 409
    // delete-guard responses tell the caller how many children are blocking
    // the delete) while keeping the "JomBeelajar API {status}" prefix callers match
    // on via .includes('403') etc.
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || body?.message || '';
    } catch {
      // no JSON body — ignore
    }
    throw new Error(`JomBeelajar API ${res.status}: ${path}${detail ? ` — ${detail}` : ''}`);
  }

  // PATCH/DELETE may return 204 No Content or an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---- Endpoints ----

export function createQuiz(payload: CreateQuizPayload, token: string | null) {
  return apiFetch<{ id: string }>('/api/v1/quizzes', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getTopicQuizzes(topicId: string) {
  return apiFetch<JomBeelajarApiQuiz[]>(`/api/v1/topics/${topicId}/quizzes`, null);
}

export function getQuizDetail(quizId: string) {
  return apiFetch<QuizDetail>(`/api/v1/quizzes/${quizId}`, null);
}

// Author/moderator-only quiz view — includes isCorrect on every answer.
// Use for the quiz editor; never expose this response to non-owners.
export function getQuizAuthorDetail(quizId: string, token: string | null) {
  return apiFetch<QuizAuthorDetail>(`/api/v1/quizzes/${quizId}/author`, token);
}

export function updateQuiz(
  quizId: string,
  payload: UpdateQuizPayload,
  token: string | null
) {
  return apiFetch<QuizDetail>(`/api/v1/quizzes/${quizId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function createQuestion(
  quizId: string,
  payload: CreateQuestionPayload,
  token: string | null
) {
  return apiFetch<{ id: string }>(`/api/v1/quizzes/${quizId}/questions`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateQuestion(
  questionId: string,
  payload: UpdateQuestionPayload,
  token: string | null
) {
  return apiFetch<void>(`/api/v1/questions/${questionId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteQuestion(questionId: string, token: string | null) {
  return apiFetch<void>(`/api/v1/questions/${questionId}`, token, {
    method: 'DELETE',
  });
}

export function createAnswer(
  questionId: string,
  payload: CreateAnswerPayload,
  token: string | null
) {
  return apiFetch<{ id: string }>(
    `/api/v1/questions/${questionId}/answers`,
    token,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function updateAnswer(
  answerId: string,
  payload: UpdateAnswerPayload,
  token: string | null
) {
  return apiFetch<void>(`/api/v1/answers/${answerId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAnswer(answerId: string, token: string | null) {
  return apiFetch<void>(`/api/v1/answers/${answerId}`, token, {
    method: 'DELETE',
  });
}

export function getAuditComments(
  entity: AuditEntityType,
  entityId: string,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAuditComment[]>(
    `/api/v1/${entity}/${entityId}/comments`,
    token
  );
}

export function addAuditComment(
  entity: AuditEntityType,
  entityId: string,
  payload: CreateAuditCommentPayload,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAuditComment>(
    `/api/v1/${entity}/${entityId}/comments`,
    token,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function resolveAuditComment(
  entity: AuditEntityType,
  entityId: string,
  commentId: string,
  isResolved: boolean,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAuditComment>(
    `/api/v1/${entity}/${entityId}/comments/${commentId}`,
    token,
    { method: 'PATCH', body: JSON.stringify({ isResolved }) }
  );
}

export function getQuizVerificationLog(quizId: string, token: string | null) {
  return apiFetch<JomBeelajarApiVerificationLogEntry[]>(
    `/api/v1/quizzes/${quizId}/verification-log`,
    token
  );
}

export interface VerifyQuizPayload {
  verified: boolean;
  feedback?: string;
}

// 204 No Content on success — auto-inserts the verification-log entry
// server-side (no separate write endpoint for the log by design).
export function verifyQuiz(
  quizId: string,
  payload: VerifyQuizPayload,
  token: string | null
) {
  return apiFetch<void>(`/api/v1/quizzes/${quizId}/verify`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// Awarded-achievement rows (per user). A real catalog now exists too —
// see JomBeelajarApiAchievementCatalogEntry below — but earned rows always
// snapshot title/description/icon/achievementType at award time, so
// editing the catalog later never retroactively changes past awards.
export interface JomBeelajarApiAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  progress: number | null;
  maxProgress: number | null;
  earnedAt: string;
}

// Award from the catalog (server snapshots the catalog entry's fields),
// or a one-off freeform award with no catalog entry — pick one shape.
export type AwardAchievementPayload =
  | { achievementId: string; progress?: number; maxProgress?: number }
  | {
      achievementType: string;
      title: string;
      description: string;
      icon: string;
      progress?: number;
      maxProgress?: number;
    };

export function getMyAchievements(token: string | null) {
  return apiFetch<JomBeelajarApiAchievement[]>('/api/v1/me/achievements', token);
}

// Public — achievement badges aren't sensitive, and profile pages need to
// show other users' earned badges. Safe to call with token: null.
export function getUserAchievements(userId: string, token: string | null) {
  return apiFetch<JomBeelajarApiAchievement[]>(
    `/api/v1/users/${userId}/achievements`,
    token
  );
}

// Moderator-only.
export function awardAchievement(
  userId: string,
  payload: AwardAchievementPayload,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAchievement>(
    `/api/v1/users/${userId}/achievements`,
    token,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

// Achievement catalog — template definitions admins manage, referenced by
// achievementId when awarding (see AwardAchievementPayload above).
export interface JomBeelajarApiAchievementCatalogEntry {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  maxProgress: number | null;
}

export interface CatalogAchievementPayload {
  achievementType: string;
  title: string;
  description: string;
  icon: string;
  maxProgress?: number;
}

export function getAchievementCatalog() {
  return apiFetch<JomBeelajarApiAchievementCatalogEntry[]>(
    '/api/v1/achievements',
    null
  );
}

export function createCatalogAchievement(
  payload: CatalogAchievementPayload,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAchievementCatalogEntry>(
    '/api/v1/achievements',
    token,
    { method: 'POST', body: JSON.stringify(payload) }
  );
}

export function updateCatalogAchievement(
  id: string,
  payload: Partial<CatalogAchievementPayload>,
  token: string | null
) {
  return apiFetch<JomBeelajarApiAchievementCatalogEntry>(
    `/api/v1/achievements/${id}`,
    token,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
}

export function deleteCatalogAchievement(id: string, token: string | null) {
  return apiFetch<void>(`/api/v1/achievements/${id}`, token, {
    method: 'DELETE',
  });
}

export function submitAttempt(
  quizId: string,
  payload: SubmitAttemptPayload,
  token: string | null
) {
  return apiFetch<AttemptResult>(`/api/v1/quizzes/${quizId}/attempts`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getMyProgress(token: string | null) {
  return apiFetch<TopicProgress[]>('/api/v1/me/progress', token);
}

// displayName/avatarUrl only — schoolRole is deliberately not editable here
// (privilege-escalation risk: schoolRole drives Moderator/Admin authorization).
export function updateMe(payload: UpdateMePayload, token: string | null) {
  return apiFetch<{ id: string }>('/api/v1/me', token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getLeaderboard(
  token: string | null,
  options: { period?: 'weekly'; limit?: number } = {}
) {
  const params = new URLSearchParams();
  if (options.period) params.set('period', options.period);
  if (options.limit) params.set('limit', String(options.limit));
  const qs = params.toString();
  return apiFetch<LeaderboardEntry[]>(
    `/api/v1/leaderboard${qs ? `?${qs}` : ''}`,
    token
  );
}

// Schools: reads are public (same as the user leaderboard); writes are
// admin-only, not moderator — institutional data, not user-generated
// content needing review. `type` is DB-constrained; validate client-side
// against SCHOOL_TYPES before submitting (an invalid value 500s server-side
// rather than a clean 400).
export const SCHOOL_TYPES = [
  'SMK',
  'SMKA',
  'MRSM',
  'Sekolah Sains',
  'Sekolah Sukan',
  'Sekolah Seni',
  'SBP',
  'SMJK',
  'KV',
] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];

export interface JomBeelajarApiSchool {
  id: string;
  name: string;
  type: SchoolType;
  district: string;
  state: string;
  averageScore: number;
  participationRate: number;
  activeStudents: number;
}

export interface JomBeelajarApiSchoolStats {
  totalQuizzesTaken: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  lastCalculatedAt: string;
}

export interface JomBeelajarApiSchoolDetail extends JomBeelajarApiSchool {
  code: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  principalName: string | null;
  totalStudents: number | null;
  stats: JomBeelajarApiSchoolStats | null;
}

export interface SchoolPayload {
  name: string;
  type: SchoolType;
  district: string;
  state: string;
  code?: string;
  address?: string;
  website?: string;
  phone?: string;
  principalName?: string;
  totalStudents?: number;
}

export function getSchools() {
  return apiFetch<JomBeelajarApiSchool[]>('/api/v1/schools', null);
}

export function getSchoolDetail(id: string) {
  return apiFetch<JomBeelajarApiSchoolDetail>(`/api/v1/schools/${id}`, null);
}

export function createSchool(payload: SchoolPayload, token: string | null) {
  return apiFetch<JomBeelajarApiSchoolDetail>('/api/v1/schools', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSchool(
  id: string,
  payload: Partial<SchoolPayload>,
  token: string | null
) {
  return apiFetch<JomBeelajarApiSchoolDetail>(`/api/v1/schools/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteSchool(id: string, token: string | null) {
  return apiFetch<void>(`/api/v1/schools/${id}`, token, {
    method: 'DELETE',
  });
}

// Dashboard aggregate stats, backed by JomBeelajar API's mv_user_dashboard_stats.
export interface JomBeelajarApiUserStats {
  completedQuizzes: number;
  averageScore: number;
  activeDays: number;
  weeklyQuizzes: number;
  weeklyAverageScore: number;
  lastQuizDate: string | null;
}

export function getMyStats(token: string | null) {
  return apiFetch<JomBeelajarApiUserStats>('/api/v1/me/stats', token);
}

// JomBeelajar API is authoritative for xp/level/dailyXp/weeklyXp/lastQuizDate —
// its submitAttempt endpoint writes these directly to user_profiles.
// streak is NOT touched by JomBeelajar API; keep reading that from Supabase.
export interface JomBeelajarApiMe {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  xp: number;
  level: number;
  dailyXp: number;
  weeklyXp: number;
  lastQuizDate: string | null;
  schoolRole: string | null;
}

export function getMe(token: string | null) {
  return apiFetch<JomBeelajarApiMe>('/api/v1/me', token);
}

// Attempt history. topic/subject were added to the response after we
// flagged the gap — subject is null on attempts recorded before that fix
// (never captured), topic is present on all attempts.
export interface JomBeelajarApiAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  topic: string | null;
  subject: string | null;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  createdAt: string;
}

export function getMyAttempts(token: string | null) {
  return apiFetch<JomBeelajarApiAttempt[]>('/api/v1/me/attempts', token);
}

// Content tree CRUD (moderator-only). Deletes are guarded server-side —
// deleting a subject/chapter/topic with children returns 409 (subjects
// FK-cascade all the way through quizzes/quiz_attempts/user_topic_progress,
// so this is deliberate friction, not something to bypass).
export interface SubjectPayload {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  orderIndex?: number;
  category?: string;
  categoryPriority?: number;
}

export function createApiSubject(payload: SubjectPayload, token: string | null) {
  return apiFetch<{ id: string }>('/api/v1/subjects', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateApiSubject(
  id: string,
  payload: Partial<SubjectPayload>,
  token: string | null
) {
  return apiFetch<{ id: string }>(`/api/v1/subjects/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteApiSubject(id: string, token: string | null) {
  return apiFetch<void>(`/api/v1/subjects/${id}`, token, {
    method: 'DELETE',
  });
}

export interface ChapterPayload {
  subjectId: string;
  name: string;
  form: number;
  orderIndex: number;
  description?: string;
}

export function createApiChapter(payload: ChapterPayload, token: string | null) {
  return apiFetch<{ id: string }>('/api/v1/chapters', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateApiChapter(
  id: string,
  payload: Partial<ChapterPayload>,
  token: string | null
) {
  return apiFetch<{ id: string }>(`/api/v1/chapters/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteApiChapter(id: string, token: string | null) {
  return apiFetch<void>(`/api/v1/chapters/${id}`, token, {
    method: 'DELETE',
  });
}

export interface TopicPayload {
  chapterId: string;
  name: string;
  description?: string;
  difficultyLevel?: string;
  timeEstimateMinutes?: number;
  orderIndex: number;
}

export function createApiTopic(payload: TopicPayload, token: string | null) {
  return apiFetch<{ id: string }>('/api/v1/topics', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateApiTopic(
  id: string,
  payload: Partial<TopicPayload>,
  token: string | null
) {
  return apiFetch<{ id: string }>(`/api/v1/topics/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteApiTopic(id: string, token: string | null) {
  return apiFetch<void>(`/api/v1/topics/${id}`, token, {
    method: 'DELETE',
  });
}

// Content tree reads — public, confirmed live against the real API (no
// formal contract given; verified directly). No by-slug or by-single-id
// lookup exists for subjects/topics; only "list all subjects" and
// "list a subject's chapters" / "list a chapter's topics".
export interface JomBeelajarApiSubjectListEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  category: string | null;
  orderIndex: number;
  isDisabled: boolean;
  categoryPriority: number | null;
}

export interface JomBeelajarApiChapterListEntry {
  id: string;
  subjectId: string;
  name: string;
  form: number;
  orderIndex: number;
  description: string | null;
}

export interface JomBeelajarApiTopicListEntry {
  id: string;
  chapterId: string;
  name: string;
  description: string;
  difficultyLevel: number;
  timeEstimateMinutes: number;
  orderIndex: number;
}

export function getSubjectsList() {
  return apiFetch<JomBeelajarApiSubjectListEntry[]>('/api/v1/subjects', null);
}

export function getSubjectChapters(subjectId: string) {
  return apiFetch<JomBeelajarApiChapterListEntry[]>(
    `/api/v1/subjects/${subjectId}/chapters`,
    null
  );
}

export function getChapterTopics(chapterId: string) {
  return apiFetch<JomBeelajarApiTopicListEntry[]>(
    `/api/v1/chapters/${chapterId}/topics`,
    null
  );
}

// Reverse lookup: topic -> its parent chapter/subject. No single-topic-detail
// endpoint otherwise exists — only nested lists under a chapter.
export interface JomBeelajarApiTopicBreadcrumb {
  id: string;
  name: string;
  chapterId: string | null;
  chapterName: string | null;
  subjectId: string | null;
  subjectName: string | null;
}

export function getTopicBreadcrumb(topicId: string) {
  return apiFetch<JomBeelajarApiTopicBreadcrumb>(
    `/api/v1/topics/${topicId}/breadcrumb`,
    null
  );
}

// Full nested subjects -> chapters -> topics tree in one call, for admin UIs
// that would otherwise fan out into subjects * chapters individual requests.
// Moderator-only; includes disabled subjects.
export interface JomBeelajarApiTopicTreeEntry {
  id: string;
  name: string;
  orderIndex: number;
  createdAt: string;
  quizCount: number;
}

export interface JomBeelajarApiChapterTreeEntry {
  id: string;
  name: string;
  form: number;
  orderIndex: number;
  description: string | null;
  quizCount: number;
  topics: JomBeelajarApiTopicTreeEntry[];
}

export interface JomBeelajarApiSubjectTreeEntry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDisabled: boolean;
  quizCount: number;
  chapters: JomBeelajarApiChapterTreeEntry[];
}

export function getContentTree(token: string | null) {
  return apiFetch<JomBeelajarApiSubjectTreeEntry[]>('/api/v1/content-tree', token);
}

// Cross-quiz moderator dashboard aggregate — every other audit endpoint is
// scoped to a single quiz/question/answer, so this avoids an admin UI fan-out.
export interface JomBeelajarApiAuditSummary {
  unresolvedQuizComments: number;
  unresolvedQuestionComments: number;
  unresolvedAnswerComments: number;
  verifiedToday: number;
  unverifiedToday: number;
  rejectedToday: number;
  unverifiedQuizCount: number;
}

export function getAuditSummary(token: string | null) {
  return apiFetch<JomBeelajarApiAuditSummary>('/api/v1/admin/audit-summary', token);
}

// Review queue: all unverified quizzes with ancestry + a rolled-up
// unresolved-comment count, replacing an admin-side N+1 (one comment-count
// query per quiz).
export interface JomBeelajarApiUnverifiedQuiz {
  id: string;
  name: string;
  topicId: string;
  topicName: string | null;
  chapterId: string | null;
  chapterName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  createdAt: string | null;
  unresolvedCommentCount: number;
}

export function getUnverifiedQuizzes(token: string | null) {
  return apiFetch<JomBeelajarApiUnverifiedQuiz[]>(
    '/api/v1/admin/quizzes/unverified',
    token
  );
}

// Per-question feedback while playing. Anonymous-friendly (guests can play);
// records nothing — scoring/XP stay on submitAttempt. explanation is null
// until the schema carries one.
export interface CheckAnswerResult {
  isCorrect: boolean;
  correctOptionIds: string[];
  explanation: string | null;
}

export function checkAnswer(
  quizId: string,
  questionId: string,
  selectedAnswerIds: string[],
  token: string | null
) {
  return apiFetch<CheckAnswerResult>(
    `/api/v1/quizzes/${quizId}/questions/${questionId}/check`,
    token,
    { method: 'POST', body: JSON.stringify({ selectedAnswerIds }) }
  );
}

// Per-subject progress rollup + most recent activity (dashboard rings and
// Continue card). A topic is "completed" when the user passed a verified quiz
// in it; topicsTotal counts topics that have at least one verified quiz.
export interface JomBeelajarApiSubjectProgress {
  subjectId: string;
  slug: string;
  name: string;
  topicsTotal: number;
  topicsAttempted: number;
  topicsCompleted: number;
  percent: number;
  lastAttemptAt: string | null;
}

export interface JomBeelajarApiProgressSummary {
  subjects: JomBeelajarApiSubjectProgress[];
  last: {
    subjectId: string;
    subjectSlug: string;
    subjectName: string;
    topicId: string;
    topicName: string;
    attemptedAt: string;
  } | null;
}

export function getMyProgressSummary(token: string | null) {
  return apiFetch<JomBeelajarApiProgressSummary>('/api/v1/me/progress/summary', token, {
    // Fail fast on a cold-starting API instead of hitting the platform timeout.
    signal: AbortSignal.timeout(8000),
  });
}
