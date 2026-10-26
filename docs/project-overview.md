# JomBeelajar Project Overview

## Introduction

JomBeelajar is an educational platform built with Next.js and Supabase, designed to provide structured learning experiences through subjects, chapters, topics, and interactive quizzes. The platform includes gamification elements like achievements, leaderboards, and XP to increase engagement.

## Core Architecture

### Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Database & Auth**: Supabase
- **Testing**: Jest with React Testing Library
- **Deployment**: Vercel

### Directory Structure

The project follows a hybrid approach with both Next.js App Router and Pages Router components:

```
/src
├── app/                  # App Router components and routes
│   ├── api/              # API routes (App Router)
│   ├── dashboard/        # Dashboard features
│   ├── admin/            # Admin panel features
│   └── ...
├── pages/                # Pages Router (legacy components)
│   └── api/              # API routes (Pages Router)
├── components/           # Shared React components
│   ├── ui/               # Base UI components
│   ├── admin/            # Admin-specific components
│   └── ...
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities and services
├── services/             # API service functions
├── styles/               # Global CSS and Tailwind config
├── types/                # TypeScript type definitions
└── __tests__/            # Test files organized by feature
```

## Core Features

### Content Structure

The platform's educational content follows this hierarchy:

```
Subjects → Chapters → Topics → Quizzes
```

- **Subjects**: Main educational categories (e.g., Math, Science)
- **Chapters**: Major divisions within subjects
- **Topics**: Specific learning units with content
- **Quizzes**: Interactive assessments for topics

### User Progress System

- XP points for completing activities
- Level progression based on XP
- Streaks for consistent platform usage
- Achievements for completing milestones

### Admin Panel

Comprehensive admin tools for:

- User management
- Content management
- Analytics and reporting
- System configuration

## Data Flow

1. **Authentication Flow**:

   - User authentication via Supabase Auth
   - Role-based access control
   - Session management across pages

2. **Content Delivery**:

   - Content fetched from Supabase database
   - Cached via React Query for performance
   - Progressive loading patterns for large content

3. **User Progress**:
   - Quiz results stored in Supabase
   - XP calculations performed server-side
   - Leaderboard data updated in real-time

## Key Design Decisions

1. **Hybrid Routing Approach**:

   - App Router for newer features
   - Pages Router for legacy components (migration in progress)

2. **Security Model**:

   - Row Level Security (RLS) in Supabase
   - Service role for admin operations
   - Client-side validation with server-side verification

3. **Error Handling**:
   - Global error boundary component
   - Structured logging system
   - Custom console override in production

## Future Architectural Plans

1. **Complete App Router Migration**:

   - Move remaining Pages Router components to App Router
   - Consolidate routing patterns

2. **Performance Optimizations**:

   - Implement streaming responses
   - Improve initial load time
   - Add offline support

3. **Infrastructure**:
   - Implement CI/CD pipeline
   - Add automatic database backups
   - Improve testing coverage
