
# Action Plan: Logging and API Enhancements for PassForge

This document outlines actionable steps to enhance the PassForge application based on the "Bedrock headquarters" feedback regarding error logging and API handling. It's divided into immediate priorities for the current authentication system and future considerations for project growth.

**Note on Sentry Integration:** The Sentry integration (Task 2) was performed using the official Sentry Wizard (`npx @sentry/wizard@latest -i nextjs`). The steps and file descriptions below reflect this wizard-driven setup.

## I. Immediate Priorities (Enhancing Current Auth System)

These tasks focus on improving the observability and debuggability of the existing authentication features in PassForge.

### [x] Task 1: Implement Server-Side Structured Logging for Auth (Winston + Sentry)
*   **Goal:** Improve error diagnosis and tracking for authentication actions and services using Winston for structured logging, integrated with Sentry.
*   **Files to Modify/Review (Reflecting Wizard-Based Sentry Setup):**
    *   `src/features/auth/actions/auth.actions.ts` (Uses logger)
    *   `src/features/auth/services/auth.service.ts` (Uses logger)
    *   `src/lib/logger/winston.config.ts` (Winston setup, includes Sentry transport)
    *   `src/lib/logger/index.ts` (Logger factory)
    *   `sentry.server.config.ts` (Root Sentry server init, called by `instrumentation.ts`)
    *   `src/instrumentation.ts` (Ensures Sentry server init)
*   **Implementation Steps (Status: Completed):**
    1.  **Install Winston & Sentry Transport:**
        *   `@sentry/winston-transport` and `winston` are in `package.json`.
    2.  **Winston Configuration (`src/lib/logger/winston.config.ts`):**
        *   This file configures Winston with console and Sentry transports.
        *   The Sentry transport is added conditionally if `SENTRY_DSN` is set and the Sentry SDK is initialized. Sentry SDK initialization for the server is handled by `src/instrumentation.ts` importing `sentry.server.config.ts`.
        ```typescript
        // src/lib/logger/winston.config.ts (Conceptual Snippet)
        import winston from 'winston';
        import * as Sentry from '@sentry/node'; 
        // ... other imports and formats ...

        // Add Sentry transport if DSN is configured and Sentry SDK is initialized
        if (process.env.SENTRY_DSN && Sentry.SDK_VERSION) { // Check if Sentry is initialized
          try {
            const { SentryWinstonTransport } = require('@sentry/winston-transport');
            transports.push(
              new SentryWinstonTransport({ /* ... options ... */ })
            );
          } catch (e) { /* ... error handling ... */ }
        }
        // ... rest of Winston config ...
        ```
    3.  **Logger Factory (`src/lib/logger/index.ts`):**
        *   Provides `getServerLogger(moduleName)` which is used in services and actions.
    4.  **Sentry Server SDK Initialization:**
        *   This is now handled by `sentry.server.config.ts` (at the project root) which is loaded by `src/instrumentation.ts`. This ensures Sentry is initialized before Winston tries to use its transport.
    5.  **Use Logger in Auth Services & Actions:**
        *   Implemented. `getServerLogger` is used in `auth.service.ts` and `auth.actions.ts` for contextual logging. Errors are logged with details, being mindful of PII.
*   **Benefit:** Captures detailed server-side error context for auth operations, aiding in debugging. Integrates with Sentry for centralized error tracking of `warn` and `error` level logs from Winston.

### [x] Task 2: Integrate Sentry for General Error Monitoring (via Sentry Wizard)
*   **Goal:** Automatically capture and report unhandled exceptions and significant errors from both server-side and client-side to Sentry, using the official Sentry Wizard setup.
*   **Implementation Steps (Status: Completed via Sentry Wizard):**
    1.  **Sentry Account & Project Setup:**
        *   Completed (User has Sentry account and project).
    2.  **Install Sentry SDK:**
        *   `@sentry/nextjs` is in `package.json`.
    3.  **Initialize Sentry (via Sentry Wizard):**
        *   The command `npx @sentry/wizard@latest -i nextjs` was run.
        *   This wizard created/updated the following key files:
            *   `sentry.server.config.ts` (Root): Initializes Sentry for the Node.js runtime. Contains `Sentry.init({...})`.
            *   `sentry.edge.config.ts` (Root): Initializes Sentry for the Edge runtime. Contains `Sentry.init({...})`.
            *   `src/instrumentation.ts`: Next.js file that registers Sentry by conditionally importing `sentry.server.config.ts` or `sentry.edge.config.ts`.
            *   `src/instrumentation-client.ts`: Initializes Sentry for the client-side (browser). Contains `Sentry.init({...})`. This replaces the need for a separate `src/sentry.client.config.ts`.
            *   `next.config.ts`: Wrapped with `withSentryConfig`. Configured with `org`, `project` slugs, and `tunnelRoute: "/monitoring"`.
            *   `src/app/global-error.tsx`: Custom global error page for the App Router, configured to report errors to Sentry.
            *   `src/app/sentry-example-page/page.tsx`: An example page to test Sentry integration.
            *   `src/app/api/sentry-example-api/route.ts`: An example API route that throws an error for testing.
            *   `.env.sentry-build-plugin`: Contains `SENTRY_AUTH_TOKEN` for local source map testing. (Should be in `.gitignore`).
    4.  **Environment Variables:**
        *   The following environment variables must be set in `.env.local` and production environments:
            ```
            SENTRY_DSN="your_sentry_dsn_from_project_settings"
            NEXT_PUBLIC_SENTRY_DSN="your_sentry_dsn_from_project_settings" # Used by src/instrumentation-client.ts
            SENTRY_ORG="your-sentry-org-slug" # Or configured directly in next.config.ts
            SENTRY_PROJECT="your-sentry-project-slug" # Or configured directly in next.config.ts
            SENTRY_AUTH_TOKEN="your_sentry_auth_token" # For source map uploads
            ```
    5.  **Middleware Update for Testing:**
        *   `src/features/auth/utils/middleware.utils.ts` was updated to include `/sentry-example-page` and `/monitoring` in its `publicPaths` array to allow unauthenticated access for testing Sentry.
    6.  **Redundant File Removal:**
        *   The manually created `src/sentry.client.config.ts` became redundant after the wizard setup `src/instrumentation-client.ts` and was removed.
