# Field Name Standardization Migration Plan

## Background

Our database currently has inconsistent field naming across tables:

- `chapters` table uses `title` for the primary name field
- `topics` table uses `name`
- `subjects` table uses `name`
- `quizzes` table uses `name`

This inconsistency is causing bugs and confusion.

## Migration Plan

### Step 1: Database Migration (requires downtime)

Create and apply a migration script to rename columns:

- Rename `title` to `name` in `chapters` table

```sql
-- First add a new column
ALTER TABLE chapters ADD COLUMN name text;

-- Copy data from title to name
UPDATE chapters SET name = title;

-- Make the name column not null if title was not null
ALTER TABLE chapters ALTER COLUMN name SET NOT NULL;

-- Remove the title column
ALTER TABLE chapters DROP COLUMN title;
```

### Step 2: Update TypeScript Type Definitions

- Update all interfaces that define Chapter types to use `name` instead of `title`
- Modify entityMappers.ts to ensure consistent field access

### Step 3: Update Service Layer

- Update all service functions that reference `chapter.title` to use `chapter.name` instead
- Update all database queries to use the new column names

### Step 4: Update UI Components

- Update all components that display or reference `chapter.title`
- Use a systematic approach to ensure all references are updated

### Step 5: Testing

- Test all affected features thoroughly
- Pay special attention to searching, sorting, and filtering functionality

## Revert Plan

If issues are encountered, we can:

1. Roll back the database migration (requires backup)
2. Restore the previous code from version control
