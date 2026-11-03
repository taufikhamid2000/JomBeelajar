// src/__tests__/components/Header.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { hardNavigate } from '@/lib/hard-navigate';
import { verifyAdminAccess } from '@/services/adminAuthService';

jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
}));
jest.mock('@/lib/hard-navigate', () => ({
  hardNavigate: jest.fn(),
}));
jest.mock('@/services/adminAuthService', () => ({
  verifyAdminAccess: jest.fn(),
}));

type AuthCallback = (
  event: string,
  session: { user: { email: string } } | null
) => Promise<void> | void;

let authCallback: AuthCallback;
const unsubscribe = jest.fn();

// Header subscribes to onAuthStateChange (it no longer calls getSession), so
// the shared supabase mock needs that method; capture the callback so tests
// can emit auth events.
function mockAuthSubscription() {
  (supabase.auth as unknown as Record<string, unknown>).onAuthStateChange =
    jest.fn((cb: AuthCallback) => {
      authCallback = cb;
      return { data: { subscription: { unsubscribe } } };
    });
}

async function emitAuth(session: { user: { email: string } } | null) {
  await act(async () => {
    await authCallback('SIGNED_IN', session);
  });
}

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('dark');
    window.localStorage.clear();
    mockAuthSubscription();
    jest.mocked(verifyAdminAccess).mockResolvedValue({
      isAdmin: false,
    } as Awaited<ReturnType<typeof verifyAdminAccess>>);
  });

  it('renders the brand link to the landing page when signed out', () => {
    render(<Header />);
    const brand = screen.getByRole('link', { name: /JomBeelajar/ });
    expect(brand).toHaveAttribute('href', '/');
  });

  it('shows Get Started and no account menu when signed out', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
      'href',
      '/auth'
    );
    expect(
      screen.queryByRole('button', { name: 'Account menu' })
    ).not.toBeInTheDocument();
  });

  it('defaults to the light look (no dark class)', () => {
    render(<Header />);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Switch to dark theme' })
    ).toBeInTheDocument();
  });

  it('toggles the theme and persists the choice', () => {
    render(<Header />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to dark theme' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(window.localStorage.getItem('jb-theme')).toBe('dark');

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' })
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(window.localStorage.getItem('jb-theme')).toBe('light');
  });

  it('shows the account menu with the user initial once signed in', async () => {
    render(<Header />);
    await emitAuth({ user: { email: 'amin@example.com' } });

    const menuButton = screen.getByRole('button', { name: 'Account menu' });
    expect(menuButton).toHaveTextContent('A');
    expect(
      screen.queryByRole('link', { name: 'Get Started' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /JomBeelajar/ })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('only shows the Admin link to verified admins', async () => {
    render(<Header />);
    await emitAuth({ user: { email: 'amin@example.com' } });
    expect(
      screen.queryByRole('menuitem', { name: 'Admin', hidden: true })
    ).not.toBeInTheDocument();

    jest.mocked(verifyAdminAccess).mockResolvedValue({
      isAdmin: true,
    } as Awaited<ReturnType<typeof verifyAdminAccess>>);
    await emitAuth({ user: { email: 'amin@example.com' } });
    expect(
      screen.getByRole('menuitem', { name: 'Admin', hidden: true })
    ).toHaveAttribute('href', '/admin');
  });

  it('opens and closes the account menu', async () => {
    render(<Header />);
    await emitAuth({ user: { email: 'amin@example.com' } });

    const menuButton = screen.getByRole('button', { name: 'Account menu' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('signs out and hard-navigates home', async () => {
    jest.useFakeTimers();
    jest.mocked(signOut).mockResolvedValue(true);
    try {
      render(<Header />);
      await emitAuth({ user: { email: 'amin@example.com' } });

      fireEvent.click(
        screen.getByRole('menuitem', { name: 'Sign Out', hidden: true })
      );
      expect(signOut).toHaveBeenCalledTimes(1);
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(hardNavigate).toHaveBeenCalledWith('/');
    } finally {
      jest.useRealTimers();
    }
  });

  it('unsubscribes from auth changes on unmount', () => {
    const { unmount } = render(<Header />);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
