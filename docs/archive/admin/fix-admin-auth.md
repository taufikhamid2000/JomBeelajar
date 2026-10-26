# Fixing Admin Authentication Issues in EduBridge

## Step 1: Visit the Unified Debug Console

I've created a comprehensive debug console that will help diagnose and fix your admin authentication issues:

1. Visit http://localhost:3000/debug/unified
   - This unified console includes all diagnostic tools in one place
   - It checks environment configuration, authentication status, Google Auth, and admin tools
   - It provides a step-by-step guide to resolving your issues

## Step 2: Add the Service Role Key

The main issue is that your application is missing the `SUPABASE_SERVICE_ROLE_KEY` environment variable, which is critical for admin operations.

1. Get your Service Role Key from the Supabase dashboard:

   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Project Settings > API
   - Copy the `service_role` key (it's secret - never share it publicly)

2. Add it to your `.env.local` file:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard
   ```

3. Restart your Next.js development server completely.

## Step 3: Using the Unified Debug Console

The debug console has several tabs to help you diagnose and fix issues:

1. **Overview** - Shows you a summary of all issues and steps to fix them
2. **Authentication** - Check your auth status and fix cookie synchronization issues
3. **Environment** - Verify your environment variables and test the admin key
4. **Google Auth** - Special tools for Google Authentication users
5. **Admin Tools** - Manually assign admin roles if needed

If you're using Google Authentication, check the Google Auth tab and click "Apply Google Auth Fix".

## Step 5: Verify the Fix

1. After applying the fixes, visit http://localhost:3000/api/debug/check-session

   - Verify that `status` is "Logged in" and `user.role` is "admin"

2. Then try accessing the admin page again: http://localhost:3000/admin/users

## If All Else Fails

As a last resort, try the manual admin role assignment:

1. Visit http://localhost:3000/admin/make-admin
2. Enter your user ID (you can get it from the /debug/auth page)
3. Click "Grant Admin Role"
