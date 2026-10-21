import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
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
