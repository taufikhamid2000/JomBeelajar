-- Per-quiz time limit, in seconds (900 = 15 min, matching the EduBridge client
-- default). Added so the JomBeelajar API quiz-detail endpoint can expose `timeLimit`
-- instead of the player falling back to a hardcoded default.
--
-- NOT NULL DEFAULT 900 backfills every existing quiz immediately, so there are
-- no nulls to handle on either side. Reversible: `alter table public.quizzes
-- drop column time_limit;`
alter table public.quizzes
  add column if not exists time_limit integer not null default 900;
