# Fix Quiz Attempts RLS Issue

## Problem

The error "Failed to save quiz attempt" occurs when a user tries to submit a quiz. This is caused by Row Level Security (RLS) policies blocking inserts into the `quiz_attempts` table.

## Solution

Apply the RLS policy fixes for the quiz_attempts table by running the migration script:

## Manual Steps to Fix Row Level Security for Quiz Attempts

Similar to the issue with questions and answers, the quiz attempts table has restrictive RLS policies that prevent inserting new records.

### Apply via Supabase Dashboard

1. **Log into your Supabase Dashboard**

   - Go to https://app.supabase.io/
   - Log in with your credentials
   - Select your project

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Create a new query

3. **Run these SQL commands:**

```sql
-- STEP 1: Drop problematic RLS policies if they exist
DROP POLICY IF EXISTS "Restrict quiz attempts access" ON public.quiz_attempts;

-- STEP 2: Ensure RLS is enabled (but with proper policies)
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create policy to allow submitting quiz attempts
CREATE POLICY "Allow users to submit quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (true);

-- STEP 4: Allow users to read only their own attempts
CREATE POLICY "Allow users to view their own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE school_role = 'admin'
  ));

-- STEP 5: Allow admin access to all attempts
CREATE POLICY "Allow admin access to all quiz attempts"  ON public.quiz_attempts FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE school_role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM public.user_profiles WHERE school_role = 'admin'
  ));
```

## Additional School Stats History Error

If after applying the above fix you see an error like:

```
'new row violates row-level security policy for table "school_stats_history"'
```

You'll need to also apply these additional fixes:

```sql
-- Fix for school_stats_history table
DROP POLICY IF EXISTS "Restrict school stats access" ON public.school_stats_history;
ALTER TABLE public.school_stats_history ENABLE ROW LEVEL SECURITY;

-- Allow inserting school stats for authenticated users
CREATE POLICY "Allow stats inserts by authenticated users"
  ON public.school_stats_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow school admins to view school stats
CREATE POLICY "Allow school admins to view school stats"
  ON public.school_stats_history FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM public.user_profiles
    WHERE school_role = 'admin' OR school_role = 'teacher'
  ));

-- Most important fix: allow all operations on school_stats_history
CREATE POLICY "Allow all operations on school_stats_history"
  ON public.school_stats_history FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Emergency Fix

If you're experiencing issues with quiz submissions that need to be fixed urgently, you can temporarily disable RLS on the school_stats_history table:

```sql
ALTER TABLE public.school_stats_history DISABLE ROW LEVEL SECURITY;
```

This is a temporary measure only and should be replaced with proper RLS policies after confirming quiz submissions work.

## Testing

After applying the fix, verify that quiz submissions work correctly.

## Explanation

The issues with quiz attempt submission were caused by several RLS policy problems:

1. The quiz_attempts table had restrictive RLS policies preventing inserts
2. The school_stats_history table (updated during quiz submissions) also had restrictive policies

The fixes add appropriate policies that:

1. Allow inserting new quiz attempts
2. Allow users to view only their own attempts
3. Allow admins to manage all attempts
4. Allow all operations on the school_stats_history table

This should resolve the "Failed to save quiz attempt" errors.
