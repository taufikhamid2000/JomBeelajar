# Supabase Migration Instructions

This document explains how to run the database migrations for the EduBridge project.

## Prerequisites

Before running migrations, you need:

1. Access to your Supabase project
2. Supabase service role key (or direct database access)

## Option 1: Using Supabase CLI (Recommended)

The Supabase CLI is the officially recommended way to handle migrations.

### Installation

#### Windows (PowerShell)

```powershell
iwr -useb https://cli.supabase.com/install.ps1 | iex
```

#### macOS / Linux

```bash
curl -s https://cli.supabase.com/install.sh | bash
```

#### Using Brew (macOS)

```bash
brew install supabase/tap/supabase
```

### Running Migrations

1. Link your project (you only need to do this once):

```bash
supabase link --project-ref your-project-ref
```

2. Apply migrations:

```bash
supabase db push
```

## Option 2: Using the Apply Migrations Script

We've created a script that can run all migrations in order.

### Setup

1. Install required packages:

```bash
npm install @supabase/supabase-js pg dotenv
```

2. Make sure your `.env` file in the project root has the following variables (you already have these):

```
# Supabase URL and keys
NEXT_PUBLIC_SUPABASE_URL=https://fbxcmlrwydbguzjnktag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Direct database connection string (only if you have direct access)
# SUPABASE_DB_URL=postgres://postgres:password@db.<project-ref>.supabase.co:5432/postgres
```

### Running the Script

```bash
node scripts/apply-migrations.mjs
```

## Option 3: Manual SQL Execution

You can also manually execute the SQL files through the Supabase dashboard:

1. Log in to your Supabase project
2. Go to the SQL Editor
3. Open each migration file in order (they are numbered sequentially)
4. Execute each SQL file

## Migration Files

The migration files are located in the `supabase/migrations/` directory and should be executed in numerical order.

## Verifying Migrations

After running migrations, you can verify the tables were created correctly:

1. Go to the Supabase Dashboard
2. Navigate to the Database section
3. Check the table list to ensure all tables are present
4. You can also run a test query like:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you're using the service role key, not the anon key.
2. **Missing Extensions**: If you see errors about missing extensions, make sure `uuid-ossp` is enabled.
3. **RLS Errors**: If you're getting RLS-related errors, you might need to temporarily disable RLS for the migration.

For further assistance, refer to the Supabase documentation or contact your database administrator.
