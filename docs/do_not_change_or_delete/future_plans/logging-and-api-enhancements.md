
# Action Plan: Logging and API Enhancements for PassForge

This document outlines actionable steps to enhance the PassForge application based on the "Bedrock headquarters" feedback regarding error logging and API handling. It's divided into immediate priorities for the current authentication system and future considerations for project growth.

## I. Immediate Priorities (Enhancing Current Auth System)

These tasks focus on improving the observability and debuggability of the existing authentication features in PassForge.

### [ ] Task 1: Implement Server-Side Structured Logging for Auth
*   **Goal:** Improve error diagnosis and tracking for authentication actions and services.
*   **Files to Modify:**
    *   `src/features/auth/actions/auth.actions.ts`
    *   `src/features/auth/services/auth.service.ts`
*   **Implementation Steps:**
    1.  **Choose & Configure a Logging Library:**
        *   **Option A (Recommended for robustness):** Winston.
            *   Create `src/lib/logger/winston.config.ts` for central configuration.
            *   Create `src/lib/logger/index.ts` to export `getServerLogger(moduleName: string)`.
        *   **Option B (Simpler):** `loglevel` or a simple DIY conditional logger.
    2.  **Integrate Logger:**
        *   In `auth.actions.ts`: Before returning error messages to the client, use `const logger = getServerLogger('AuthActions');` and log detailed error information (e.g., `logger.error({ message: 'Supabase sign-in failed', userId: email, error: supabaseErrorObject });`).
        *   In `auth.service.ts`: Similarly, log when Supabase calls result in errors, providing context like the operation attempted and the Supabase error.
*   **Benefit:** Captures detailed server-side error context for auth operations, aiding in debugging issues that aren't fully clear from client-side messages.

### [ ] Task 2: Integrate Sentry (or similar) for Error Monitoring
*   **Goal:** Automatically capture and report unhandled exceptions and significant errors from both server-side and client-side.
*   **Implementation Steps:**
    1.  **Account Setup:** Create an account with Sentry (or chosen alternative).
    2.  **Install SDKs:**
        *   `npm install @sentry/nextjs` (or `yarn add @sentry/nextjs`)
    3.  **Server-Side Integration:**
        *   Follow `@sentry/nextjs` documentation to initialize Sentry in your Next.js app (likely involving `sentry.server.config.js`, `sentry.client.config.js`, and updating `next.config.js`).
        *   Wrap API routes and potentially Server Actions with Sentry's error handlers if not automatically captured.
    4.  **Client-Side Integration:**
        *   Ensure `sentry.client.config.js` is set up. This will automatically capture unhandled client-side exceptions.
    5.  **Manual Error Reporting (Optional but Recommended):**
        *   In critical `try...catch` blocks (e.g., in `AuthSessionProvider`, `useAuth` hook, or auth form components), manually report significant errors to Sentry: `Sentry.captureException(error);` or `Sentry.captureMessage('Specific auth issue occurred');`.
*   **Benefit:** Provides proactive error detection and detailed reports for issues occurring in development, staging, and production.

### [ ] Task 3: Enhance Client-Side Logging for Critical Auth Points
*   **Goal:** Log specific events or errors on the client-side related to the auth lifecycle.
*   **Files to Modify:**
    *   `src/providers/auth-session-provider.tsx`
    *   `src/features/auth/hooks/use-auth.ts` (potentially)
*   **Implementation Steps:**
    1.  **Choose Client Logger Approach:**
        *   **Option A (Sentry):** Use `Sentry.captureMessage()` for important info or `Sentry.captureException()` for caught errors.
        *   **Option B (DIY Conditional Logger or `loglevel`):** As described in Task 1, but for client-side.
    2.  **Add Targeted Logging:**
        *   In `AuthSessionProvider`:
            *   Log when the Supabase auth listener subscription fails.
            *   Log if the `INITIAL_SESSION` event doesn't provide a user when expected.
        *   In `useAuth` (or components using it):
            *   Log if there's a mismatch or unexpected state when combining session and profile data.
*   **Benefit:** Provides insight into the client-side authentication state lifecycle and helps diagnose issues related to session initialization or user data composition.

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

### [ ] Task 6: Update All Project Documentation
*   **Goal:** Ensure all documentation files (`docs/project-overview.md`, `docs/integrating-state-and-data-fetching.md`, `docs/supabase-client-deep-dive.md`, etc.) are updated to reflect any changes made during the implementation of the logging and API handling enhancements.
*   **Implementation Steps:**
    1.  Review each document after completing the above tasks.
    2.  Update explanations, code examples, and architectural diagrams.
*   **Benefit:** Keeps the project documentation accurate and useful for current and future developers.

This checklist provides a structured approach to enhancing PassForge's logging and preparing it for future API development, aligning with the consultant's recommendations.

    