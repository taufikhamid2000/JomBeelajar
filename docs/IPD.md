# JomBeelajar — Implementation Plan (IPD)

> A living roadmap. Update it when work ships or priorities change. Status is inferred from the repo; `TODO: confirm` priorities with the owner.

## Status: live on Vercel (https://jombeelajar.taufikhamid.com), API on Render free tier

## Done
- [x] Subject, chapter, topic, quiz browsing and quiz player with per-question feedback
- [x] Server-side scoring, XP, levels, streaks, topic progress, achievements
- [x] Quiz authoring, moderator verification, audit comments
- [x] Leaderboards (students, schools), school pages, profiles
- [x] Career guidance and education pathway pages
- [x] Rewards claim flow
- [x] Admin panel (content, quizzes, users, achievements, schools, logs)
- [x] Jom ID shared session (`.taufikhamid.com`) and `jomid_joined_jombeelajar()`
- [x] CI: lint, Jest, Playwright smoke; keepalive cron for the API
- [x] 8s fail-fast API timeout ("Fail fast when the API is cold-starting")
- [x] Architecture doc, README refresh, screenshots
- [x] Docs (PRD, TRD, AFD, DBD, BSD, IPD)

## Next (suggested order) `TODO: confirm`
1. **Re-check Vercel function timeouts** now the 8s fail-fast is in: confirm cold-start requests fail cleanly and the UI shows a useful retry state.
2. **Make the API reliably awake:** consider a second pinger (e.g. an external uptime monitor) or a paid Render plan; the GitHub cron alone is unreliable.
3. **Capture the `edubridge` schema** (and columns such as quizzes difficulty/is_public, rewards tables) in migrations or a baseline so a fresh database can be rebuilt.
4. **Signed-in E2E:** set `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` in CI so the dashboard and profile specs run.
5. **Tidy `package.json` scripts** (several `build:*` variants, `migrate:app-router`). `TODO: confirm` which are still needed.
6. **Reconcile docs:** stale material under `docs/archive/`; check `docs/database/` against the live schema.
7. **Accessibility and localisation review.**

## Backlog / ideas
`TODO: confirm`

## Definition of done
- `npm run build` passes (type check) and `npm run lint` is clean.
- `npm test` passes; `npm run test:e2e` run when touching routes or auth.
- Schema changes: idempotent migration in `supabase/migrations`, RLS policy, and the API repo updated if endpoints change.
- Docs updated when a change makes them wrong.
- Commit straight to `main`.
