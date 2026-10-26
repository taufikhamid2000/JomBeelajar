# Migration Verification Script

This script checks your database to ensure all migrations were applied correctly.

```sql
-- Count tables in the public schema
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled on all tables
SELECT table_name, row_security_active
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY table_name;

-- Check for RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check for triggers
SELECT
    t.tgname as trigger_name,
    n.nspname as schema_name,
    c.relname as table_name,
    CASE
        WHEN t.tgtype & (1<<0) = (1<<0) THEN 'ROW'
        ELSE 'STATEMENT'
    END as trigger_level,
    CASE
        WHEN t.tgtype & (1<<1) = (1<<1) THEN 'BEFORE'
        WHEN t.tgtype & (1<<6) = (1<<6) THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as activation_time,
    pg_get_functiondef(t.tgfoid) as trigger_function
FROM
    pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE
    n.nspname = 'public' AND
    NOT t.tgisinternal
ORDER BY
    n.nspname, c.relname, t.tgname;

-- Check indexes
SELECT
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    am.amname as index_type
FROM
    pg_class t,
    pg_class i,
    pg_index ix,
    pg_attribute a,
    pg_am am
WHERE
    t.oid = ix.indrelid
    AND i.oid = ix.indexrelid
    AND a.attrelid = t.oid
    AND a.attnum = ANY(ix.indkey)
    AND i.relam = am.oid
    AND t.relkind = 'r'
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY
    t.relname, i.relname;

-- Check foreign keys
SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';

-- Check custom functions
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    t.typname as return_type,
    CASE
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security,
    pg_get_functiondef(p.oid) as definition
FROM
    pg_proc p
    LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
    LEFT JOIN pg_type t ON p.prorettype = t.oid
WHERE
    n.nspname = 'public'
ORDER BY
    n.nspname, p.proname;
```

Run these queries in the SQL Editor of your Supabase dashboard to verify your migrations were applied correctly.
