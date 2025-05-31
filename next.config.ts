import {withSentryConfig} from '@sentry/nextjs';
import type {NextConfig} from 'next';
// import { withSentryConfig } from "@sentry/nextjs"; // Temporarily commented out

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Optional: Set a dedicated buildId here if needed for Sentry release tracking
  // generateBuildId: async () => {
  //   // e.g., return 'my-build-id-' + new Date().getTime();
  //   return null; // Returning null uses Next.js default build ID
  // },
};


// const sentryWebpackPluginOptions = {
//   // Additional config options for the Sentry webpack plugin. Keep in mind that
//   // the following options are set automatically, and overriding them is not
//   // recommended:
//   //   release, url, authToken, configFile, stripPrefix,
//   //   urlPrefix, include, ignore

//   // Set this to `true` to automatically create a new Sentry release during the build.
//   // If you are using a manual Sentry release creation workflow, set this to `false`.
//   // createRelease: true, // Default is true, can be omitted

//   // Suppresses all logs from Sentry CLI
//   silent: true,

//   // Required: Your Sentry organization slug
//   // You can get this from your Sentry organization settings page.
//   // Example: "my-cool-org"
//   // It's recommended to set this via an environment variable: process.env.SENTRY_ORG
//   org: process.env.SENTRY_ORG || "YOUR_SENTRY_ORG_SLUG_HERE",

//   // Required: Your Sentry project slug
//   // You can get this from your Sentry project settings page.
//   // Example: "my-nextjs-app"
//   // It's recommended to set this via an environment variable: process.env.SENTRY_PROJECT
//   project: process.env.SENTRY_PROJECT || "YOUR_SENTRY_PROJECT_SLUG_HERE",

//   // An auth token is required for uploading source maps.
//   // You can generate this in Sentry: Organization Settings > Developer Settings > New Token (scopes: project:releases, org:read).
//   // Store it in SENTRY_AUTH_TOKEN in .env.local (ensure .env.local is in .gitignore).
//   // The Sentry Next.js SDK will automatically pick it up if this is not set.
//   // authToken: process.env.SENTRY_AUTH_TOKEN,

//   // Upload source maps to Sentry
//   // By default, source maps are only uploaded if NODE_ENV === 'production'.
//   // You can force this behavior by setting SENTRY_UPLOAD_SOURCEMAPS=true in your environment.
//   // uploadSourceMaps: process.env.SENTRY_UPLOAD_SOURCEMAPS === 'true',

//   // For all available options, see:
//   // https://github.com/getsentry/sentry-webpack-plugin#options
// };

// const sentryModuleOptions = {
//   // For all available options, see:
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

//   // Hides source maps from generated client bundles. (Recommended: true)
//   // This prevents direct browser access to your source maps but still allows Sentry to use them.
//   hideSourceMaps: true,

//   // Automatically tree-shake Sentry logger statements to reduce bundle size. (Recommended: true)
//   disableLogger: true,

//   // Enables automatic instrumentation of Vercel Cron Monitors.
//   // See the following for more information:
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/vercel-cron-monitors/
//   // https://vercel.com/docs/cron-jobs
//   automaticVercelMonitors: true, // Set to true if deploying on Vercel and using Cron Jobs
// };

// Make sure to source maps to Sentry when building your app.
// To do that, you can run the following command:
// npx @sentry/cli sourcemaps inject --org YOUR_SENTRY_ORG --project YOUR_SENTRY_PROJECT ./
// It is recommended to run this command after your build, before your deployment if not using automatic uploads.

// Temporarily export nextConfig directly without Sentry wrapper
export default withSentryConfig(withSentryConfig(nextConfig, {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "rotina-natural",
project: "javascript-nextjs",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
}), {
// For all available options, see:
// https://www.npmjs.com/package/@sentry/webpack-plugin#options

org: "rotina-natural",
project: "javascript-nextjs",

// Only print logs for uploading source maps in CI
silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
tunnelRoute: "/monitoring",

// Automatically tree-shake Sentry logger statements to reduce bundle size
disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
automaticVercelMonitors: true,
});

// To re-enable Sentry, uncomment the import and the following lines:
// export default withSentryConfig(
//   nextConfig,
//   sentryWebpackPluginOptions,
//   sentryModuleOptions
// );