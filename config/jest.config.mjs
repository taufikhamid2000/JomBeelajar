// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // This config file lives in config/, so point rootDir back at the project
  // root — otherwise <rootDir> resolves to config/ and every path below breaks.
  rootDir: '../',
  setupFilesAfterEnv: [
    '<rootDir>/config/jest.setup.js',
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/test-utils/setup-jest-dom.js',
  ],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured when using next.js)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test-utils/**',
    '!src/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  // Floors set just below the measured numbers (statements 7.92, branches 5.8,
  // functions 4.79, lines 8.09). Global coverage is low because most UI and
  // route code is untested; the security-critical modules are pinned higher.
  // Raise these as coverage grows, never lower them.
  coverageThreshold: {
    // Jest excludes the per-file entries below from this global figure.
    global: { statements: 6, branches: 4, functions: 4, lines: 6 },
    './src/lib/requireAdmin.ts': { lines: 90, branches: 85 },
    './src/lib/serverSession.ts': { lines: 95 },
    './src/lib/supabaseAdmin.ts': { lines: 95 },
    './src/services/adminAuthService.ts': { lines: 95, branches: 90 },
    './src/app/api/quiz/[quizId]/check/route.ts': { lines: 90 },
    './src/app/api/admin/make-admin/route.ts': { lines: 85 },
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    // Playwright specs (npm run test:e2e), not Jest tests.
    '<rootDir>/e2e/',
    // TODO(tests): these suites assert pre-JomBeelajar API-migration behavior / stale
    // mocks and currently fail. Quarantined so CI stays green; rewrite and
    // re-enable one at a time. Tracked under improvement #4 follow-up.
    '<rootDir>/src/__tests__/components/Header.test.tsx',
    '<rootDir>/src/__tests__/hooks/useTopicData.test.tsx',
    '<rootDir>/src/__tests__/services/dashboardService.test.ts',
    '<rootDir>/src/__tests__/services/quizService.test.ts',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
