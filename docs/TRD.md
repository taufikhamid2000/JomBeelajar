# JomBeelajar — Technical Requirements (TRD)

> Drafted from the codebase. `TODO: confirm` marks inferred items. Deeper detail: `docs/ARCHITECTURE.md`.

## Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 15.5 (App Router), React 19 |
| Language | TypeScript 6 (`ignoreBuildErrors: false`, so type errors fail the build) |
| Styling | Tailwind CSS 3, `@heroicons/react`, `lucide-react`, `react-icons` |
| Client data | TanStack Query 5, react-hook-form, date-fns |
| Auth / DB | Supabase (`@supabase/ssr`, `supabase-js`), schema `edubridge` |
| Business logic | JomBeelajar-API (ASP.NET Core .NET 10 on Render); see BSD |
| Tests | Jest + React Testing Library (`src/__tests__`), Playwright smoke (`e2e/`) |
| Hosting | Vercel, region `sin1` (`vercel.json`) |

## Architecture
```
Browser ──► Next.js on Vercel (pages + /api/* route handlers)
              ├─► Supabase (session, a few direct reads: dashboard, profile, user stats)
              └─► JomBeelajar-API on Render (Bearer = Supabase access token) ──► Supabase Postgres
```
- The browser only calls same-origin `/api/*` route handlers, never the backend API.
- Pages in `src/app/(app)`; components in `src/components`; hooks, client services and lib helpers alongside.
- All backend calls go through `src/lib/jombeelajar-api.ts` (typed functions over one `apiFetch`). Route handlers get the token from `src/lib/serverSession.ts`.
- `src/middleware.ts` refreshes the Supabase session and sets `no-store` headers.
- **Jom ID:** `src/lib/supabase/cookie-options.ts` sets the session cookie on `.taufikhamid.com` in production (host-only on localhost/previews); `legacy-cookies.ts` expires old host-only cookies.

## Auth and access
- Sign-in via shared Jom ID; guests may browse and play, submitting an attempt needs a session (401 otherwise).
- Roles `user` / `moderator` / `admin` enforced by the API (`Moderator`, `Admin` policies). `/api/admin/*` handlers exist in this repo.
- The API validates Supabase-issued JWTs.

## Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client |
| `SUPABASE_URL` | Server-only fallback for the URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only; privileged/admin calls |
| `SUPABASE_DB_URL` | `npm run db:migrate` only |
| `JOMBEELAJAR_API_URL` | Base URL of the API (`https://jombeelajar-api.taufikhamid.com`) |
| `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` | Signed-in Playwright specs (optional) |

## Build, test, deploy
- `npm run build` (type check included), `npm run lint`, `npm test`, `npm run test:e2e` (needs a production build).
- CI (GitHub Actions): `ci.yml` (lint + Jest on push to `main` and PRs), `test.yml` (tests on push/PR to `main`), `e2e.yml` (Playwright on push to `main` and manual dispatch; uses repo secrets), `keepalive.yml` (see risks).
- Deploy: Vercel Git integration from `main`. `TODO: confirm` branch policy.
- Manual QA: `TESTING_CHECKLIST.md`.

## Constraints and risks
- **Render cold starts.** The API runs on Render's free tier and sleeps after ~15 min idle. A cold start can take far longer than a Vercel function limit.
- **8s fail-fast timeout.** `src/lib/jombeelajar-api.ts` sets `API_TIMEOUT_MS = 8000` via `AbortSignal.timeout`, kept under Vercel Hobby's 10s limit. Added because Vercel functions were timing out while the API was asleep; a timeout now surfaces as a handled `TimeoutError` instead of a platform error. Users still see an error on the first request after sleep.
- **Keepalive is unreliable.** `.github/workflows/keepalive.yml` pings `/health` every 10 min (cron `*/10`), but GitHub scheduled runs are delayed or skipped, so the API can still sleep. It only emits a warning on a non-200.
- Vercel Hobby's 10s limit may still affect other slow routes. `TODO: confirm` current plan and limits.
- Schema source of truth is `supabase/migrations`, but the app reads schema `edubridge` while the migrations create `public.*` tables; see BSD.
- Some Supabase reads happen directly in route handlers, others via the API; two data paths to keep consistent.
- `TODO: confirm` performance/availability targets.
