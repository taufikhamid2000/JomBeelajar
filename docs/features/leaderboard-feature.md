# Leaderboard Feature Implementation

This document outlines the implementation of the leaderboard feature in JomBeelajar.

## Overview

The leaderboard feature allows students to compare their progress with peers, fostering a sense of friendly competition and motivating continuous engagement with the platform.

## Features

- **Global Leaderboard**: View top-performing students across the platform
- **Time-based Filtering**: Filter by daily, weekly, or all-time performance
- **Subject-specific Leaderboards**: Filter rankings by subject area
- **Personal Ranking**: Easily see your own rank among peers

## Database Schema Updates

The feature required the following schema updates:

```sql
-- Create user_profiles table in public schema to extend auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  daily_xp INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  last_quiz_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- New achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER,
  max_progress INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile when a new user signs up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## How to Apply Database Migrations

Run the migration script using:

```bash
npm run db:migrate
```

This will apply the leaderboard-related schema changes to your Supabase database.

## Components

The leaderboard consists of several components:

1. **LeaderboardPage**: Main container component
2. **LeaderboardHeader**: Shows title and user's current rank
3. **LeaderboardFilters**: Time frame and subject filters
4. **LeaderboardTable**: Displays ranked users with their stats

## Integration Points

- Quiz completion updates user XP and stats via `updateUserStats` function
- Dashboard contains multiple entry points to the leaderboard
- Header menu provides global navigation to the leaderboard

## Future Enhancements

Potential future improvements:

- Class/school specific leaderboards
- Subject mastery leaderboards
- Achievement-based filtering
- Customizable avatars for profile display
- Shareable achievements/rankings on social media
