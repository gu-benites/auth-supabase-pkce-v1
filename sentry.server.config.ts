// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development' ? false : false, // Default to false, enable for debugging Sentry

  // Performance Monitoring
  // Tracing was disabled via wizard, so set tracesSampleRate to 0
  tracesSampleRate: 0.0,
});
