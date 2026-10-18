# JomBeelajar

JomBeelajar is an educational platform built with Next.js and Supabase, designed to provide structured learning experiences with gamification elements to increase engagement.

**Live demo:** https://edubridge-sigma.vercel.app

[![Next.js](https://img.shields.io/badge/Next.js-15.5.19-blue)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.7-blue)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-blue)](https://tailwindcss.com/)

Also in the stack: [@tanstack/react-query](https://tanstack.com/query) for
server-state caching, [react-hook-form](https://react-hook-form.com/) for
forms, [date-fns](https://date-fns.org/) for date handling, and
[lucide-react](https://lucide.dev/) / [react-icons](https://react-icons.github.io/react-icons/)
for icons.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- Supabase account

### Environment Setup

1. Copy `.env.example` to a new file named `.env.local`
2. Fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key for admin operations (required for admin features)

For detailed environment setup instructions, see [Environment Setup Guide](./docs/environment-setup.md).

### Development Server

```bash
npm install
npm run dev
```

### Database Migrations

For database schema changes, we use Supabase migrations. Apply them as follows:

```bash
# Using Supabase CLI
supabase migration up

# Or use our script
./scripts/apply_quiz_attempts_migration.sh
```

To fix the "quiz_attempts table not found" error, see the [Quiz Attempts Migration Guide](./docs/database/apply_quiz_attempts_migration.md).

For more details about database schema and management, see the [Database Documentation](./docs/database/).

The repo also has a handful of ad hoc SQL scripts under `supabase/` used
for one-off fixes and backfills rather than as part of the regular
migration sequence:

- `fix_quizzes_rls.sql`, `fix_topics_rls.sql` — RLS policy patches
- `backfill_display_name.sql` — backfills user display names
- `populate_leaderboard.sql` — populates leaderboard data
- `manual_migration_steps.sql` — manual steps for cases the CLI can't handle

There are also npm scripts wrapping some of these flows:

```bash
npm run db:migrate         # scripts/apply-migration.mjs
npm run db:migrate:admin   # applies admin-migration.sql
npm run db:test            # scripts/test_quiz_attempts_table.mjs
```

### Optimized Production Builds

For production deployment, we offer optimized build commands:

```bash
# Standard build
npm run build

# Optimized build with segment config for admin routes
npm run build:optimized
```

The optimized build script creates segment config files that mark admin and API routes as dynamic, which:

1. Reduces build time by skipping pre-rendering of admin pages
2. Ensures admin data is always fresh at runtime
3. Improves CI/CD pipeline efficiency

For more details, see the [Build Optimization Summary](./docs/development/build-optimization-summary.md), [Admin Routes Optimization Guide](./docs/development/admin-routes-optimization.md), and [Dashboard Optimization Summary](./docs/DASHBOARD_OPTIMIZATION_SUMMARY.md).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📚 Documentation

### Core Documentation

- [Project Overview](./docs/project-overview.md) - Architecture, data flow, and design decisions
- [Development Guide](./docs/development-guide.md) - Workflow, best practices, and troubleshooting
- [API Documentation](./docs/api-documentation.md) - API endpoints and usage
- [Environment Setup](./docs/environment-setup.md) - Setting up the environment
- [Component Design System](./docs/component-design-system.md) - UI component architecture
- [Authentication System](./docs/authentication-system.md) - Auth implementation details
- [Testing Strategy](./docs/testing-strategy.md) - Testing approach and practices
- [Performance Optimization](./docs/performance-optimization.md) - Performance best practices
- [Database Schema Reference](./docs/database/database-schema-reference.md) - Database structure

### Feature Documentation

- [Admin Panel Documentation](./docs/admin-panel.md) - Admin features and functionality
- [Admin Role Fix Guide](./docs/admin-role-fix.md) - Fixing admin role issues
- [Leaderboard Feature](./docs/leaderboard-feature.md) - Leaderboard implementation details

## 🧪 Testing

This project uses Jest and React Testing Library for testing components, hooks, utilities, and services. To run the tests:

```bash
npm test          # Run tests once
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

Tests are organized in the following structure:

- `src/__tests__/components/` - Component tests
- `src/__tests__/hooks/` - Hook tests
- `src/__tests__/lib/` - Utility function tests
- `src/__tests__/services/` - Service function tests

See [`TESTING_CHECKLIST.md`](./TESTING_CHECKLIST.md) for the manual QA
checklist to run through before a release.

When adding new features, please add corresponding tests.

## Production Security

For production deployments, we've implemented several security measures:

- Removed all debugging endpoints and tools
- Implemented proper error logging through the logger service
- Added secure authentication validation for admin functions
- Applied the principle of least privilege for all database operations

See [Security Considerations](./docs/admin-panel.md#security-considerations) in the admin documentation for more details.

## Scripts

| Script | Purpose |
| --- | --- |
| `dev` | Start the dev server |
| `dev:fast` | Dev server with Turbopack |
| `build` | Production build |
| `build:analyze` | Production build with the bundle analyzer |
| `build:optimize` | Runs `scripts/add-dynamic-config.sh` then builds |
| `build:optimized` | Runs `scripts/improved-segment-configs.sh` then builds |
| `start` | Start the production server |
| `lint` | Lint with autofix |
| `predeploy` | Lint + prebuild + build, meant to run before deploying |
| `db:migrate` | Apply a migration via `scripts/apply-migration.mjs` |
| `db:migrate:admin` | Apply `admin-migration.sql` |
| `db:test` | Run `scripts/test_quiz_attempts_table.mjs` |
| `migrate:app-router` | Run `scripts/migrate-to-app-router.mjs` |
| `test` / `test:watch` / `test:coverage` | Jest test runs |

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.

---
Built by [Muhammad Taufik](https://taufik.vercel.app)
