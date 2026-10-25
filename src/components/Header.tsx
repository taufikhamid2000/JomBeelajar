'use client';
import { logger } from '@/lib/logger';

// src/components/Header.tsx
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { hardNavigate } from '@/lib/hard-navigate';
import { verifyAdminAccess } from '@/services/adminAuthService';
import { useTheme } from '@/hooks/useTheme';
import type { User } from '@supabase/supabase-js';
import { JSX } from 'react/jsx-dev-runtime';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiMoon, FiSun } from 'react-icons/fi';
import { PRIMARY_NAV, isActive } from './nav-items';

const menuItemClass =
  'flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-base text-strong hover:bg-muted';

const MENU_LINKS: Array<[string, string]> = [
  ['/dashboard', 'Dashboard'],
  ['/leaderboard', 'Student Rankings'],
  ['/leaderboard/schools', 'School Rankings'],
  ['/career-guidance', 'Subject Guidance'],
  ['/education-pathway', 'Education Pathway'],
  ['/profile', 'Profile'],
];

export default function Header(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  // Initialize auth state from auth state changes only (avoid initial getSession call)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // Check admin status when auth state changes
      if (session?.user) {
        try {
          const { isAdmin: adminStatus } = await verifyAdminAccess();
          setIsAdmin(adminStatus);
        } catch (error) {
          logger.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuElement = document.querySelector('.header-menu');
      if (menuElement && !menuElement.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const openResearchPDF = () => {
    window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
  };

  const handleSignOut = () => {
    logger.log('Sign out button clicked');
    try {
      setUser(null); // Immediately update UI
      setMenuOpen(false);
      signOut().catch((err) => logger.error('SignOut error:', err));
      // Small delay to allow UI to update before hard redirect
      setTimeout(() => {
        hardNavigate('/');
      }, 150);
    } catch (error) {
      logger.error('Error during sign out:', error);
      hardNavigate('/auth');
    }
  };

  const isLightLook = theme === 'light';
  const initial = (user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="header-container">
        <Link
          href={user ? '/dashboard' : '/'}
          className="flex min-h-[44px] items-center gap-2 text-xl font-extrabold text-strong md:text-2xl"
        >
          <Image
            src="/favicon.ico"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          JomBeelajar
        </Link>

        {user && (
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="jb-navlink"
                aria-current={isActive(pathname, href) ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user && (
            <div
              className="flex min-h-[44px] items-center gap-3 rounded-full bg-streak-soft px-3 text-sm font-bold text-strong"
              title="Streak and XP (coming soon)"
            >
              <span aria-label="Streak">
                <span aria-hidden="true">🔥</span> 0
              </span>
              <span aria-label="XP" className="text-brand">
                <span aria-hidden="true">⚡</span> 0 XP
              </span>
            </div>
          )}

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-strong hover:bg-muted"
            onClick={toggleTheme}
            aria-label={
              isLightLook ? 'Switch to dark theme' : 'Switch to light theme'
            }
          >
            {isLightLook ? (
              <FiMoon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <FiSun className="h-5 w-5" aria-hidden="true" />
            )}
          </button>

          {user ? (
            <div className={`header-menu ${menuOpen ? 'open' : ''}`}>
              <button
                type="button"
                onClick={toggleMenu}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-base font-bold text-primary-foreground"
              >
                {initial}
              </button>
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-2 shadow-card"
                hidden={!menuOpen}
              >
                {MENU_LINKS.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={menuItemClass}
                  >
                    {label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/admin"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className={menuItemClass}
                  >
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  role="menuitem"
                  className={menuItemClass}
                  onClick={openResearchPDF}
                >
                  Research
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={`${menuItemClass} font-semibold text-destructive`}
                  onClick={handleSignOut}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 text-base font-bold text-primary-foreground shadow-card hover:opacity-90"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
