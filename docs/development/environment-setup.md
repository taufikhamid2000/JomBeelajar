# Environment Setup Guide

This guide explains how to configure the environment variables required for JomBeelajar development.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Analytics (if using analytics services)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Optional: Error tracking (if using error tracking services)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_LEADERBOARD=true
NEXT_PUBLIC_ENABLE_ACHIEVEMENTS=true
```

## Variable Sources

### Supabase Credentials

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Navigate to Project Settings > API
3. Find the following credentials:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` key (`SUPABASE_SERVICE_ROLE_KEY`)

![Supabase API Keys Location](https://supabase.com/docs/img/project-api-keys.png)

## Environment Setup for Different Scenarios

### Local Development

For local development, create a `.env.local` file with all the required variables.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
```

### Production Deployment

For production deployment (e.g., on Vercel):

1. Add all the required environment variables to your hosting platform
2. Ensure all variables are set before deployment
3. Use the service role key with caution as it bypasses Row Level Security

### Testing Environment

For the testing environment, create a `.env.test` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxx
```

## Checking Environment Configuration

You can check if your environment is properly configured by:

1. Starting the development server: `npm run dev`
2. Navigating to: http://localhost:3000/api/debug-env (only available in development mode)
3. Verifying that all required environment variables are present

## Troubleshooting

### Missing Environment Variables

If you see errors like "Cannot read properties of undefined (reading 'supabase')" or "Missing Supabase credentials", check that:

1. Your `.env.local` file exists in the project root
2. All required variables are properly defined
3. There are no typos in variable names
4. You've restarted the development server after adding the variables

### Invalid Service Role Key

If admin features aren't working properly:

1. Verify that your `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check that it's the service role key, not the anon key
3. Ensure it has the required permissions in your Supabase project

### Supabase Connection Issues

If you're having trouble connecting to Supabase:

1. Check that your project is active in the Supabase dashboard
2. Verify that your IP address is allowed (if using IP restrictions)
3. Make sure your Supabase plan has enough capacity for your usage

## Security Considerations

- **NEVER** commit your `.env.local` file to version control
- Keep your service role key secret - it bypasses Row Level Security
- In production, use environment variable encryption when available
- Rotate keys periodically for enhanced security
