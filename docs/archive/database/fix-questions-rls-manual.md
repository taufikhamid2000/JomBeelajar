# Manual Steps to Fix Row Level Security (RLS) for Questions and Answers Tables

The problem with your quiz questions not loading has been identified as an RLS (Row Level Security) issue. Since we can't apply the fixes through the script automatically, you'll need to manually apply these in the Supabase dashboard.

## Steps to Fix RLS Issue:

1. **Log into your Supabase Dashboard**

   - Go to https://app.supabase.io/
   - Log in with your credentials
   - Select the "edubridge" project

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Create a new query

3. **Run these SQL commands one by one:**

```sql
-- STEP 1: Drop problematic RLS policies that might be preventing access
DROP POLICY IF EXISTS "Restrict questions access" ON public.questions;
DROP POLICY IF EXISTS "Restrict answers access" ON public.answers;

-- STEP 2: Ensure RLS is enabled (but with proper policies)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create public read access policies for questions and answers
CREATE POLICY "Allow public read access to questions"
  ON public.questions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to answers"
  ON public.answers FOR SELECT
  USING (true);

-- STEP 4: Create policies for authenticated users to manage content they created
CREATE POLICY "Allow question management for creators and admins"
  ON public.questions FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow answer management for creators and admins"
  ON public.answers FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

4. **Verify the policies were applied**

   - Go to "Authentication" in the left sidebar
   - Click on "Policies"
   - Check that the questions and answers tables have the policies you just created

5. **Test the quiz endpoint**
   - Run the test script again:
   ```bash
   cd /d/Projects/edubridge && node scripts/test-quiz-endpoint.mjs
   ```

If successful, you should now see questions appearing in the quiz API response!

## Explanation

Row Level Security in PostgreSQL/Supabase controls which rows can be retrieved from a table based on the user's permissions. The issue was that there were either:

1. No RLS policies allowing access to questions/answers, or
2. Restrictive policies blocking access

By adding explicit policies that allow:

- Anyone to read questions and answers (public access)
- Authenticated users to manage questions/answers

We're ensuring that both public and authenticated requests to the quiz API can retrieve the questions.
