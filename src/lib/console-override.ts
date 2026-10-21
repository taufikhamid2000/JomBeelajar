/**
 * Console override utility to redirect all console logs to our logger
 * This is useful to catch any console logs that were missed during refactoring
 */

import { logger } from './logger';

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

// Export original console methods in case they're needed
export { originalConsole };

// Only override in production environment
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Override console methods to use our logger
  // Use originalConsole to prevent circular references
  console.log = (...args: any[]) => {
    // Use the original console to prevent infinite recursion
    if (process.env.NODE_ENV !== 'development') {
      // In production, logs are suppressed (logger will not call console.log)
      logger.log(...args);
    }
  };

  console.warn = (...args: any[]) => {
    // Use the original console to prevent infinite recursion
    if (process.env.NODE_ENV !== 'development') {
      logger.warn(...args);
    }
  };

  console.error = (...args: any[]) => {
    // Errors are always logged
    originalConsole.error(...args);
  };

  console.info = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'development') {
      logger.info(...args);
    }
  };
}

// Create a function to initialize this override
export function initConsoleOverride() {
  // This function doesn't need to do anything as the override happens on import
  // But it's useful to ensure the file is imported
}
