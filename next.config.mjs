import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

let supabaseHost = null;
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (u) supabaseHost = new URL(u).hostname;
} catch {}

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false, // Temporarily disable to reduce doubles during log cleanup
  output: 'standalone',
  // Environment variables
  env: {
    DISABLE_SUPABASE_DEBUG: process.env.DISABLE_SUPABASE_DEBUG || 'true',
    // Jom ID (src/lib/supabase/cookie-options.ts) only shares the session
    // cookie on .taufikhamid.com when NEXT_PUBLIC_VERCEL_ENV === "production",
    // and the browser client needs it too, or it writes host-only cookies the
    // other Jom apps never see. Vercel only exposes NEXT_PUBLIC_VERCEL_ENV when
    // its system-env toggle is on, but always sets VERCEL_ENV at build time,
    // so inline it explicitly into the bundle from either source.
    NEXT_PUBLIC_VERCEL_ENV:
      process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? '',
  },
  experimental: {
    serverActions: {
      enabled: true,
    },
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'react-icons'],
  },
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
    // Enable React optimizations
    styledComponents: true,
  },
  // Skip pre-rendering admin and API routes
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
  // Exclude test files from build
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Type errors fail the build — keeps regressions out of production.
    ignoreBuildErrors: false,
  },
  // Configure image domains for remote images (avatars)
  images: {
    remotePatterns: [
      // Supabase Storage (user-avatars bucket); host derived from the project URL.
      ...(supabaseHost
        ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
        : []),
      // Fallback icon used by the admin subject editor on image load error.
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  // Baseline security headers. Only `frame-ancestors` is set as a CSP directive
  // on purpose: a full CSP (script-src/img-src/connect-src, etc.) needs to be
  // tested against the real app (Supabase, Vercel, inline styles) before
  // enabling, so it is deliberately not set yet. No page is meant to be
  // embedded in an iframe, so framing is denied everywhere.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
  // Add redirects from old Pages Router routes to new App Router routes
  async redirects() {
    return [
      // Old *.vercel.app address -> the custom domain.
      {
        source: "/:path*",
        has: [{ type: "host", value: "edubridge-sigma.vercel.app" }],
        destination: "https://jombeelajar.taufikhamid.com/:path*",
        permanent: false,
      },
      {
        source: '/pages/quiz/:subject/:topic',
        destination: '/quiz/:subject/:topic',
        permanent: true,
      },
      {
        source: '/pages/quiz/:subject/chapters',
        destination: '/quiz/:subject/chapters',
        permanent: true,
      },
    ];
  },
  webpack(config, { dev }) {
    // Hard-nuke the trace plugin when an env flag is set
    if (dev && process.env.NEXT_DISABLE_TRACE === 'true') {
      config.plugins = config.plugins.filter(
        (p) => p.constructor.name !== 'TraceNextServerPlugin'
      );
    }
    return config;
  },
};

export default withBundleAnalyzer(config);
