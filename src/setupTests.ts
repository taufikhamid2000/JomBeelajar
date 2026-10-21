// setupTests.ts
import '@testing-library/jest-dom';
// This file configures Jest test setup for TypeScript support

// Re-export all Jest globals that might be needed in test files
export {
  jest,
  describe,
  beforeEach,
  beforeAll,
  afterEach,
  afterAll,
  it,
  test,
  expect,
} from '@jest/globals';

// Extend the expect interface with the jest-dom matchers
declare global {
  // We need to use namespace to properly augment Jest types
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeChecked(): R;
      toHaveFocus(): R;
      toHaveBeenCalledWithMatch<T extends unknown[]>(...args: T): R;
    }
  }
}
