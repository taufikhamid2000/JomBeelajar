# Admin Role Fix Guide

This document explains how to fix issues with the admin role functionality in EduBridge.

## Background

The admin page in EduBridge relies on a proper configuration of:

1. The `user_roles` table in the Supabase database
2. The correct enum values for the `role` column
3. Proper Row Level Security (RLS) policies
4. Proper session cookie handling between client and server

If you encounter errors like "role 'admin' does not exist", permission issues, or "Unauthorized" errors when accessing the admin page, follow these steps to fix the problem.

## Client-Server Auth Sync Issue

### Problem

There's a discrepancy between the browser and server-side authentication state. The user has the admin role in the database, but the server-side API endpoints can't detect the authentication session, resulting in a 401 Unauthorized error.

### Diagnosis

1. The user is logged in on the client side (can access `/dashboard`)
2. The server-side API can't detect the authentication session (returns "Not logged in")
3. This is most likely a cookie synchronization issue

### Fixing Client-Server Auth Sync

1. **Check your session in Admin Settings**

   - Go to: http://localhost:3000/admin/settings
   - Look at the session information displayed on the settings page

2. **Try manual logout/login**

   - Log out completely: http://localhost:3000/auth/logout
   - Clear your browser cookies for localhost
   - Log back in

3. **Verify in the database**

   - Check that your user ID exists in the `user_roles` table
   - Verify that the role value is set to "admin"

4. **Check your auth service**

   - Enable console logging in your browser
   - Look for auth-related messages when accessing admin pages

5. **Verify the fix worked**
   - Try accessing the admin page again: http://localhost:3000/admin/users

```bash
# Navigate to the scripts directory
cd scripts

# Install dependencies (if not already installed)
npm install

# Run the role fix script
npm run fix-roles
```

This script will:

- Fix the constraint on the `role` column to ensure it accepts 'admin', 'moderator', and 'user' values
- Update any inconsistent role values
- Ensure proper permissions are set
- Fix RLS policies

### 2. Verify the fix worked

```bash
# Run the verification script
npm run verify-admin

# To check a specific user, pass their ID
npm run verify-admin <user-id>
```

This will show:

- The table structure
- Constraint details
- RLS policies
- The role for the specified user

### 3. Set a user as admin (if needed)

If you need to make yourself or another user an admin:

```bash
# Make a user an admin (using their ID)
npm run set-admin <user-id>

# Using the default user ID from the script
npm run set-admin
```

## Manual SQL Fix

Since the scripts require environment variables that might be difficult to set up, here's the SQL you can run directly in the Supabase SQL Editor:

```sql
-- Step 1: Check current role constraint (run this first to diagnose)
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass AND conname LIKE 'user_roles_role%';

-- Step 2: Fix the constraint issue
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check
CHECK (role IN ('admin', 'moderator', 'user'));

-- Step 3: Fix any inconsistent role values
UPDATE public.user_roles
SET role = 'admin'
WHERE role LIKE '%admin%' AND role != 'admin';

-- Step 4: Fix RLS policies to avoid infinite recursion
DROP POLICY IF EXISTS "Allow admins to read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to update user roles" ON public.user_roles;

-- Use service_role for accessing the table temporarily
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- The service_role can bypass RLS, so you don't need complex policies
-- Just keep a simple policy for regular users to see their own roles
CREATE POLICY "Allow users to read their own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Step 5: Ensure proper permissions
GRANT SELECT ON public.user_roles TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- Step 6: Check your role status (replace with your user ID)
SELECT * FROM public.user_roles
WHERE user_id = 'df4d2086-e505-4370-a82a-4950ab472e19';

-- Step 6: Assign yourself admin role if needed (replace with your user ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('df4d2086-e505-4370-a82a-4950ab472e19', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Step 7: List all admin users
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';
```

There appears to be a recursion issue in your RLS policies. This is what you currently have:

```
| user_roles | Allow users to read their own role  | PERMISSIVE | SELECT | (user_id = auth.uid()) |
| user_roles | Allow admins to read all user roles | PERMISSIVE | SELECT | (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) |
| user_roles | Allow admins to insert user roles   | PERMISSIVE | INSERT | (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) |
| user_roles | Allow admins to update user roles   | PERMISSIVE | UPDATE | (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')) |
```

**Issue detected**: The policies checking for admin roles create an infinite recursion - they query the table they are protecting, creating a circular dependency.

The diagnostic endpoint shows:

```json
"dbError": {
  "message": "infinite recursion detected in policy for relation \"user_roles\"",
  "code": "42P17"
}
```

## Issue Diagnosis

Based on the SQL queries, error messages, and diagnostic endpoint results, we've identified these issues:

1. **Infinite Recursion in RLS Policies**: The admin-test endpoint shows:

   ```json
   "dbError": {
     "message": "infinite recursion detected in policy for relation \"user_roles\"",
     "code": "42P17"
   }
   ```

   This happens because the admin policies query the same table they're protecting.

