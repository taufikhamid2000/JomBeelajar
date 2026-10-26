# How to Apply the Quiz Attempts Database Migration

This guide explains how to add the `quiz_attempts` table to your Supabase database to fix the error: `"relation "public.quiz_attempts" does not exist"`.

## Prerequisites

- Access to your Supabase project
- Supabase CLI installed (optional but recommended)

## Option 1: Using the Supabase CLI (Recommended)

1. Ensure you have the Supabase CLI installed:

   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:

   ```bash
   supabase login
   ```

3. Link your project:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

   Replace `YOUR_PROJECT_REF` with your Supabase project reference ID.

4. Apply the migration:
   ```bash
   supabase migration up
   ```

## Option 2: Using the Migration Script

1. Make the script executable:

   ```bash
   chmod +x ./scripts/apply_quiz_attempts_migration.sh
   ```

2. Run the script:
   ```bash
   ./scripts/apply_quiz_attempts_migration.sh
   ```

## Option 3: Using the Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Navigate to the "SQL Editor" section
3. Copy the contents of the migration file: `supabase/migrations/20230615000000_create_quiz_attempts.sql`
4. Paste it into the SQL Editor and run the script

## Verifying the Migration

Run the following SQL query to verify that the table was created:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'quiz_attempts'
);
```

You should see `t` (true) as the result if the table exists.

## Testing in the Application

After applying the migration, navigate to the Admin User Detail page in your application. The "Quiz History" tab should now load properly without any database errors.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Look for specific error codes (e.g., 42P01 indicates a missing relation)
3. Verify that your Supabase connection is working
4. Make sure your user has the necessary permissions to create tables

For more help, see the [Supabase Documentation](https://supabase.com/docs) or contact your database administrator.
