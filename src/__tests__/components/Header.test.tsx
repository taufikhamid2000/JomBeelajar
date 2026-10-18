// src/__tests__/components/Header.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase';
import { jest, describe, it, expect, beforeEach } from '../../setupTests';

// Mock the auth functions
jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove('light', 'dark');
    localStorageMock.clear();

    // Mock the supabase auth getSession
    jest.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });
  it('renders the header with logo', () => {
    render(<Header />);
    expect(screen.getByAltText('JomBeelajar Logo')).toBeInTheDocument();
  });
  it('applies dark theme by default', async () => {
    render(<Header />);
    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
  });
  it('toggles theme when theme button is clicked', async () => {
    render(<Header />);

    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Find the theme toggle button
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });

    // Initially in dark mode
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();

    // Click to toggle to light mode
    await act(async () => {
      fireEvent.click(themeButton);
    });
    expect(document.documentElement.classList.contains('light')).toBeTruthy();
    expect(document.documentElement.classList.contains('dark')).toBeFalsy();

    // Click again to go back to dark mode
    await act(async () => {
      fireEvent.click(themeButton);
    });
    expect(document.documentElement.classList.contains('dark')).toBeTruthy();
    expect(document.documentElement.classList.contains('light')).toBeFalsy();
  });

  // Add more tests for user authentication state, menu interactions, etc.
});