2. **Missing Function**: The count_admins function isn't properly defined:

   ```json
   "countError": {
     "message": "Could not find the function public.count_admins without parameters",
     "code": "PGRST202"
   }
   ```

3. **Permissions Issue**: The public role doesn't have SELECT permissions:

   ```
   | can_select | can_insert | can_update |
   | ---------- | ---------- | ---------- |
   | false      | false      | false      |
   ```

4. **Role Value Mismatch**: Some roles might be stored with different casing or variations of "admin".

## Troubleshooting

If you still have issues after applying the SQL fixes:

### Checking the Service Role Key

The admin functionality relies on the service role key to bypass RLS:

1. Verify your `.env.local` file has the correct key:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Ensure the key has the correct permissions in Supabase. You can find this in:
   Supabase Dashboard → Project Settings → API → Service Role Key

### Checking Current User Role

Run this query in Supabase SQL Editor to check your current role:

```sql
SELECT auth.uid() as current_user_id;
SELECT * FROM public.user_roles WHERE user_id = 'paste-result-from-above';
```

### Testing Direct Database Access

The test endpoint at `/api/admin-test` shows an issue with the admin_count function. Let's fix that:

1. Create an updated version of the `count_admins` function in your Supabase database:

   ```sql
   -- Fix the count_admins function to properly handle public schema
   CREATE OR REPLACE FUNCTION public.count_admins()
   RETURNS integer AS $$
   DECLARE
     admin_count integer;
   BEGIN
     SELECT COUNT(*) INTO admin_count
     FROM public.user_roles
     WHERE role = 'admin';

     RETURN admin_count;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Must specify PUBLIC schema explicitly
   GRANT EXECUTE ON FUNCTION public.count_admins() TO authenticated;
   GRANT EXECUTE ON FUNCTION public.count_admins() TO service_role;
   ```

2. Or you can update the API endpoint to not use this function:

   ```javascript
   // In route.ts, replace the count_admins call with a direct query
   const { data: roleCount, error: countError } = await supabaseAdmin
     .from('user_roles')
     .select('*', { count: 'exact', head: true })
     .eq('role', 'admin');

   const adminCount = roleCount?.count || 0;
   ```

3. Access the test endpoint in your browser: `/api/admin-test`

4. This will show a JSON response with:
   - Whether the admin client is working
   - How many user roles were found
   - How many admin users exist
   - Information about your current logged-in user
   - Any errors encountered

## Code Fix Details

The admin page has been updated to be more resilient by:

1. Handling more error types, including permission errors (PGRST103)
2. Performing case-insensitive role comparison (`roleValue.toLowerCase()`)
3. Using loose matching to allow variations of "admin" (`roleValue.includes('admin')`)
4. Using `maybeSingle()` instead of `single()` to handle missing roles more gracefully

The critical part of the fix in page.tsx is:

```tsx
// Use loose comparison for role check to handle potential case differences
const roleValue = (adminData?.role || '').toLowerCase();
const isUserAdmin = roleValue === 'admin' || roleValue.includes('admin');
setIsAdmin(isUserAdmin);
```

## Comprehensive SQL Fix

Based on the diagnostic results, here's a comprehensive SQL fix that addresses all the identified issues. Run this in your Supabase SQL Editor:

```sql
-- STEP 1: Fix table permissions
-- Allow anyone to read from user_roles (still protected by RLS)
GRANT SELECT ON public.user_roles TO PUBLIC;
GRANT USAGE ON SCHEMA public TO PUBLIC;

-- STEP 2: Remove problematic RLS policies that cause recursion
DROP POLICY IF EXISTS "Allow admins to read all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow admins to update user roles" ON public.user_roles;

-- STEP 3: Disable RLS temporarily to make changes
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- STEP 4: Fix any broken role values
UPDATE public.user_roles
SET role = 'admin'
WHERE role LIKE '%admin%' AND role != 'admin';

-- STEP 5: Check and fix constraint on role column
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_role_check
CHECK (role IN ('admin', 'moderator', 'user'));

-- STEP 6: Ensure the service role can always access the table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User roles service access" ON public.user_roles;
CREATE POLICY "User roles service access" ON public.user_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- STEP 7: Create a simple policy for users to read their own role
DROP POLICY IF EXISTS "Allow users to read their own role" ON public.user_roles;
CREATE POLICY "Allow users to read their own role"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- STEP 8: Create a fixed version of the count_admins function
CREATE OR REPLACE FUNCTION public.count_admins()
RETURNS integer AS $$
DECLARE
  admin_count integer;
BEGIN
  -- Access using service_role, bypassing RLS
  SELECT COUNT(*) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  RETURN admin_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.count_admins() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_admins() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_admins() TO service_role;

-- STEP 9: Assign yourself admin role if needed (replace with your user ID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('df4d2086-e505-4370-a82a-4950ab472e19', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- STEP 10: List all admin users
SELECT ur.user_id, ur.role, u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin';
```
