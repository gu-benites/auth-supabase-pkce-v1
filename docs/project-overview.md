
# Project Overview: Next.js & Supabase Authentication Template (v2)

## Introduction

This document provides a comprehensive overview of the authentication flow implemented in this Next.js project, utilizing Supabase for backend services. It details the user journey for registration, login, password management, and sign-out, explains the critical concepts of `'use client'` and `'use server'` directives within the Next.js App Router, outlines the project structure, and offers guidance for adapting this template.

The goal is to offer a clear guide for understanding, maintaining, and extending this authentication foundation for various projects.

**Core Technologies:**
- Next.js 14+ (App Router)
- React 18+
- Supabase (Authentication & Database)
- ShadCN UI (Component Library)
- Tailwind CSS (Styling)
- Zod (Schema Validation)
- Lucide Icons (Icon Library)
- TypeScript
- TanStack Query (for server state management, e.g., user profile)
- React Context (for raw session state via `AuthSessionProvider`)

## I. Authentication Flow Details

This section describes the step-by-step process for each authentication-related user action.
Form submissions and auth operations are handled by **Server Actions** located in `src/features/auth/actions/auth.actions.ts`. These Server Actions then call **Service Functions** in `src/features/auth/services/auth.service.ts` which perform the direct interactions with Supabase.

### 1. User Registration (`/src/app/(auth)/register/page.tsx`)

- **User Interface (`src/features/auth/components/register-form.tsx` - Client Component):**
    - User provides: First Name, Last Name, Email, Password, and Confirm Password.
    - Client-side interactivity (e.g., password visibility toggle) is handled here.
    - The form uses the `useActionState` hook to manage the submission state and feedback from the Server Action.
- **Form Submission & Server Action (`src/features/auth/actions/auth.actions.ts`):**
    - The form submission triggers the `signUpNewUser` Server Action.
- **Server-Side Validation (within Server Action):**
    - Input data is validated using Zod schemas from `src/features/auth/schemas/`.
- **Service Call (`src/features/auth/services/auth.service.ts`):**
    - If validation passes, the Server Action calls the `signUpWithSupabase` service function.
- **Supabase Interaction (within Service):**
    - `supabase.auth.signUp()` is called.
    *   `firstName` and `lastName` are passed in the `options.data` object (as `first_name` and `last_name`), which Supabase stores in the `auth.users` table's `user_metadata` JSONB column.
    *   `options.emailRedirectTo` is dynamically configured to `[YOUR_SITE_URL]/auth/confirm?next=/login`. This URL is where the user will be sent after clicking the confirmation link in their email. The `next=/login` parameter tells the confirmation route where to redirect the user after successful verification.
- **User Feedback:**
    - Upon successful initiation of sign-up, the user sees a message prompting them to check their email for a confirmation link and a button to navigate to the login page.

### 2. Email Confirmation (`/src/app/(auth)/auth/confirm/route.ts`)

- **Trigger:** User clicks the confirmation link in the email they received. The link format is typically: `.../auth/confirm?token_hash=...&type=...&next=...[&email=...]`.
- **Processing (`src/app/(auth)/auth/confirm/route.ts` - GET Route Handler):**
    - This server-side route handler extracts `token_hash`, `type`, `next`, and any other query parameters (like `email`) from the URL.
    - It calls `supabase.auth.verifyOtp({ type, token_hash })` to exchange the token and confirm the user's email (or verify other OTP types).
- **Redirection:**
    - **Success:** If OTP verification is successful, the user is redirected to the URL specified in the `next` query parameter (e.g., `/login` for registration, `/reset-password` for password recovery). Any additional query parameters from the original confirmation link (except `token_hash` and `type`) are forwarded to the `next` URL.
    - **Failure:** If verification fails (e.g., token expired, invalid), the user is redirected to `/auth/auth-code-error`. **Note:** You must create this error page (e.g., `src/app/(auth)/auth-code-error/page.tsx`) to provide meaningful feedback to the user.

### 3. User Login (`/src/app/(auth)/login/page.tsx`)

- **User Interface (`src/features/auth/components/login-form.tsx` - Client Component):**
    - User provides Email and Password.
- **Form Submission & Server Action (`src/features/auth/actions/auth.actions.ts`):**
    - Triggers the `signInWithPassword` Server Action.
