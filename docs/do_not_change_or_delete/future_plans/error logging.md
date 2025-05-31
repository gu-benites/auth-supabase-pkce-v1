
The Bedrock architecture incorporates a logging system designed for both server-side and client-side operations, with centralized configuration and integration with Sentry for comprehensive error monitoring and observability.

## Server-Side Logging:

*   **Tool**: Winston is used for structured logging on the server.
*   **Configuration**: Winston configuration resides in `src/lib/logger/winston.config.ts`. This file sets up log formats (JSON for production, human-readable for development) and transports.
*   **Sentry Integration for Winston**: The Winston configuration includes a `SentryWinstonTransport`. This transport automatically sends logs of level `warn` and `error` (along with their context and stack traces if available) from Winston directly to your Sentry project. This requires `SENTRY_DSN` to be set and the Sentry Node.js SDK to be initialized (which is handled by `src/instrumentation.ts` importing `sentry.server.config.ts`).
*   **Usage**:
    *   To obtain a logger instance on the server, use the factory function `getServerLogger(moduleName: string)` provided by `src/lib/logger/index.ts`. This allows for module-specific tagging of logs.
    *   `getServerLogger` instances are used within services (e.g., `src/features/auth/services/auth.service.ts`), Server Actions (e.g., `src/features/auth/actions/auth.actions.ts`), and API Route Handlers.
    *   Services should log key operations, parameters (masking PII), and particularly errors with context before throwing them or returning an error state.
*   **Error Handling Flow**:
    1.  Services use `getServerLogger().error('Descriptive message', { errorObject, additionalContext });`
    2.  The Server Action or API Route handler calling the service catches the error. It might log it again with higher-level request context if needed, or simply allow the error to propagate if it's an unhandled exception (which Sentry will also capture).
    3.  The `createApiRouteHandler` (if used for API routes) standardizes error responses. Server Actions typically return state objects indicating success/failure.
*   **Testing**: `getServerLogger` should be mocked during unit tests for services or actions to isolate the logic being tested from actual log output or Sentry transport.

## Client-Side Logging & Error Monitoring:

*   **Primary Tool: Sentry Client SDK (`@sentry/nextjs`)**:
    *   **Initialization**: Sentry's client-side SDK is initialized in `src/instrumentation-client.ts`. This file is automatically loaded by Next.js in the browser. It configures the `NEXT_PUBLIC_SENTRY_DSN`.
    *   **Automatic Error Capture**: Sentry automatically captures:
        *   Unhandled JavaScript exceptions.
        *   Unhandled promise rejections.
        *   Errors reported by `src/app/global-error.tsx` (for App Router global UI errors).
    *   **Manual Error Capture**: For more specific error reporting or capturing caught errors with additional context:
        *   Use `Sentry.captureException(error, { extra: { ...context } });` for caught JavaScript Error objects.
        *   Use `Sentry.captureMessage("Descriptive message about an issue", "warning" | "error" | "info", { extra: { ...context } });` for logging significant events or non-critical issues.
    *   **Usage Examples**:
        *   `src/providers/auth-session-provider.tsx`: Captures errors related to `onAuthStateChange` subscription or `INITIAL_SESSION` events that include an error.
        *   `src/features/auth/hooks/use-auth.ts`: Captures `sessionError` from `AuthSessionProvider` and `profileError` from `useUserProfileQuery`.
        *   Authentication Form Components (e.g., `src/features/auth/components/login-form.tsx`): Capture unexpected server action failure messages.
*   **Secondary Client-Side Logging (Optional Pattern - `/api/logs/client`)**:
    *   The original proposal mentioned a pattern where very specific, non-critical client-side logs could be sent to a dedicated Next.js API route (e.g., `/api/logs/client`). This route would then use the server-side Winston logger (`getServerLogger`) to record these client-originated logs.
    *   **Current Status**: This specific API endpoint and custom client logger are **not implemented** as part of the core Sentry/Winston setup. Direct Sentry client-side capture (`Sentry.captureException`, `Sentry.captureMessage`) is the primary mechanism for client-side error and significant event reporting to Sentry.
    *   If this pattern is desired for specific, high-volume, or non-error client logs that shouldn't go to Sentry directly, it can be implemented separately. The API endpoint would need security measures like rate limiting.

## Observability Platform: Sentry

*   Sentry serves as the central platform for collecting, viewing, and managing errors and (if enabled) performance data from both server-side (via Winston transport and direct SDK capture) and client-side (via `@sentry/nextjs`).
*   Configuration for Sentry (DSN, org, project slugs) is managed via environment variables and `next.config.ts`.
*   Source maps are uploaded during the build process (facilitated by `withSentryConfig` in `next.config.ts` and `SENTRY_AUTH_TOKEN`) to provide de-minified stack traces in Sentry.

In summary, PassForge's error logging strategy combines structured server-side logging with Winston (integrated with Sentry for warnings/errors) and comprehensive client-side error monitoring directly with Sentry's Next.js SDK. This provides robust observability into application health.
