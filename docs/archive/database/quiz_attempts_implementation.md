# Implementing the Quiz Attempts Table in Supabase

This document outlines the steps necessary to implement the `quiz_attempts` table in Supabase to resolve the error: `"relation "public.quiz_attempts" does not exist"`.

## Overview

The `quiz_attempts` table stores information about user quiz attempts in the EduBridge application, including:

- Quiz scores
- Number of correct answers
- Time spent
- Completion status

## Implementation Steps

### 1. Apply the Migration Script

Navigate to the SQL Editor in your Supabase dashboard and run the migration script located at:
`/supabase/migrations/20230615000000_create_quiz_attempts.sql`

Or run the migration using the Supabase CLI:

```bash
supabase migration up
```

### 2. Verify Table Creation

Run the following query to verify that the table has been created:

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'quiz_attempts';
```

### 3. Verify RLS Policies

Ensure that the Row Level Security (RLS) policies have been properly applied:

```sql
SELECT * FROM pg_policies WHERE tablename = 'quiz_attempts';
```

## Testing

After implementing the table, test the functionality in the application by:

1. Creating a quiz attempt as a regular user
2. Viewing quiz history in the user profile
3. Viewing quiz attempts in the admin panel

## Data Model

### quiz_attempts

| Column          | Type                     | Description                       |
| --------------- | ------------------------ | --------------------------------- |
| id              | UUID                     | Primary key                       |
| user_id         | UUID                     | Foreign key to auth.users         |
| quiz_id         | UUID                     | ID of the quiz                    |
| score           | INTEGER                  | Points earned                     |
| max_score       | INTEGER                  | Maximum possible points           |
| correct_answers | INTEGER                  | Number of correct answers         |
| total_questions | INTEGER                  | Total number of questions         |
| time_spent      | INTEGER                  | Time spent in seconds             |
| completed       | BOOLEAN                  | Whether the quiz was completed    |
| created_at      | TIMESTAMP WITH TIME ZONE | When the attempt was created      |
| updated_at      | TIMESTAMP WITH TIME ZONE | When the attempt was last updated |

## Security Considerations

- Regular users can only see, insert, and update their own quiz attempts
- Admin users can view all quiz attempts
- No users can delete quiz attempts directly (data retention policy)
