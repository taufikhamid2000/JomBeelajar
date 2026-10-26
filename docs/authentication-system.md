# Authentication System

This document explains the authentication system implemented in JomBeelajar.

## Overview

JomBeelajar uses Supabase Authentication for user management. The system handles user registration, login, session management, and role-based access control.

## Architecture

![Authentication Flow](https://i.imgur.com/exampleflowchart.png)

### Components

1. **Supabase Auth**: Provides the core authentication functionality
2. **Auth Hooks**: Custom React hooks for auth state management
3. **Protected Routes**: HOCs and middleware for route protection
4. **Role-Based Access**: Controls access to different parts of the application

## Implementation

### Auth Service (`src/lib/auth.ts`)

The auth service provides the core functions for authentication:

- `signUp`: Registers a new user
- `signIn`: Authenticates a user
- `signOut`: Logs out a user
- `resetPassword`: Initiates password reset
- `updatePassword`: Changes a user's password

### Session Management

Sessions are managed through Supabase's client-side and server-side methods:

- Client-side: Uses the Supabase JS client's auth methods
- Server-side: Uses the Supabase SSR helpers for Next.js

### Role-Based Access Control

User roles are stored in the `user_roles` table and include:

- **user**: Regular user with basic access
- **moderator**: Can moderate content but not access admin features
- **admin**: Full access to all features including admin panel

### Protected Routes

Routes are protected using:

1. **Client-side protection**: React context and custom hooks
2. **Server-side protection**: Middleware checks for API routes
3. **Database-level protection**: Row Level Security (RLS) policies

## User Registration Flow

1. User fills out registration form
2. Form data is validated client-side
3. `signUp` function is called with email and password
4. Supabase creates the user in the `auth.users` table
5. A database trigger creates a corresponding entry in `user_profiles`
6. User is automatically signed in

## Login Flow

1. User enters credentials
2. Credentials are validated by Supabase
3. On successful validation, Supabase:
   - Returns a session object with an access token
   - Sets authentication cookies
4. The application stores the session
5. User is redirected to the dashboard

## Session Recovery

If there are issues with session tokens:

1. The `recoverSession` function in `src/lib/supabase.ts` attempts to:
   - Clear invalid tokens
   - Force a new authentication
   - Restore the session state

## Security Considerations

- Passwords are never stored in plain text
- API Routes verify authentication server-side
- Sensitive operations require re-authentication
- Service role key is only used server-side
- Session tokens have appropriate expirations

## Testing Authentication

Use the following test accounts during development:

- Regular user: `test@example.com` / `password123`
- Admin user: `admin@example.com` / `password123`

To run auth-related tests:

```bash
npm test -- --testPathPattern=auth
```

## Troubleshooting

### Common Issues

1. **"Invalid refresh token" errors**

   - Clear browser cookies and local storage
   - Use the `recoverSession` function

2. **Admin authorization issues**

   - Check `user_roles` table for correct role assignment
   - Verify service role key is properly configured
   - See `docs/admin-role-fix.md` for detailed fixes

3. **Session not persisting**
   - Check browser cookie settings
   - Verify Supabase client configuration
   - Check for CORS issues
