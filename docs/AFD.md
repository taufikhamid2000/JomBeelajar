# JomBeelajar — App Flow (AFD)

> Drafted from the codebase routes and `docs/ARCHITECTURE.md`.

## Route map
- **Public:** `/` (landing), `/auth` (sign-in), `/about`, `/api-docs`, `/privacy`, `/terms`, `/leaderboard`, `/leaderboard/schools`, `/schools/[id]`, `/career-guidance`, `/education-pathway`, quiz browsing and play. `TODO: confirm` exactly which pages are guest-accessible.
- **Signed in:** `/dashboard`, `/profile`, `/profile/[userId]`, `/rewards`, `/rewards/success`, `/career-guidance/contribute`, `/quiz/[subject]/[topic]/create`, `.../[quizId]/questions`
- **Admin:** `/admin`, `/admin/content` (+ subjects, chapters, topics, quizzes by id), `/admin/quizzes` (`all`, `pending`, `stats`, `new`, `[quizId]/audit|preview|questions`), `/admin/users`, `/admin/achievements`, `/admin/schools`, `/admin/comments`, `/admin/logs`, `/admin/settings`, `/admin/migrations`, `/admin/make-admin`
- **Route handlers (`/api/*`):** achievements, admin, answers, auth, dashboard, leaderboard, me, profile, questions, quiz, quizzes, quizzes-list, schools, subjects, topics, user, user-stats

## Flow 1 — Sign-in
```
Landing (/) or protected page ──► /auth ──► Jom ID session ──► /dashboard
Already signed in on another Jom app ──► shared cookie (.taufikhamid.com) ──► signed in
/auth/logout ──► clears the session everywhere
```

## Flow 2 — Browse and play a quiz
```
Subject ──► chapters ──► topic ──► quiz list ──► play
Play: GET /api/quiz/[id] (no answer key) ──► answer a question ──► POST .../check (per-question feedback)
  ──► finish ──► POST .../submit (needs session, else 401) ──► API scores ──► result screen
```
Guests can play and get feedback; only signed-in users get a recorded attempt. Unverified quizzes award no XP or progress.

## Flow 3 — Progress and rewards
Attempt scored ──► XP, level, streak, topic progress, achievements update ──► dashboard, profile, leaderboards. The rewards page checks eligibility by time frame and takes a claim with payment details. `TODO: confirm` reward rules.

## Flow 4 — Author a quiz
`.../[topic]/create` (name, difficulty, time limit, public flag) ──► add questions and answers (author view includes `isCorrect`) ──► quiz starts unverified ──► awaits a moderator.

## Flow 5 — Moderation
Admin pending list ──► preview ──► audit comments on quiz/question/answer (suggestion, issue, approved, rejected) ──► verify / unverify (logged in the verification log) ──► quiz counts for XP.

## Flow 6 — Leaderboards and schools
Leaderboard (all-time or weekly), school leaderboard, school page with stats; a profile can link a school and set visibility.

## Flow 7 — Career and pathways
Career guidance and education pathway pages list options; users can comment and contribute.

## Error handling
Route handlers map API `404`/`403` to proper responses. An API timeout (8s) or failure surfaces as a handled error. Server logging via `src/lib/logger.ts`; `system_logs` and `admin_logs` tables. `TODO: confirm` error-boundary coverage.