- **Server-Side Validation (within Server Action):**
    - Email and password validated using Zod schemas from `src/features/auth/schemas/`.
- **Service Call (`src/features/auth/services/auth.service.ts`):**
    - If validation passes, the Server Action calls the `signInWithPasswordWithSupabase` service function.
- **Supabase Interaction (within Service):**
    - `supabase.auth.signInWithPassword()` is called to authenticate the user.
- **Session Management & Redirection:**
    - **Success:** Supabase returns a session. The `src/middleware.ts` (delegating to `src/features/auth/utils/middleware.utils.ts`) plays a crucial role in managing and refreshing this session cookie. The user is then redirected to the homepage (`/`).
    - **Failure:** An error message is displayed to the user via toast notification.

### 4. Forgot Password (`/src/app/(auth)/forgot-password/page.tsx`)

- **User Interface (`src/features/auth/components/forgot-password-form.tsx` - Client Component):**
    - User enters their registered email address.
- **Form Submission & Server Action (`src/features/auth/actions/auth.actions.ts`):**
    - Triggers the `requestPasswordReset` Server Action.
- **Server-Side Validation (within Server Action):**
    - Email validated using Zod schema from `src/features/auth/schemas/`.
- **Service Call (`src/features/auth/services/auth.service.ts`):**
    - If validation passes, the Server Action calls the `resetPasswordForEmailWithSupabase` service function.
- **Supabase Interaction (within Service):**
    *   `supabase.auth.resetPasswordForEmail()` is called.
    *   `options.emailRedirectTo` is configured to `[YOUR_SITE_URL]/auth/confirm?next=/reset-password&email={USER_EMAIL}`. The `email` parameter is included to help password managers and pre-fill the email field on the reset password page.
- **User Feedback:**
    - A message indicates that if an account exists for that email, a password reset link has been sent.

### 5. Password Reset (`/src/app/(auth)/reset-password/page.tsx`)

