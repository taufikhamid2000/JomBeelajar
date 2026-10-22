'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { hardNavigate } from '@/lib/hard-navigate';
import { AuthBrandingPanel } from '@/components/auth/auth-branding-panel';
import { LogoMark } from '@/components/auth/logo-mark';
import { PasswordInput } from '@/components/auth/password-input';
import { Spinner } from '@/components/auth/spinner';
import { jomIdSignupHref } from '@/lib/jom-id';

// Jom ID portal: signs in once for every *.taufikhamid.com app, then sends
// the browser back to `next`.
const JOM_ID_CONTINUE_URL = 'https://jomid.taufikhamid.com/continue';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
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

  const errorId = 'auth-form-error';
  const inputClass =
    'auth-input rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring';

  const title = 'Welcome back';
  const subtitle = 'Sign in to continue your learning journey.';

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
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              ariaInvalid={!!error}
              ariaDescribedBy={error ? errorId : undefined}
              className={inputClass}
            />

            {error && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {loading && <Spinner />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground/40">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-3">
          <a
            href={jomIdHref}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Continue with Jom ID
          </a>

          <button
            type="button"
            onClick={handleDemo}
            disabled={loading}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {loading && <Spinner />}
            Try the demo — no account needed
          </button>
          </div>

          <p className="mt-6 text-center text-sm text-foreground/60">
            {"Don't have an account?"}{' '}
            <a href={jomIdSignupHref} className="font-medium text-primary underline-offset-4 hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
