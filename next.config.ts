import {withSentryConfig} from '@sentry/nextjs';
import type {NextConfig} from 'next';

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
};

// Sentry webpack plugin options, configured by the Sentry wizard
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Required: Your Sentry organization slug
  org: process.env.SENTRY_ORG, // From wizard output

  // Required: Your Sentry project slug
  project: process.env.SENTRY_PROJECT, // From wizard output

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring", // From wizard output

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true, // Recommended to keep true

  // Enables automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true, // Default from wizard, keep if using Vercel Crons
};


// Make sure to wrap your `nextConfig` with `withSentryConfig` only once.
// The wizard might have wrapped it multiple times if run more than once.
export default withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions
  // Note: The third argument for module options (like hideSourceMaps) is part of the `sentryWebpackPluginOptions` object itself in recent @sentry/nextjs versions.
  // The wizard likely configured `hideSourceMaps` (implicitly true by default) and other module options within `withSentryConfig`'s internal handling.
  // The `sentryWebpackPluginOptions` object now covers most of what used to be separate module options.
);
