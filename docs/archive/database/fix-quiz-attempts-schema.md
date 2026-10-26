# Fix Quiz Attempts Database Schema Error

## Problem

The error `"Could not find the 'completed_at' column of 'quiz_attempts' in the schema cache"` occurs because:

1. The code tries to insert `started_at` and `completed_at` columns that don't exist in your table
2. Your table schema doesn't match the migration file exactly

## Solution Applied

### 1. Code Fix

I've updated the `submitQuizAttempt` function in `/src/lib/quiz.ts` to:

- Remove references to non-existent `started_at` and `completed_at` columns
- Use only columns that exist in your table schema
- Updated the TypeScript interface in `/src/types/topics.ts` to match

### 2. Database Schema Options

#### Option A: Add Missing Columns (Recommended)

Run this SQL in your Supabase SQL Editor to add the missing columns:

```sql
-- Add max_score column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='quiz_attempts' AND column_name='max_score') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN max_score INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add correct_answers column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='quiz_attempts' AND column_name='correct_answers') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN correct_answers INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add total_questions column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='quiz_attempts' AND column_name='total_questions') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN total_questions INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='quiz_attempts' AND column_name='updated_at') THEN
        ALTER TABLE public.quiz_attempts ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quiz_attempts_updated_at ON public.quiz_attempts;
CREATE TRIGGER update_quiz_attempts_updated_at
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
```

#### Option B: Keep Current Schema

If you prefer to keep your current schema, no additional database changes are needed. The code has been updated to work with your existing columns.

## Testing

1. Start the application: `npm run dev`
2. Navigate to a quiz and complete it
3. The quiz submission should now work without the column error

## Files Modified

- `/src/lib/quiz.ts` - Fixed column references in submitQuizAttempt function
- `/src/types/topics.ts` - Updated QuizAttempt interface to match schema
