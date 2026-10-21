'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { hardNavigate } from '@/lib/hard-navigate';
import { AuthBrandingPanel } from '@/components/auth/auth-branding-panel';
import { LogoMark } from '@/components/auth/logo-mark';
import { PasswordInput } from '@/components/auth/password-input';
import { Spinner } from '@/components/auth/spinner';

// Jom ID portal: signs in once for every *.taufikhamid.com app, then sends
// the browser back to `next`.
const JOM_ID_CONTINUE_URL = 'https://akaun.taufikhamid.com/continue';
const PRODUCTION_ORIGIN = 'https://jombeelajar.taufikhamid.com';
// Same destination every sign-in method below lands on.
const POST_LOGIN_PATH = '/dashboard';

const noopSubscribe = () => () => {};

// window.location.origin in the browser; the production origin while
// server-rendering (no window there).
function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => PRODUCTION_ORIGIN
  );
}

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jomIdHref = `${JOM_ID_CONTINUE_URL}?next=${encodeURIComponent(
    `${useOrigin()}${POST_LOGIN_PATH}`
  )}`;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) hardNavigate(POST_LOGIN_PATH);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        // TODO(auth): No email verification / confirmation flow yet.
        // Email confirmation is disabled on the Supabase project, so
        // signUp() returns a session immediately and everyone can sign in
        // right away — add a transactional email provider (e.g. SendGrid)
        // and gate dashboard access on a confirmed email if this changes.
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) {
          setError(err.message);
          return;
        }
        if (!data.session) {
          setError('Check your email to confirm your account.');
          return;
        }
        hardNavigate(POST_LOGIN_PATH);
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message);
          return;
        }
        hardNavigate(POST_LOGIN_PATH);
      }
    } catch {
      setError('Unable to connect to the API. Please contact the administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInAnonymously();
      if (err) {
        setError(err.message);
        return;
      }
      hardNavigate(POST_LOGIN_PATH);
    } catch {
      setError('Unable to connect to the API. Please contact the administrator.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        scopes: 'email profile',
        queryParams: { prompt: 'select_account' },
      },
    });
    if (err) setError(err.message);
  };

  const errorId = 'auth-form-error';
  const inputClass =
    'auth-input rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring';

  const title = mode === 'signin' ? 'Welcome back' : 'Create an account';
  const subtitle =
    mode === 'signin' ? 'Sign in to continue your learning journey.' : 'Start tracking your progress today.';

  return (
    <div className="flex min-h-screen flex-1 md:items-stretch">
      <AuthBrandingPanel />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted px-4 py-12">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <LogoMark size={28} />
          <span className="text-lg font-semibold text-foreground">JomBeelajar</span>
        </Link>

        <div className="w-full max-w-sm animate-page-in rounded-2xl border border-border bg-background p-8">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mb-6 text-sm text-foreground/60">{subtitle}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : undefined}
              className={inputClass}
            />

            <PasswordInput
              id="password"
              name="password"
              placeholder="Password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={setPassword}
              ariaInvalid={!!error}
              ariaDescribedBy={error ? errorId : undefined}
              className={inputClass}
            />

            {mode === 'signup' && (
              <PasswordInput
                id="confirm"
                name="confirm"
                placeholder="Confirm password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
                showLabel="Show confirm password"
                hideLabel="Hide confirm password"
                ariaInvalid={!!error}
                ariaDescribedBy={error ? errorId : undefined}
                className={inputClass}
              />
            )}

            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {loading && <Spinner />}
              {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : mode === 'signup' ? 'Sign up' : 'Sign in'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground/40">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <a
            href={jomIdHref}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Continue with Jom ID
          </a>

          <button
            type="button"
            onClick={handleGoogle}
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {loading && <Spinner />}
            Try the demo — no account needed
          </button>

          <p className="mt-6 text-center text-sm text-foreground/60">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
