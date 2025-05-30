
# Action Plan: Logging and API Enhancements for PassForge

This document outlines actionable steps to enhance the PassForge application based on the "Bedrock headquarters" feedback regarding error logging and API handling. It's divided into immediate priorities for the current authentication system and future considerations for project growth.

## I. Immediate Priorities (Enhancing Current Auth System)

These tasks focus on improving the observability and debuggability of the existing authentication features in PassForge.

### [ ] Task 1: Implement Server-Side Structured Logging for Auth (Winston + Sentry)
*   **Goal:** Improve error diagnosis and tracking for authentication actions and services using Winston for structured logging, integrated with Sentry.
*   **Files to Modify (Conceptual for Implementation):**
    *   `src/features/auth/actions/auth.actions.ts`
    *   `src/features/auth/services/auth.service.ts`
*   **Implementation Steps (Detailed):**
    1.  **Install Winston & Sentry Transport:**
        *   Run `npm install winston @sentry/winston-transport` (or `yarn add winston @sentry/winston-transport`).
    2.  **Create Winston Configuration (`src/lib/logger/winston.config.ts`):**
        ```typescript
        // src/lib/logger/winston.config.ts
        import winston from 'winston';
        import * as Sentry from '@sentry/node'; // Assuming Sentry Node SDK for server
        // If you haven't initialized Sentry yet, do it here or in sentry.server.config.ts
        // Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV });

        // Import Sentry transport after Sentry is initialized
        const { SentryWinstonTransport } = require('@sentry/winston-transport');


        const { combine, timestamp, json, simple, colorize, printf } = winston.format;

        const devFormat = printf(({ level, message, timestamp, module, ...metadata }) => {
          let msg = `${timestamp} [${module || 'App'}] ${level}: ${message} `;
          if (Object.keys(metadata).length) {
            msg += JSON.stringify(metadata, null, 2);
          }
          return msg;
        });

        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: process.env.NODE_ENV === 'production'
              ? combine(timestamp(), json())
              : combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), devFormat),
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
          }),
        ];

        // Add Sentry transport if DSN is configured (typically for staging/production)
        if (process.env.SENTRY_DSN) {
          transports.push(
            new SentryWinstonTransport({
              sentry: Sentry,
              level: 'warn', // Send warnings and errors to Sentry
            })
          );
        }

        const logger = winston.createLogger({
          format: combine(
            timestamp(),
            json() // Default to JSON for structured logging
          ),
          transports: transports,
          exitOnError: false, // Do not exit on handled exceptions
        });
        
        export default logger;
        ```
    3.  **Create Logger Factory (`src/lib/logger/index.ts`):**
        ```typescript
        // src/lib/logger/index.ts
        import mainLogger from './winston.config'; // Default logger instance
        import type { Logger as WinstonLogger } from 'winston';

        interface Logger extends WinstonLogger {
          setModuleName: (name: string) => Logger;
        }
        
        /**
         * Returns a logger instance, optionally tagged with a module name.
         * @param {string} [moduleName='Application'] - The name of the module this logger is for.
         * @returns {Logger} The Winston logger instance.
         */
        export function getServerLogger(moduleName: string = 'Application'): Logger {
          // Create a child logger to add module context
          const childLogger = mainLogger.child({ module: moduleName }) as Logger;
          // Add a helper method to change module name later if needed (optional)
          childLogger.setModuleName = (name: string) => getServerLogger(name);
          return childLogger;
        }
        ```
    4.  **Ensure Sentry Server SDK is Initialized:** (Covered in Task 2, but Winston config needs it)
        *   Make sure Sentry is initialized (e.g., in `sentry.server.config.ts`) before `winston.config.ts` tries to use `SentryWinstonTransport`.
    5.  **Use Logger in Auth Services (`src/features/auth/services/auth.service.ts`):**
        *   Import `getServerLogger` from ` '@/lib/logger' `.
        *   At the top of the file: `const logger = getServerLogger('AuthService');`
        *   In each service function, log critical operations, errors, and relevant (non-sensitive) data:
            ```typescript
            // Example in signUpWithSupabase
            logger.info(`Attempting Supabase sign-up for email: ${credentials.email}`);
            const result = await supabase.auth.signUp({ ...credentials, options });
            if (result.error) {
              logger.error({
                message: `Supabase sign-up failed for email: ${credentials.email}`,
                supabaseError: result.error, // Log the full Supabase error object
                options,
              });
            }
            return result;
            ```
        *   **Important**: Be very careful about logging Personally Identifiable Information (PII) like passwords. Only log error objects, status codes, or non-sensitive identifiers.
    6.  **Use Logger in Auth Actions (`src/features/auth/actions/auth.actions.ts`):**
        *   Import `getServerLogger` from ` '@/lib/logger' `.
        *   At the top of the file: `const logger = getServerLogger('AuthActions');`
        *   When handling form validation failures or errors from service calls:
            ```typescript
            // Example in signUpNewUser action
            if (!validationResult.success) {
              logger.warn({
                message: 'Sign-up validation failed.',
                email: formData.get("email") as string, // Log email if not sensitive in your context
                errors: validationResult.error.flatten().fieldErrors,
              });
              // ... return validation error state ...
            }
            // ...
            if (serviceError) {
              logger.error({
                message: `Service error during sign-up for user: ${email}`,
                serviceError, // Log the error received from the service
              });
              // ... return service error state ...
            }
            ```
