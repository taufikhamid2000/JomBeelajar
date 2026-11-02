-- Security audit M11: materialized view edubridge.mv_user_dashboard_stats is selectable by
-- anon/authenticated through PostgREST and cannot carry RLS, so every user's stats were
-- readable by anyone. Its only consumer is JomBeelajar-API (EF Core over a direct
-- postgres connection), and the Next.js app no longer reads it via PostgREST.
-- Revoke API-role access; postgres/service_role keep access.
revoke all on edubridge.mv_user_dashboard_stats from anon, authenticated;
