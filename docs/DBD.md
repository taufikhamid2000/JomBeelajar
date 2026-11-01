# JomBeelajar — Design Brief (DBD)

> Drafted from the code. Visual intent beyond what the code shows is marked `TODO: confirm`.

## Product feel
Gamified but study-focused: XP, levels, streaks, achievements and leaderboards, aimed at teenagers. `TODO: confirm tone words`

## Platforms
Responsive web (Next.js). `TODO: confirm` mobile-first priority. An Android app exists as a separate repo.

## Visual system
- Tailwind CSS 3 (`tailwind.config.ts`); component conventions in `docs/development/component-design-system.md`.
- Icons: `@heroicons/react`, `lucide-react`, `react-icons`.
- Loading states use skeleton components (`components/ui/Skeleton`).
- Dark mode: real dark palette. `<html class="dark">` enables it (toggle stored in `jb-theme`); no class is the light default. Colours come from role tokens in `src/styles/globals.css` (`brand`, `surface`, `strong`, `soft`, `border`, `band-*`); avoid hard-coded grays.
- Brand: teal (`#0f766e` light, `#2dd4bf` dark) with an amber accent (`#fcd34d`). Logo: open-book mark on a teal tile (`src/components/auth/logo-mark.tsx`, `src/app/icon.svg`). Shell: gradient header band, rounded white sheet, mobile bottom tab bar. Typography unchanged. `TODO: confirm` final brand sign-off.

## Key screens
Landing/sign-in, dashboard, subject/chapter/topic browser, quiz player (timer, per-question feedback, results), profile, leaderboards, rewards claim, career/pathway pages, admin panel.

## Content and language
- UI copy lives in components; no dictionary files found. Language support `TODO: confirm`.
- Subjects and Form levels follow the Malaysian SPM structure.

## Accessibility
`TODO: confirm` target (suggested WCAG AA). Not audited in the repo.

## Principles
`TODO: confirm`. Inferred:
1. Never leak the answer key to players.
2. Show progress and rewards right after a quiz.
3. Guests can try before signing in.