*   **Benefit:** Provides proactive error detection and detailed reports for issues occurring in development, staging, and production. Helps identify and diagnose problems quickly.

### [x] Task 3: Enhance Client-Side Logging for Critical Auth Points (Using Sentry)
*   **Goal:** Manually report specific events or caught errors on the client-side related to the auth lifecycle to Sentry for better context, beyond unhandled exceptions.
*   **Files Modified (Status: Completed):**
    *   `src/providers/auth-session-provider.tsx`
    *   `src/features/auth/hooks/use-auth.ts`
    *   Auth form components (`src/features/auth/components/*.tsx`)
*   **Implementation Details:**
    1.  **Sentry Client SDK Initialization:** Handled by `src/instrumentation-client.ts`.
    2.  **Import Sentry:** `import * as Sentry from '@sentry/nextjs';` used where needed.
    3.  **Targeted Logging:**
        *   In `AuthSessionProvider`: Captured `onAuthStateChange` subscription errors and `INITIAL_SESSION` events that include an error object.
        *   In `useAuth` Hook: Captures `sessionError` from `AuthSessionProvider` and `profileError` from `useUserProfileQuery` if they occur.
        *   In Auth Form Components: Added logic to capture unexpected server action failure messages (those not typical validation errors) using `Sentry.captureMessage`.
*   **Benefit:** Provides more context to Sentry for specific client-side issues that might not be unhandled exceptions but are still indicative of problems in the authentication flow.

## II. Future Implementation (As Project Grows & Adds APIs)

These tasks are based on patterns for building new API endpoints, which PassForge currently does not heavily rely on for its core auth (using Server Actions instead). These should be considered when PassForge expands with its own backend APIs.

### [ ] Task 4: Implement `createApiRouteHandler` HOF for New API Routes
*   **Goal:** Standardize request processing, authentication, validation, and error handling for new custom API routes.
*   **Location (if implemented):** `src/lib/utils/api.utils.ts` (for the HOF) and `src/app/api/...` (for routes using it).
*   **Implementation Steps (when building new APIs):**
    1.  Define the `createApiRouteHandler` HOF as per `docs/do_not_change_or_delete/future_plans/api handlers.md`.
    2.  When creating a new API route (e.g., `src/app/api/items/route.ts`), wrap its handler logic with this HOF.
    3.  Configure the HOF with Zod schemas for request body/query validation and `requireAuth: true` for protected routes.
*   **Benefit:** Ensures consistency, security, and maintainability for custom backend APIs.

### [ ] Task 5: Implement Frontend Authenticated Fetch Helpers
*   **Goal:** Provide standardized utility functions for client-side code to make authenticated calls to the backend APIs (developed using Task 4).
*   **Location (if implemented):** `src/lib/utils/api.utils.ts`.
*   **Implementation Steps (when client needs to call new APIs):**
    1.  Define helpers like `authenticatedGet`, `authenticatedPost` as per `docs/do_not_change_or_delete/future_plans/api handlers.md`.
    2.  Client-side components or hooks (e.g., TanStack Query `queryFn` or `mutationFn` calling a custom API) would use these helpers.
*   **Benefit:** Centralizes the logic for adding `Authorization: Bearer` tokens to API requests from the frontend.

## III. Review and Documentation Update

### [x] Task 6: Update All Project Documentation (Ongoing)
*   **Goal:** Ensure all documentation files (`docs/project-overview.md`, `docs/integrating-state-and-data-fetching.md`, `docs/supabase-client-deep-dive.md`, etc.) are updated to reflect any changes made during the implementation of the logging and API handling enhancements.
*   **Implementation Steps:**
    1.  This document (`logging-and-api-enhancements.md`) has been updated to reflect the Sentry Wizard setup.
    2.  Other documents should be reviewed and updated as necessary.
*   **Benefit:** Keeps the project documentation accurate and useful for current and future developers.

This checklist provides a structured approach to enhancing PassForge's logging and preparing it for future API development, aligning with the consultant's recommendations and the official Sentry Wizard integration.
    
