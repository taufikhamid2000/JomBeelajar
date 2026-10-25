import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // Enables dark mode using a class
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        headerBg: 'var(--header-bg)',
        primaryText: 'var(--primary-text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: 'var(--secondary)',
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        ring: 'var(--ring)',
        brand: { DEFAULT: 'var(--brand)', soft: 'var(--brand-soft)' },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)' },
        streak: { DEFAULT: 'var(--streak)', soft: 'var(--streak-soft)' },
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        strong: 'var(--text-strong)',
        soft: 'var(--text-soft)',
      },
    },
  },
  plugins: [],
};

export default config;
