/**
 * Centralized app-level constants.
 *
 * Prefer importing these over scattering magic numbers across the codebase.
 */

/** Quizzes a student is expected to complete per week (dashboard progress goal). */
export const WEEKLY_QUIZ_TARGET = 10;

/**
 * Default quiz time limit, in minutes, used by the quiz player.
 *
 * NOTE: this is a fallback default. JomBeelajar API's quiz-detail endpoint
 * (GET /api/v1/quizzes/{id}) does not currently return a per-quiz time limit,
 * so we can't source it from the quiz data. If JomBeelajar API later exposes
 * `time_limit`, pass it through and fall back to this value.
 */
export const DEFAULT_QUIZ_TIME_LIMIT_MINUTES = 15;
