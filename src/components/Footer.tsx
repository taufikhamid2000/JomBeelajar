'use client';

import Link from 'next/link';

const linkClass =
  'text-xs text-foreground/60 underline-offset-4 transition-colors hover:text-foreground hover:underline';

export default function Footer() {
  const openResearchPDF = () => {
    window.open('/docs/JomBeelajar%20Research.pdf', '_blank');
  };

  return (
    <footer className="border-t border-border bg-background px-6 py-4">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <span className="text-xs text-foreground/60">JomBeelajar</span>
        <nav className="flex items-center gap-3">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>
          <button onClick={openResearchPDF} className={`${linkClass} cursor-pointer`}>
            Research
          </button>
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
