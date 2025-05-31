// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3369126b9ed988a89c4b09b39cb08591@o4509414416711680.ingest.us.sentry.io/4509414501187585",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
