import nextConfig from 'eslint-config-next';

const eslintConfig = [
  ...nextConfig,
  {
    // scripts/ holds one-off CLI/maintenance scripts, not app code — console
    // output there is the point, and they were never linted before eslint 16
    // started including them by default.
    ignores: ['**/__tests__/**/*', '**/coverage/**/*', 'scripts/**/*'],
  },
  {
    // Route all logging through the logger wrapper (dev/prod gating + error
    // sanitization). Raw console.* is disallowed in app code.
    rules: {
      'no-console': 'error',
    },
  },
  {
    // The logger wrapper and the console override are the one place console.*
    // is intentional.
    files: ['src/lib/logger.ts', 'src/lib/console-override.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default eslintConfig;
