'use client';

import Link from 'next/link';

export default function Footer() {
  const openResearchPDF = () => {
    window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
  };

  return (
    <footer className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 py-6">
      <div className="container mx-auto text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} JomBeelajar. All rights reserved.
        </p>{' '}
        <nav className="mt-4 flex justify-center space-x-6">
          <Link
            href="/about"
            className="text-blue-400 dark:text-blue-600 hover:underline"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-blue-400 dark:text-blue-600 hover:underline"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-blue-400 dark:text-blue-600 hover:underline"
          >
            Terms
          </Link>
          <button
            onClick={openResearchPDF}
            className="text-blue-400 dark:text-blue-600 hover:underline cursor-pointer"
          >
            Research
          </button>
          <a
            href="https://jomid.taufikhamid.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 dark:text-blue-600 hover:underline"
          >
            Jom ID
          </a>
        </nav>
      </div>
    </footer>
  );
}
