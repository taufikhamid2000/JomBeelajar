/**
 * Safe logging utility that handles logging differently between development and production environments.
 * - In development: Shows all logs for debugging
 * - In production: Hides technical details but still provides essential information
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // In development, show detailed errors
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, log a generic message to the console
      // but don't expose sensitive details like DB errors
      const errorMessage = args[0] instanceof Error ? args[0].message : args[0];
      const sanitizedMessage =
        typeof errorMessage === 'string'
          ? errorMessage.replace(/\{.*\}/g, '[Details Hidden]')
          : 'An error occurred';

      console.error('Error:', sanitizedMessage);

      // Here you could also send the full error details to a server-side
      // logging service while showing minimal info to the user
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  perf: (label: string, duration: number) => {
    if (isDevelopment) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  },
  // Handle database errors or API errors more gracefully
  dbError: (operation: string, error: any) => {
    if (isDevelopment) {
      // In development, show the full error details
      console.error(`Database error during ${operation}:`, error);
    } else {
      // In production, log a generic message without sensitive details
      console.error(`Operation failed: ${operation}`);

      // You could add analytics or server logging here
      // sendToErrorMonitoring(operation, error);
    }

    // Return a user-friendly message that can be shown in the UI
    return "We couldn't complete this operation. Please try again later.";
  },

  // For UI components to show user-friendly messages
  userError: (friendlyMessage: string, technicalDetails?: any) => {
    if (isDevelopment && technicalDetails) {
      console.error(friendlyMessage, technicalDetails);
    } else {
      // In production, only log the friendly message
      console.error(friendlyMessage);
    }

    // Always return the user-friendly message for UI display
    return friendlyMessage;
  },
};

// Toggleable logger for debugging
export const log = (...args: unknown[]) => {
  if (process.env.NEXT_PUBLIC_LOG_LEVEL === 'debug') {
    console.log('[DBG]', ...args);
  }
};
