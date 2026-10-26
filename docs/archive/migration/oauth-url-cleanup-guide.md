# OAuth Authentication URL Cleanup Guide

## Problem Description

Sometimes after OAuth authentication (Google login), the URL contains authentication tokens in the hash fragment instead of a clean redirect:

```
❌ Inconsistent: http://localhost:3000/dashboard#access_token=...&expires_at=...&refresh_token=...
✅ Expected: http://localhost:3000/dashboard
```

## Root Cause Analysis

### Why This Happens

1. **OAuth Implicit Flow**: OAuth providers return tokens in URL hash fragments as part of the standard OAuth 2.0 implicit flow
2. **Race Condition**: There's a timing issue between:

   - Supabase processing tokens from the URL hash
   - Your app's navigation/rendering logic
   - Browser URL display updates

3. **Supabase's `detectSessionInUrl` Setting**: While this setting (`detectSessionInUrl: true`) automatically processes tokens, the timing of URL cleanup can vary

### When It Occurs

- **Sometimes**: Supabase processes tokens quickly and cleans the URL before you see it
- **Sometimes**: The URL is displayed with tokens before Supabase processes them
- **Factors affecting timing**: Browser performance, network latency, app bundle size, React hydration timing

## Implemented Solutions

### 1. Enhanced Providers Component (`src/components/Providers.tsx`)

Added comprehensive URL token cleanup logic:

```typescript
const cleanOAuthTokensFromUrl = () => {
  if (typeof window === 'undefined') return;

  const hash = window.location.hash;

  // Check if URL contains OAuth tokens
  if (
    hash &&
    (hash.includes('access_token=') ||
      hash.includes('refresh_token=') ||
      hash.includes('expires_at=') ||
      hash.includes('token_type='))
  ) {
    // Clean the URL by removing the hash
    const cleanUrl = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', cleanUrl);
    logger.info('Cleaned OAuth tokens from URL hash');
  }
};
```

**Features:**

- Runs on component mount
- Triggers after successful sign-in events
- Handles page visibility changes
- Includes proper timing delays

### 2. Custom OAuth Redirect Hook (`src/hooks/useOAuthRedirect.ts`)

A reusable hook for consistent OAuth handling:

```typescript
export const useOAuthRedirect = (redirectPath: string = '/dashboard') => {
  // Handles OAuth redirects and cleans URL tokens
  // Ensures consistent behavior across all pages
};
```

**Benefits:**

- Centralized OAuth logic
- Reusable across components
- Handles edge cases
- Proper error handling

### 3. Updated Supabase Configuration (`src/lib/supabase.ts`)

Enhanced OAuth settings:

```typescript
auth: {
  persistSession: true,
  autoRefreshToken: true,
  storageKey: 'edubridge-auth-storage-key',
  detectSessionInUrl: true,
  flowType: 'pkce', // Use PKCE flow for better security
  debug: process.env.NODE_ENV === 'development',
}
```

**Improvements:**

- PKCE flow for better security
- Debug mode in development
- Optimized realtime settings

### 4. Enhanced OAuth Configuration (`src/app/auth/page.tsx`)

Updated Google OAuth settings:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/dashboard',
    scopes: 'email profile',
    queryParams: {
      prompt: 'select_account',
    },
  },
});
```

## How the Solution Works

### Flow Overview

1. **User clicks "Login with Google"**
2. **Redirected to Google OAuth**
3. **Google redirects back with tokens in URL hash**
4. **Multiple cleanup mechanisms activate:**
   - Providers component cleans URL on mount
   - OAuth redirect hook handles redirects
   - Auth state change listeners clean URL
   - Page visibility change handlers as backup

### Timing Strategy

- **Immediate cleanup**: On component mount
- **Event-based cleanup**: On auth state changes
- **Delayed cleanup**: Small delays to ensure Supabase processes tokens first
- **Backup cleanup**: On page visibility changes

## Testing the Solution

### Before the Fix

```bash
# Sometimes you'd see:
http://localhost:3000/dashboard#access_token=eyJ...&token_type=bearer&expires_in=3600&expires_at=1234567890&refresh_token=abc123...
```

### After the Fix

```bash
# Consistently clean URL:
http://localhost:3000/dashboard
```

### Test Cases

1. **Fresh login**: Login → Clean redirect to dashboard
2. **Page refresh**: Refresh with tokens → Tokens cleaned immediately
3. **Tab switching**: Switch tabs → Tokens cleaned on return
4. **Direct navigation**: Navigate to dashboard with tokens → Tokens cleaned

## Best Practices Applied

### 1. **Multiple Fallbacks**

- Primary: Auth state change listeners
- Secondary: Component mount cleanup
- Tertiary: Page visibility handlers

### 2. **Proper Timing**

- Small delays to ensure Supabase processes tokens
- Non-blocking URL cleanup
- Immediate visual feedback

### 3. **Error Handling**

- Graceful fallbacks if cleanup fails
- Logging for debugging
- No impact on authentication flow

### 4. **Performance Optimization**

- Minimal impact on app performance
- Efficient token detection
- Clean URL history management

## Configuration Options

### Supabase Auth Settings

```typescript
// For even more aggressive cleanup:
auth: {
  detectSessionInUrl: true,
  flowType: 'pkce',
  autoRefreshToken: true,
  persistSession: true,
  debug: true, // Enable in development
}
```

### Custom Cleanup Intervals

```typescript
// In useOAuthRedirect hook:
const CLEANUP_DELAY = 100; // Adjust timing if needed
const VISIBILITY_CLEANUP_DELAY = 50; // Backup cleanup timing
```

## Monitoring & Debugging

### Log Messages to Watch

```
✅ OAuth authentication successful, redirecting...
🔧 Cleaned OAuth tokens from URL hash
🔐 User signed in via OAuth
```

### Debug Mode

Set `debug: true` in Supabase auth config to see detailed OAuth flow logs.

## Summary

The inconsistent OAuth URL behavior was caused by timing variations in token processing. Our solution provides multiple layers of URL cleanup to ensure users always see clean URLs after authentication, regardless of timing variations or browser performance differences.

The implementation is:

- **Robust**: Multiple fallback mechanisms
- **Performance-optimized**: Minimal impact on app speed
- **User-friendly**: Clean URLs every time
- **Developer-friendly**: Clear logging and debugging options
