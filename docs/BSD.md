# JomBeelajar — Backend Schema (BSD)

> Derived from `supabase/migrations/` (this repo) and the sibling repo JomBeelajar-API. Authoritative state lives in the database.

## Where it lives
- **Database:** Supabase Postgres, shared with other Jom apps (Jom ID login, one session cookie on `.taufikhamid.com`). The code uses schema `edubridge` (`db: { schema: 'edubridge' }`). The migrations in this repo create tables as `public.*`; only `20261021220000_jomid_joined.sql` uses `edubridge.`. `TODO: confirm` how tables got into `edubridge`; no `set schema` migration is in the repo.
- **API:** JomBeelajar-API, ASP.NET Core (.NET 10) with EF Core + Npgsql, deployed on **Render** (Docker web service, free tier, **cold starts** after ~15 min idle) at https://jombeelajar-api.taufikhamid.com (`/health`, Scalar docs at `/scalar/v1`). It validates Supabase JWTs, maps onto this schema, and owns no EF migrations. This repo's `supabase/migrations` are the schema source of truth.
- **Client resilience:** `src/lib/jombeelajar-api.ts` has an 8s fail-fast timeout (`API_TIMEOUT_MS`) because Vercel functions timed out while Render was asleep. A GitHub Actions cron (`keepalive.yml`, every 10 min) pings `/health`, but it is unreliable. See TRD.

## Tables (from migrations)
| Table | Key columns | Notes |
|---|---|---|
| `subjects` | name, slug (unique), description, icon, order_index, category, category_priority, is_disabled | |
| `chapters` | subject_id, form, name, topics, order_index | |
| `topics` | chapter_id, name, description, difficulty_level (1-5), time_estimate_minutes, order_index | |
| `quizzes` | topic_id, name, created_by, verified, verified_by, verified_at, verification_feedback, `time_limit` (seconds, default 900) | API also exposes difficulty and is_public; `TODO: confirm` columns, not in migrations |
| `questions` | quiz_id, type (`radio`/`checkbox`), order_index | text column inferred |
| `answers` | question_id, is_correct, order_index | `is_correct` hidden from players |
| `quiz_attempts` | quiz_id, user_id, score, max_score, correct_answers, total_questions, time_taken, completed, quiz_title, subject, topic, is_verified_quiz | |
| `user_topic_progress` | user_id, topic_id, status (`not_started`/`in_progress`/`completed`), score, attempts, last_attempted_at | completed = passed a verified quiz, score >= 70 |
| `user_profiles` | id, display_name, avatar_url, xp, level, streak, daily_xp, weekly_xp, last_quiz_date, is_disabled, school_id, school_role, is_school_visible | |
| `user_roles` | user_id, role (user / moderator / admin) | |
| `achievements` | user_id, achievement_type, title, description, icon, earned_at, progress, max_progress | users cannot write |
| `schools` | name, type (SMK, SMKA, MRSM, SBP, SMJK, KV, ...), code, district, state, address, website, phone, principal_name, total_students | |
| `school_stats`, `school_stats_history` | averages, participation, quizzes taken, active students; history snapshots | |
| `career_pathways` + link table | slug, title, description, icon, order_index, is_disabled; career_id, subject_id, requirement_type | |
| `pathway_comments`, `career_comments` | user_id, author_name, comment, is_anonymous | |
| `quiz_audit_comments`, `question_audit_comments`, `answer_audit_comments` | admin_user_id, comment_text, comment_type (`suggestion`/`issue`/`approved`/`rejected`), is_resolved | |
| `quiz_verification_log` | quiz_id, admin_user_id, action (`verified`/`unverified`/`rejected`), reason | |
| `admin_logs`, `system_logs`, `auth_logs`, `user_sessions`, `oauth_connections` | audit and session support | |
| `site_config` | config | |
| `mv_dashboard_subject_stats`, `mv_user_dashboard_stats` | materialized views for the dashboard | |

Hierarchy: `subjects → chapters → topics → quizzes → questions → answers`. Rewards tables: `TODO: confirm` (the rewards page and `rewardService` exist; no migration found).

## Functions
| Function | Purpose |
|---|---|
| `edubridge.jomid_joined_jombeelajar()` | tells Jom ID whether the user has a `user_profiles` row; not client-callable |

## API endpoints (JomBeelajar-API, `/api/v1`)
Reads are public unless noted; writes need a Bearer Supabase token. Moderator and Admin are policies.
| Area | Endpoints |
|---|---|
| Content | `GET /subjects`, `/subjects/{id}/chapters`, `/chapters/{id}/topics`, `/topics/{id}/quizzes`, `/topics/{id}/breadcrumb`, `/content-tree`; Moderator `POST/PATCH/DELETE` on `/subjects`, `/chapters`, `/topics` |
| Quizzes | `GET /quizzes/{id}` (no `is_correct`); `POST /quizzes`, `PATCH /quizzes/{id}`, `GET /quizzes/{id}/author` (auth); `POST /quizzes/{id}/verify` (Moderator); `POST /quizzes/{quizId}/questions/{questionId}/check` (anonymous, per-question feedback, records nothing) |
| Questions / answers | `POST /quizzes/{quizId}/questions`, `GET/PATCH/DELETE /questions/{id}`, `POST /questions/{id}/answers`, `PATCH/DELETE /answers/{id}` |
| Attempts | `POST /quizzes/{quizId}/attempts` (auth, server-side scoring, XP only for verified quizzes), `GET /me/attempts` |
| Me | `GET/PATCH /me`, `/me/progress`, `/me/progress/summary`, `/me/stats`, `/me/achievements` |
| Leaderboard / schools | `GET /leaderboard` (`period`, `limit`); `GET /schools`, `/schools/{id}`; Admin `POST/PATCH/DELETE /schools` |
| Achievements | `GET /achievements`, `GET /users/{id}/achievements`; Moderator writes |
| Audit | `GET/POST/PATCH` comments on quizzes, questions, answers; `GET /admin/audit-summary`, `/admin/quizzes/unverified`, `/quizzes/{id}/verification-log` (Moderator) |
| Ops | `GET /health`, `GET /` |

The web client wraps these in `src/lib/jombeelajar-api.ts`; same-origin `/api/*` handlers in this repo front them. Dashboard, profile and user-stats handlers read Supabase directly.

## Conventions
- UUID primary keys, `timestamptz` timestamps, RLS enabled on user data tables, check constraints instead of enum types, snake_case columns.
- Migrations are timestamped SQL in `supabase/migrations`, applied via `npm run db:migrate` (`scripts/apply-migration.mjs`, needs `SUPABASE_DB_URL`). Ad-hoc fix scripts also sit in `supabase/*.sql`. Write idempotent SQL.

## Gotchas
- Cross-app FKs are not allowed; only `auth.users` is shared.
- Schema `public` (migrations) vs `edubridge` (runtime): do not assume a fresh database rebuilds from migrations.
- Do not run `dotnet ef` against this database.