- **Access:** User arrives here after clicking the password reset link in their email, which is processed by the `/auth/confirm` route handler. The URL will include the `email` as a query parameter.
- **User Interface (`src/features/auth/components/reset-password-form.tsx` - Client Component):**
    - The email field is pre-filled (from URL query parameter) and disabled.
    - User enters their New Password and confirms it.
    - An initial check is performed using the `useAuth` hook (`@/features/auth/hooks`). It specifically uses `isSessionLoading` and `user` (from session) to ensure a user session exists (meaning they've successfully come from the email link). If not, they are redirected to `/forgot-password`.
- **Form Submission & Server Action (`src/features/auth/actions/auth.actions.ts`):**
    - Triggers the `updateUserPassword` Server Action.
- **Server-Side Validation (within Server Action):**
    - New password and confirmation are validated using Zod schemas from `src/features/auth/schemas/`.
- **Service Call (`src/features/auth/services/auth.service.ts`):**
    - If validation passes, the Server Action calls the `updateUserWithSupabase` service function.
- **Supabase Interaction (within Service):**
    - `supabase.auth.updateUser({ password })` is called. This action updates the password for the currently authenticated user (whose session was established by the OTP verification).
- **User Feedback:**
    - On success, a confirmation message is shown, and the user is presented with a button to navigate to the login page.

### 6. User Sign Out (Example: Homepage Header)

- **User Interface (e.g., `src/features/homepage/components/hero-header/hero-header.tsx` - Client Component):**
    - A "Sign Out" button is present.
    - This button is visible to authenticated users, determined by the `useAuth` hook (specifically, checking `!isSessionLoading && !!user`).
- **Form Submission & Server Action (`src/features/auth/actions/auth.actions.ts`):**
    - Clicking the "Sign Out" button (which is inside a `<form>`) triggers the `signOutUserAction` Server Action.
- **Service Call (`src/features/auth/services/auth.service.ts`):**
    - The Server Action calls the `signOutWithSupabase` service function.
- **Supabase Interaction (within Service):**
    - `supabase.auth.signOut()` is called to invalidate the user's session.
- **Redirection:**
    - Upon successful sign-out, the `signOutUserAction` redirects the user to the `/login` page.

## II. Client-Side Authentication State (`useAuth` Hook)

Client components access authentication status, the raw Supabase user object, and detailed user profile information primarily through the **`useAuth` hook** (`src/features/auth/hooks/use-auth.ts`).

This hook is the central point for UI components to understand the user's authentication status. It combines:
1.  **Raw Session Data (from React Context):** The `AuthSessionProvider` (`@/providers/auth-session-provider.tsx`) uses React Context to provide the live Supabase `User` object and the session's initial loading status (`isSessionLoading`) and any session-related errors (`sessionError`). It relies on the `onAuthStateChange` listener for reactive updates.
2.  **Detailed User Profile (from TanStack Query):** The `useUserProfileQuery` hook (`@/features/user-profile/hooks/use-user-profile-query.ts`) uses TanStack Query to fetch detailed user profile information from the `profiles` table via a Server Action.

The `useAuth` hook returns a comprehensive state object, including:
*   `user`: The raw Supabase user object (or `null`).
*   `profile`: The detailed `UserProfile` object (or `undefined` if not loaded/found).
*   `authUser`: A combined object of `user` and `profile` data, available when the stricter `isAuthenticated` is true.
*   `isAuthenticated`: A **stricter** boolean flag that is true only if a Supabase session exists (`!!user` is true, `isSessionLoading` is false) AND the detailed user profile has been successfully loaded (`!!profile` is true, `isProfileLoading` is false).
*   `isLoadingAuth`: A composite boolean, true if `isSessionLoading` is true, OR if a session user exists (`!!user`) but the profile is still loading (`isProfileLoading`).
*   `isSessionLoading`: A boolean indicating if the raw Supabase session is still being determined by `AuthSessionProvider`. Components use this for initial UI loading states (e.g., showing a spinner before login/logout buttons appear).
*   `sessionError`: Any error from `AuthSessionProvider`.
*   `isProfileLoading`: A boolean indicating if the detailed user profile is being fetched.
*   `profileError`: Any error from `useUserProfileQuery`.

For more details on this setup, refer to `docs/integrating-state-and-data-fetching.md`.

## III. 'use client' vs. 'use server' Explained

The Next.js App Router introduces a paradigm where components are **Server Components by default**. Directives like `'use client'` and `'use server'` are used to specify component rendering environments and define server-side functions (Server Actions).

### Default: Server Components
- **What they are:** Components rendered on the server. The resulting HTML is sent to the client, reducing client-side JavaScript.
- **Location:** Any component file within the `app` directory that does not have a `'use client'` directive at the top.
- **Characteristics:**
    - Can directly `async/await` data fetches.
    - Cannot use React Hooks that rely on browser environment (e.g., `useState`, `useEffect`, `useContext`) or browser-only APIs (e.g., `window`, `localStorage`).
- **In this project:**
    - Root layout (`src/app/layout.tsx`).
    - The auth layout `src/app/(auth)/layout.tsx`.
    - Basic page shells in `src/app/(auth)/...` or `src/app/` that primarily render Client Components.

### `'use client'` Directive
- **Purpose:** Marks a component and its imported child modules as **Client Components**.
- **Location:** Placed at the very top of a `.tsx` or `.js` file.
- **Characteristics:**
    - Rendered on the server for the initial HTML, then "hydrated" on the client to become interactive.
    - **Can use React Hooks** (`useState`, `useEffect`, `useActionState`, `useRouter`, `useContext`, custom hooks like `useAuth`).
    - **Can use browser APIs** and handle user events.
- **In this project:**
    - All form components in `src/features/auth/components/`.
    - The `HomepageHeader` and related components in `src/features/homepage/components/hero-header/`.
    - Provider components like `src/providers/auth-session-provider.tsx`, `src/providers/theme-provider.tsx`, and `src/providers/query-client-provider.tsx`.
    - The `useAuth` hook in `src/features/auth/hooks/use-auth.ts`.

### `'use server'` Directive
- **Purpose:** Marks functions exported from a file as **Server Actions** or indicates that a file exports Server Actions. These functions are guaranteed to execute only on the server.
- **Location:** Placed at the very top of a `.ts` or `.js` file that exports Server Actions.
- **Characteristics:**
    - Can be called from Client Components (typically via form `action` prop or by directly invoking the imported function).
    - Can securely access server-side resources: databases (Supabase), internal APIs, environment variables.
    - Ideal for data mutations, form handling, and any operation requiring secure server-side execution.
- **In this project:**
    - `src/features/auth/actions/auth.actions.ts`: Contains all authentication-related Server Actions.
    - `src/features/auth/services/auth.service.ts`: Contains functions that directly interact with Supabase. Marked with `'use server';` as it's part of the server-side execution boundary and called by Server Actions.
    - `src/features/user-profile/queries/profile.queries.ts`: Contains Server Actions for fetching profile data.
    - `src/features/user-profile/services/profile.service.ts`: Marked with `'use server';`.
    - **Important Note:** Files containing Zod schemas (`src/features/auth/schemas/*.ts`, `src/features/user-profile/schemas/*.ts`) **do not** use `'use server';` as they export objects/data structures, not async functions intended as server actions.

### Route Handlers (`route.ts`)
- **Purpose:** Define API endpoints or server-side logic for specific URL paths (e.g., handling GET, POST requests).
- **Location:** Files named `route.ts` (or `.js`) within the `app` directory structure (e.g., `src/app/(auth)/auth/confirm/route.ts`).
- **Characteristics:**
    - These are inherently server-side. They do not use the `'use client'` or `'use server'` directives in the same way components or action files do.
    - Can directly access server-only Node.js APIs and Next.js server utilities (e.g., `cookies()` from `next/headers`, `redirect()` from `next/navigation`).
- **In this project:**
    - `src/app/(auth)/auth/confirm/route.ts`: Handles the GET request for email confirmation links.

### Role of Middleware (`src/middleware.ts`)
- The `src/middleware.ts` file, delegating to `src/features/auth/utils/middleware.utils.ts`, is crucial for Supabase session management and route protection. It runs on the server before a request is processed.
- It initializes the Supabase server client with cookies from the request.
- Calls `supabase.auth.getUser()` to refresh the user's session token and get the current user.
- Implements route protection by redirecting unauthenticated users from non-public paths to `/login`.
- This ensures that Server Components, Route Handlers, and Server Actions have access to an up-to-date user session.

## IV. Project Structure Highlights

The project follows a feature-based organization within the `src` directory.

- **`/src/app/`**:
    - Global files (`layout.tsx`, `page.tsx` for homepage).
    - **`(auth)/`**: Route group for authentication pages and related server logic.
        - `layout.tsx`: Shared two-column layout for auth pages.
        - `auth/confirm/route.ts`: Server-side handler for OTP verification.
        - `forgot-password/page.tsx`
        - `login/page.tsx`
        - `register/page.tsx`
        - `reset-password/page.tsx`
    - Page files are lean, importing main components from `src/features/.../components/`.
- **`/src/features/`**:
    - **`auth/`**:
        - `components/`: Client Components for authentication forms.
        - `actions/`: Server Actions for auth data modification and flow control.
            - `auth.actions.ts`
        - `services/`: Contains direct Supabase interaction logic.
            - `auth.service.ts`
        - `queries/`: Server Actions for auth-related data fetching (currently placeholder).
        - `schemas/`: Zod validation schemas.
        - `hooks/`: Custom React hooks specific to authentication.
            - `use-auth.ts`
        - `utils/`: Utility functions specific to auth features.
            - `middleware.utils.ts`
    - **`user-profile/`**: Feature for user profile data.
        - `hooks/`: Custom hooks like `use-user-profile-query.ts`.
        - `queries/`: Server Actions for fetching profile data (`profile.queries.ts`).
        - `schemas/`: Zod schemas for profile data (`profile.schema.ts`).
        - `services/`: Services for profile data interaction (`profile.service.ts`).
    - **`homepage/`**: Components related to the main homepage.
        - `components/` (contains `hero-header/`, `hero-content/`, etc.)
- **`/src/components/`**:
    *   `ui/`: Reusable ShadCN UI components.
    *   `icons/`: Custom SVG icon components.
- **`/src/providers/`**: Global React context providers.
    *   `auth-session-provider.tsx`
    *   `theme-provider.tsx`
    *   `query-client-provider.tsx`
- **`/src/lib/`**:
    *   `supabase/`: Supabase client initialization (`client.ts` for browser, `server.ts` for server-side).
    *   `utils.ts`: General utility functions.
- **`/src/hooks/`**:
    *   General-purpose custom React Hooks (e.g., `useToast`, `useIsMobile`).
- **`/src/stores/`**:
    *   `auth.store.ts`: Zustand store, now for minimal, non-auth related global client-side state.
- **`/src/styles/`**:
    *   `globals.css`: Global styles and Tailwind CSS theme.
- **`/src/middleware.ts`**:
    *   Next.js middleware entry point.

## V. Separation of Concerns: Auth vs. User Profile

A key architectural decision in this project is the separation of `src/features/auth` and `src/features/user-profile`. This is not duplication but a deliberate separation for clarity and scalability:

*   **`src/features/auth/`** handles the *mechanisms* of authentication:
    *   Processes like sign-up, sign-in, sign-out, password reset.
    *   Manages session state via `AuthSessionProvider` (React Context for raw Supabase session).
    *   Provides the primary `useAuth` hook which *aggregates* session state and profile state for easy UI consumption.
    *   Contains Server Actions, services, and Zod schemas directly related to these authentication *processes*.

*   **`src/features/user-profile/`** manages application-specific *user data*:
    *   This concerns data typically stored in a separate `profiles` table (e.g., custom avatar, role, subscription details, language preferences).
    *   Includes `useUserProfileQuery` (TanStack Query) for fetching this detailed profile data.
    *   Contains the Server Action, service, and Zod schema specific to the `profiles` table data structure and its retrieval.

**Why this separation?**

1.  **Modularity**: If your user profile management becomes complex (e.g., profile editing forms, different visibility settings, profile-specific API endpoints), this logic is neatly contained and won't bloat the core authentication feature.
2.  **Clarity**: It's clear where to find logic related to the `profiles` database table versus logic related to Supabase's `auth.users` table and authentication flows.
3.  **Reusability**: Other features (e.g., an admin panel needing to display user profiles) could interact with services/queries from `src/features/user-profile/` without needing to depend on the core authentication mechanisms if only profile data is required.
4.  **`useAuth` as an Aggregator**: The `useAuth` hook acts as a facade, providing a unified interface for components to get both the basic Supabase user (from session) and the detailed application profile, abstracting away where each piece of data originates.

This structure ensures that the core identity management (auth) is distinct from the management of application-specific user data attributes (user-profile), leading to a more maintainable and scalable codebase.

## VI. Adapting for Other Projects (Checklist)

1.  **Supabase Configuration:**
    - [ ] Ensure your new project has `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2.  **Styling & UI:**
    - [ ] Customize `src/styles/globals.css` (ShadCN theme) or replace UI components.
    - [ ] Update `PassForgeLogo` or branding elements.
3.  **Redirection URLs:**
    - [ ] Review and update `emailRedirectTo` URLs in `src/features/auth/actions/auth.actions.ts`.
    - [ ] Adjust the `next` query parameter logic in `src/app/(auth)/auth/confirm/route.ts` if post-confirmation redirect paths differ.
    - [ ] Update navigation links (e.g., post-login redirect in `signInWithPassword` Server Action, post-signout redirect in `signOutUserAction`).
    - [ ] Review public paths in `src/features/auth/utils/middleware.utils.ts` for route protection.
4.  **Error Handling Pages:**
    - [ ] **Create a user-friendly page component for `/auth/auth-code-error`** (e.g., `src/app/(auth)/auth-code-error/page.tsx`). If this page is within the `(auth)` group, it will inherit the auth layout.
5.  **User Metadata & Profiles Table:**
    - [ ] If collecting different data at registration, update schemas in `src/features/auth/schemas/register.schema.ts` and the `signUpNewUser` action.
    - [ ] Ensure your `profiles` table in Supabase matches the schema in `src/features/user-profile/schemas/profile.schema.ts` and RLS policies are correctly set up.
    - [ ] Adapt `src/features/user-profile/services/profile.service.ts` if your table structure or data merging logic differs.
6.  **Database Schema (RLS):**
    - [ ] Configure Row Level Security (RLS) policies in your Supabase database for all user-specific data tables.
7.  **Review Site URL:**
    - [ ] Ensure that the `origin` header (used in server actions for `emailRedirectTo`) or a reliable environment variable correctly reflects your deployed site's URL.

## Conclusion

This template provides a robust and well-structured foundation for implementing user authentication in a modern Next.js application using Supabase, React Context, and TanStack Query, with Zustand available for other global client state. By understanding the flow, the roles of `'use client'` and `'use server'`, the service-action pattern, and the project's organization, developers can confidently build upon and adapt this foundation.
The accompanying `docs/integrating-state-and-data-fetching.md` guide provides further details on the state management strategy.

    