import { logger } from '@/lib/logger';
import { supabase } from './supabase';
import { jomCookieOptions } from '@/lib/supabase/cookie-options';

export const signUp = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) throw error;

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (signInError) throw signInError;
  return signInData.session;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session;
};

export const signOut = async () => {
  logger.log('SignOut function started');

  // Logging out must never be blocked by Supabase's own availability. If
  // Supabase is down, slow, or unreachable, the user still ends up logged
  // out on this device (the auth cookies are expired locally below after at
  // most 3s); they just don't get the "invalidate every other device's
  // session too" bonus.
  if (typeof window !== 'undefined') {
    logger.log('Removing auth token from localStorage');
    try {
      localStorage.removeItem('supabase.auth.token');
    } catch (error) {
      logger.error('Error clearing localStorage:', error);
    }
  }

  // Server-side global revocation, raced against a short timeout so a
  // hung/unreachable request can delay the redirect below by at most 3s.
  // Jom ID: the session now lives in the shared *.taufikhamid.com cookie,
  // and supabase-js only clears it AFTER the network call returns — so it
  // must be awaited (bounded) before navigating away, or the hard redirect
  // aborts it and the user stays signed in (in every Jom app).
  await Promise.race([
    supabase.auth.signOut({ scope: 'global' }),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ])
    .then((result) => {
      if (result && typeof result === 'object' && 'error' in result && result.error) {
        logger.error('Supabase signOut error (non-blocking):', result.error);
      } else {
        logger.log('Supabase signOut completed (or timed out without blocking)');
      }
    })
    .catch((error) => {
      logger.error('Error signing out from Supabase (non-blocking):', error);
    });

  // If the call above timed out or failed, the auth cookies are still there:
  // expire them locally with the same Domain/Path they were written with
  // (Jom ID shared cookie), so this device is signed out regardless.
  if (typeof document !== 'undefined') {
    const { domain, path } = jomCookieOptions(window.location.hostname);
    for (const part of document.cookie.split(';')) {
      const name = part.split('=')[0].trim();
      if (!name.startsWith('sb-')) continue;
      document.cookie = `${name}=; Max-Age=0; Path=${path ?? '/'}${
        domain ? `; Domain=${domain}` : ''
      }`;
    }
  }

  logger.log('Redirecting to /auth...');

  // Use a hard redirect that won't be caught by Next.js router. Standardized
  // to /auth everywhere sign-out happens (Header, profile settings, and the
  // dedicated /auth/logout page all now land in the same place).
  document.location.href = '/auth';
  return true;
};
