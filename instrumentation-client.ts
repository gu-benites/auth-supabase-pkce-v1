// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Use the DSN from environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  // It's recommended to set this to false in production.
  debug: process.env.NODE_ENV === 'development' ? false : false, // Default to false, enable for debugging Sentry

  // Performance Monitoring
  // Tracing was disabled via wizard, so set tracesSampleRate to 0
  tracesSampleRate: 0.0,
  
  // Session Replay was disabled via wizard, so no replay configuration needed here.
});

// This export is used by src/instrumentation.ts to register Sentry with Next.js
// It is not necessary to import this file anywhere else manually.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
