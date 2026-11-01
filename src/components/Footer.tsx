'use client';

import Link from 'next/link';

const linkClass =
  'inline-flex min-h-[44px] items-center text-xs text-soft underline-offset-4 transition-colors hover:text-strong hover:underline';

export default function Footer() {
  const openResearchPDF = () => {
    window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
  };

  return (
    <footer className="border-t border-border px-6 py-4 pb-24 md:pb-4">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="text-xs text-soft">JomBeelajar</span>
        <nav className="flex flex-wrap items-center gap-x-4">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <button
            onClick={openResearchPDF}
            className={`${linkClass} cursor-pointer`}
          >
            Research
          </button>
          <Link href="/api-docs" className={linkClass}>
            API
          </Link>
          <a
            href="https://jomid.taufikhamid.com"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            Jom ID
          </a>
        </nav>
      </div>
    </footer>
  );
}
