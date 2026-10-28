# JomBeelajar — Product Requirements (PRD)

> Drafted from the codebase. Items marked `TODO: confirm` are inferred or unknown and need the owner's input.

## Summary
JomBeelajar is a gamified learning web app for Malaysian SPM students: browse subjects, chapters and topics, take quizzes, earn XP and achievements, and climb student and school leaderboards. Live at https://jombeelajar.taufikhamid.com. Part of the Jom app suite (shared login via Jom ID).

## Problem
`TODO: confirm` (inferred: SPM revision material is scattered and unengaging; quizzes with XP, streaks and leaderboards make practice habitual).

## Target users
- SPM students (Form-based content, `chapters.form`). `TODO: confirm primary persona`
- Quiz authors and moderators/admins who create, audit and verify content.
- Guests can browse and play quizzes without an account.
- Current stage: `TODO: confirm` (no signup cap or access gate found in the repo).

## Goals
`TODO: confirm`. Inferred from the product:
1. Make practice quick: pick subject, chapter, topic, quiz and play.
2. Keep students coming back: XP, levels, streaks, achievements, leaderboards.
3. Keep content trustworthy: only verified quizzes award points; moderators audit with comments.
4. Help with next steps: career guidance and education pathways.

## Non-goals (current)
`TODO: confirm`.

## Features (shipped)
| Area | Description | Route |
|---|---|---|
| Landing / sign-in | Public landing; sign-in uses Jom ID | `/`, `/auth` |
| Dashboard | Per-user stats and progress | `/dashboard` |
| Subjects and quizzes | Chapters, topics, quiz list, quiz player with per-question feedback and results | `/quiz/[subject]/chapters`, `/quiz/[subject]/[topic]`, `.../play/[quizId]` |
| Quiz authoring | Create quizzes, questions and answers (radio/checkbox) | `.../[topic]/create`, `.../[quizId]/questions` |
| Profile | Own and public profiles, achievements, quiz history | `/profile`, `/profile/[userId]` |
| Leaderboards | Students (weekly option) and schools | `/leaderboard`, `/leaderboard/schools` |
| Schools | School pages and stats | `/schools/[id]` |
| Career guidance | Career pathways, comments, contributions | `/career-guidance`, `/career-guidance/contribute` |
| Education pathway | Searchable pathways, contribution form | `/education-pathway` |
| Rewards | Reward eligibility and claim form (bank details) | `/rewards`, `/rewards/success` |
| Admin | Content tree, quizzes (all/pending/stats/audit/preview), users, achievements, schools, comments, logs, settings, migrations | `/admin/*` |
| Info | About, API docs, privacy, terms | `/about`, `/api-docs`, `/privacy`, `/terms` |

## Key requirements
- **Answer key privacy:** correct answers are never sent to players; feedback comes from a per-question check endpoint.
- **Content integrity:** unverified quizzes award no XP or progress; moderators verify, audit and comment.
- **Roles:** user, moderator, admin (`user_roles`, API policies).
- **Shared identity:** one Jom ID session across `*.taufikhamid.com`.

## Success metrics
`TODO: confirm` (suggested: registered students, weekly active students, quiz attempts per active student, verified quizzes per subject).

## Open questions
- Rewards: what is paid, to whom, and under what rules? `TODO: confirm`
- UI language: no dictionary files found; is Bahasa Malaysia planned? `TODO: confirm`
- Is the Android app (JomBeelajar-Android) at feature parity? `TODO: confirm`
