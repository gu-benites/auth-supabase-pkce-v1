// src/sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

/**
 * Initializes the Sentry SDK for server-side error monitoring.
 * Make sure to set SENTRY_DSN in your .env.local or environment variables.
 */
Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust tracesSampleRate in production to control performance monitoring data volume.
  // Value of 1.0 means 100% of transactions will be sampled.
  tracesSampleRate: 1.0,

  // Set to true to print useful information to the console during Sentry setup.
  // Recommended to keep false in production.
  debug: process.env.NODE_ENV === 'development' ? false : false, // Set to true if debugging Sentry itself
});