*   **Benefit:** Captures detailed server-side error context for auth operations, aiding in debugging issues that aren't fully clear from client-side messages. Integrates with Sentry for centralized error tracking.

### [ ] Task 2: Integrate Sentry for General Error Monitoring
*   **Goal:** Automatically capture and report unhandled exceptions and significant errors from both server-side and client-side to Sentry.
*   **Implementation Steps (Detailed):**
    1.  **Sentry Account & Project Setup:**
        *   Create an account at [Sentry.io](https://sentry.io).
        *   Create a new Sentry project, selecting "Next.js" as the platform.
        *   Note your **DSN (Data Source Name)** from the project settings.
    2.  **Install Sentry SDK:**
        *   Run `npm install @sentry/nextjs` (or `yarn add @sentry/nextjs`).
    3.  **Initialize Sentry (Automatic Setup via CLI - Recommended):**
        *   Run `npx @sentry/wizard@latest -i nextjs`.
        *   Follow the wizard prompts. It will:
            *   Ask for your Sentry auth token (can be created in Sentry settings).
            *   Ask for your organization and project slugs.
            *   Automatically create/update necessary files: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` (if applicable), and update your `next.config.js` (or `.ts`) to wrap it with `withSentryConfig`.
            *   Create example files for testing Sentry.
    4.  **Manual Setup (If CLI wizard is not used or for reference):**
        *   **Environment Variables:** Add your Sentry DSN to `.env.local` (and your production environment variables):
            ```
            SENTRY_DSN=your_sentry_dsn_here
            NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here # if also using for client-side directly
            ```
        *   **`sentry.client.config.ts`:**
            ```typescript
            // src/sentry.client.config.ts
            import * as Sentry from "@sentry/nextjs";

            Sentry.init({
              dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
              tracesSampleRate: 1.0, // Adjust in production
              // Add other client-specific options
              replaysOnErrorSampleRate: 1.0,
              replaysSessionSampleRate: 0.1,
              integrations: [
                Sentry.replayIntegration(),
              ],
            });
            ```
        *   **`sentry.server.config.ts`:**
            ```typescript
            // src/sentry.server.config.ts
            import * as Sentry from "@sentry/nextjs";

            Sentry.init({
              dsn: process.env.SENTRY_DSN,
              tracesSampleRate: 1.0, // Adjust in production
              // Add other server-specific options
            });
            ```
        *   **`next.config.js` (or `.ts`):**
            ```javascript
            // next.config.js
            const { withSentryConfig } = require("@sentry/nextjs");

            /** @type {import('next').NextConfig} */
            const nextConfig = {
              // Your existing Next.js config
            };

            module.exports = withSentryConfig(
              nextConfig,
              {
                // For all available options, see:
                // https://github.com/getsentry/sentry-webpack-plugin#options
                silent: true, // Suppresses all logs
                org: "your-sentry-org-slug",
                project: "your-sentry-project-slug",
              },
              {
                // For all available options, see:
                // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
                // Hides source maps from generated client bundles
                hideSourceMaps: true,
                // Automatically tree-shake Sentry logger statements to reduce bundle size
                disableLogger: true,
                automaticVercelMonitors: true, // if deploying on Vercel
              }
            );
            ```
    5.  **Test Sentry Integration:**
        *   Temporarily add code to throw an error in a Server Action or a Client Component.
        *   Example for Server Action: `throw new Error("Test Sentry Server Error");`
        *   Example for Client Component `useEffect`: `useEffect(() => { throw new Error("Test Sentry Client Error"); }, []);`
        *   Trigger these errors and check your Sentry dashboard to see if they are reported.
*   **Benefit:** Provides proactive error detection and detailed reports for issues occurring in development, staging, and production. Helps identify and diagnose problems quickly.

### [ ] Task 3: Enhance Client-Side Logging for Critical Auth Points (Using Sentry)
*   **Goal:** Manually report specific events or caught errors on the client-side related to the auth lifecycle to Sentry for better context, beyond unhandled exceptions.
*   **Files to Modify (Conceptual for Implementation):**
    *   `src/providers/auth-session-provider.tsx`
    *   `src/features/auth/hooks/use-auth.ts`
    *   Auth form components (`src/features/auth/components/*.tsx`)
*   **Implementation Steps (Detailed):**
    1.  **Ensure Sentry Client SDK is Initialized:** This is covered by Task 2.
    2.  **Import Sentry in Client Components/Hooks:**
        *   `import * as Sentry from '@sentry/nextjs';`
    3.  **Targeted Logging in `AuthSessionProvider` (`src/providers/auth-session-provider.tsx`):**
        *   If the `supabaseClient.auth.onAuthStateChange` subscription itself returns an error:
            ```typescript
            if (subscriptionError && isMounted) {
              Sentry.captureMessage('Supabase onAuthStateChange subscription failed', {
                level: 'error',
                extra: { error: subscriptionError.message, name: subscriptionError.name },
              });
              // ... existing setError logic ...
            }
            ```
        *   If an `INITIAL_SESSION` event provides an unexpected error object with the session:
            ```typescript
            // Inside onAuthStateChange callback
            if (event === 'INITIAL_SESSION' && session?.user && session.error) {
              Sentry.captureMessage('INITIAL_SESSION event included an error', {
                level: 'warning',
                extra: { userId: session.user.id, error: session.error.message },
              });
            }
            ```
    4.  **Targeted Logging in `useAuth` Hook (`src/features/auth/hooks/use-auth.ts`):**
        *   If `sessionError` from `AuthSessionProvider` is significant (you might want to define what "significant" means, e.g., not just "User not found" if that's handled gracefully):
            ```typescript
            // Example: If sessionError is unexpected
            if (currentSessionError) {
              Sentry.captureException(currentSessionError, {
                tags: { hook: 'useAuth', type: 'session' },
              });
            }
            ```
        *   If `profileError` from `useUserProfileQuery` is significant:
            ```typescript
            // Example: If profileError occurs for an authenticated user
            if (currentProfileErrorObj && sessionUser) {
              Sentry.captureException(currentProfileErrorObj, {
                tags: { hook: 'useAuth', type: 'profile' },
                extra: { userId: sessionUser.id },
              });
            }
            ```
    5.  **Targeted Logging in Auth Form Components (e.g., `src/features/auth/components/login-form.tsx`):**
        *   When handling server action responses in `useEffect`:
            ```typescript
            useEffect(() => {
              if (state?.message) {
                if (state.success) {
                  // ... toast for success ...
                } else {
                  // Toast for general errors
                  toast({ title: "Login Failed", description: state.message, variant: "destructive" });
                  // If the error message suggests a systemic issue (e.g., "Database connection error")
                  // rather than just "Invalid credentials", you might log it to Sentry.
                  if (state.message && state.message.toLowerCase().includes('service unavailable')) { // Example condition
                    Sentry.captureMessage('Login action reported service unavailability', {
                      level: 'error',
                      extra: { action: 'signInWithPassword', formStateMessage: state.message }
                    });
                  }
                }
              }
            }, [state, toast]);
            ```
        *   **Caution**: Be selective. Don't send every validation error or common user error (like "Invalid password") to Sentry, as it can create noise. Focus on unexpected system-level failures or errors indicating a backend problem.
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

### [ ] Task 6: Update All Project Documentation
*   **Goal:** Ensure all documentation files (`docs/project-overview.md`, `docs/integrating-state-and-data-fetching.md`, `docs/supabase-client-deep-dive.md`, etc.) are updated to reflect any changes made during the implementation of the logging and API handling enhancements.
*   **Implementation Steps:**
    1.  Review each document after completing the above tasks.
    2.  Update explanations, code examples, and architectural diagrams.
*   **Benefit:** Keeps the project documentation accurate and useful for current and future developers.

This checklist provides a structured approach to enhancing PassForge's logging and preparing it for future API development, aligning with the consultant's recommendations.

    