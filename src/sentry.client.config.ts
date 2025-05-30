// src/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

/**
 * Initializes the Sentry SDK for client-side error monitoring and session replay.
 * Make sure to set NEXT_PUBLIC_SENTRY_DSN in your .env.local or environment variables.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Adjust tracesSampleRate in production to control performance monitoring data volume.
  // Value of 1.0 means 100% of transactions will be sampled.
  tracesSampleRate: 1.0,

  // Set to true to print useful information to the console during Sentry setup.
  // Recommended to keep false in production.
  debug: process.env.NODE_ENV === 'development' ? false : false, // Set to true if debugging Sentry itself

  // Session Replay
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, sample the full session when an error occurs.
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want this to be 100% while in development and sample at a lower rate in production.

  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration options can be set here, for example:
      maskAllText: true, // Masks all text content.
      blockAllMedia: true, // Blocks all media (images, videos, etc.).
    }),
  ],
});
