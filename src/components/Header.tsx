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

export default function Header(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  // Initialize auth state from auth state changes only (avoid initial getSession call)
  useEffect(() => {
    // DISABLED: Initial getSession call that was causing repeated requests
    // async function init() {
    //   const {
    //     data: { session },
    //   } = await supabase.auth.getSession();
    //   setUser(session?.user ?? null);
    //
    //   // Check admin status if user is logged in
    //   if (session?.user) {
    //     try {
    //       const { isAdmin: adminStatus } = await verifyAdminAccess();
    //       setIsAdmin(adminStatus);
    //     } catch (error) {
    //       logger.error('Error checking admin status:', error);
    //       setIsAdmin(false);
    //     }
    //   } else {
    //     setIsAdmin(false);
    //   }
    // }
    // init();

    // Listen for auth state changes only
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const openResearchPDF = () => {
    window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
  };

  return (
    <header className="sticky top-0 bg-[var(--color-bg)] bg-opacity-70 backdrop-blur-sm z-50">
      <div className="header-container">
        <Link href="/" className="header-link">
          <Image
            src="/favicon.ico"
            alt="JomBeelajar Logo"
            width={32}
            height={32}
            className="w-8 h-8 mr-2"
          />
          JomBeelajar
        </Link>{' '}
        <nav className="header-nav space-x-2 md:space-x-4">
          {user ? (
            <div className={`header-menu ${menuOpen ? 'open' : ''}`}>
              <button className="header-menu-button" onClick={toggleMenu}>
                Menu
              </button>{' '}
              <div className="header-menu-dropdown">
                {' '}
                <Link href="/dashboard" className="header-menu-link">
                  Dashboard
                </Link>
                <div className="py-1 border-b border-gray-700 dark:border-gray-200">
                  <Link href="/leaderboard" className="header-menu-link">
                    Student Rankings
                  </Link>
                  <Link
                    href="/leaderboard/schools"
                    className="header-menu-link"
                  >
                    School Rankings
                  </Link>
                </div>
                <div className="py-1 border-b border-gray-700 dark:border-gray-200">
                  <Link href="/career-guidance" className="header-menu-link">
                    Subject Guidance
                  </Link>
                  <Link href="/education-pathway" className="header-menu-link">
                    Education Pathway
                  </Link>
                </div>
                <Link href="/profile" className="header-menu-link">
                  Profile
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="header-menu-link">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  className="header-menu-link"
                  onClick={openResearchPDF}
                >
                  Research
                </button>{' '}
                <button
                  type="button"
                  className="header-menu-link"
                  onClick={async () => {
                    logger.log('Sign out button clicked');
                    try {
                      setUser(null); // Immediately update UI
                      setMenuOpen(false);

                      // Initialize signout process
                      signOut().catch((err) =>
                        logger.error('SignOut error:', err)
                      );

                      // Add a small delay to allow UI to update before redirect
                      setTimeout(() => {
                        logger.log('Redirecting after UI update...');
                        // Force a hard refresh/redirect to the home page
                        hardNavigate('/');
                      }, 150); // 150ms delay to allow React to render the UI change
                    } catch (error) {
                      logger.error('Error during sign out:', error);
                      hardNavigate('/auth');
                    }
                  }}
                >
                  {' '}
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/auth"
              className="btn text-sm md:text-base px-4 py-2 md:px-6 md:py-3"
            >
              Get Started
            </Link>
          )}{' '}
          <button
            type="button"
            className="header-theme-button text-sm md:text-base p-1 md:p-2"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <span role="img" aria-label="Light Mode" className="text-xl">
                🌞
              </span>
            ) : (
              <span role="img" aria-label="Dark Mode" className="text-xl">
                🌙
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
