
# Project Overview: Next.js & Supabase Authentication Template

## Introduction

This document provides an overview of the authentication flow implemented in this Next.js project, utilizing Supabase for backend services. It details the user journey for registration, login, and password management, explains the critical concepts of `'use client'` and `'use server'` directives within the Next.js App Router, and outlines the project structure.

The goal is to offer a clear guide for understanding, maintaining, and adapting this authentication template for other projects.

**Core Technologies:**
- Next.js 14+ (App Router)
- React 18+
- Supabase (Authentication & Database)
- ShadCN UI (Component Library)
- Tailwind CSS (Styling)
- Zod (Schema Validation)
- TypeScript

## I. Authentication Flow Details

This section describes the step-by-step process for each authentication-related user action.

### 1. User Registration (`/register`)

- **User Interface (`src/features/auth/components/register-form.tsx` - Client Component):**
    - User provides: First Name, Last Name, Email, Password, and Confirm Password.
    - Basic client-side interactivity (e.g., password visibility toggle) is handled here.
- **Form Submission & Server Action:**
    - The form submission triggers the `signUpNewUser` Server Action defined in `src/features/auth/mutations/auth.mutations.ts`.
- **Server-Side Validation (`src/features/auth/mutations/auth.mutations.ts`):**
    - Input data (first name, last name, email, password, confirm password) is validated using Zod schemas from `src/features/auth/schemas/register.schema.ts` and `src/features/auth/schemas/auth.common.schemas.ts`.
- **Supabase Interaction:**
    - If validation passes, `supabase.auth.signUp()` is called.
    - `firstName` and `lastName` are passed in the `options.data` object, which Supabase stores as `user_metadata` (e.g., `{ "first_name": "John", "last_name": "Doe" }`).
    - `options.emailRedirectTo` is configured to point to `[YOUR_SITE_URL]/auth/confirm?next=/login`. This URL is where the user will be sent after clicking the confirmation link in their email. The `next=/login` parameter tells the confirmation route where to redirect the user after successful verification.
- **User Feedback:**
    - Upon successful initiation of sign-up, the user sees a message prompting them to check their email for a confirmation link.

### 2. Email Confirmation (`/auth/confirm` - Server Route Handler)

- **Trigger:** User clicks the confirmation link in the email they received. The link looks like: `.../auth/confirm?token_hash=...&type=recovery&email=...&next=/login`.
- **Processing (`src/app/(auth)/auth/confirm/route.ts` - GET Handler):**
    - This server-side route handler extracts `token_hash`, `type`, `email`, and `next` from the URL's query parameters.
    - It calls `supabase.auth.verifyOtp({ type, token_hash })` to exchange the token and confirm the user's email.
- **Redirection:**
    - **Success:** If OTP verification is successful, the user is redirected to the URL specified in the `next` query parameter (e.g., `/login`).
    - **Failure:** If verification fails (e.g., token expired, invalid), the user is redirected to an error page (e.g., `/auth/auth-code-error` - this page needs to be created by the developer).

### 3. User Login (`/login`)

- **User Interface (`src/features/auth/components/login-form.tsx` - Client Component):**
    - User provides Email and Password.
- **Form Submission & Server Action:**
    - Triggers the `signInWithPassword` Server Action from `src/features/auth/mutations/auth.mutations.ts`.
- **Server-Side Validation:**
    - Email and password validated using Zod schemas from `src/features/auth/schemas/login.schema.ts`.
- **Supabase Interaction:**
    - `supabase.auth.signInWithPassword()` is called to authenticate the user.
- **Session Management & Redirection:**
    - **Success:** Supabase returns a session. The `middleware.ts` file plays a crucial role in managing and refreshing this session cookie, making it available to subsequent server-side requests. The user is then typically redirected to the homepage (`/`) or a protected dashboard.
    - **Failure:** An error message is displayed to the user.

### 4. Forgot Password (`/forgot-password`)

- **User Interface (`src/features/auth/components/forgot-password-form.tsx` - Client Component):**
    - User enters their registered email address.
- **Form Submission & Server Action:**
    - Triggers the `requestPasswordReset` Server Action from `src/features/auth/mutations/auth.mutations.ts`.
- **Server-Side Validation:**
    - Email validated using Zod schema from `src/features/auth/schemas/forgot-password.schema.ts`.
- **Supabase Interaction:**
    - `supabase.auth.resetPasswordForEmail()` is called.
    - `options.emailRedirectTo` is configured to point to `[YOUR_SITE_URL]/auth/confirm?next=/reset-password&email={USER_EMAIL}`. The `email` parameter is included to help password managers on the reset password page.
- **User Feedback:**
    - A message indicates that if an account exists, a password reset link has been sent.

### 5. Password Reset (`/reset-password`)

- **Access:** User arrives here after clicking the password reset link in their email and being processed by the `/auth/confirm` route. The URL will contain the `email` as a query parameter.
- **User Interface (`src/features/auth/components/reset-password-form.tsx` - Client Component):**
    - The email field is pre-filled (from URL query parameter) and disabled, providing context for password managers.
    - User enters their New Password and confirms it.
- **Form Submission & Server Action:**
    - Triggers the `updateUserPassword` Server Action from `src/features/auth/mutations/auth.mutations.ts`.
- **Server-Side Validation:**
    - New password and confirmation are validated (must match, meet strength criteria) using Zod schemas from `src/features/auth/schemas/update-password.schema.ts`.
- **Supabase Interaction:**
    - `supabase.auth.updateUser({ password })` is called. This action updates the password for the user whose session was implicitly established when they successfully verified their OTP via the `/auth/confirm` route.
- **User Feedback:**
    - On success, a confirmation message is shown, and the user is prompted to log in with their new password.

## II. 'use client' vs. 'use server' Explained

The Next.js App Router introduces a paradigm where components are **Server Components by default**. Directives like `'use client'` and `'use server'` are used to specify component rendering environments and define server-side functions (Server Actions).

### Default: Server Components
- **What they are:** Components rendered on the server. The resulting HTML is sent to the client, reducing client-side JavaScript.
- **Location:** Any component file within the `app` directory that does not have a `'use client'` directive at the top (e.g., `src/app/page.tsx`, `src/app/layout.tsx`).
- **Characteristics:**
    - Can directly `async/await` data fetches.
    - Cannot use React Hooks that rely on browser environment (e.g., `useState`, `useEffect`, `useContext`) or browser-only APIs (e.g., `window`, `localStorage`).
    - Excellent for static content or content fetched and rendered on the server.
- **In this project:** Layouts (`src/app/layout.tsx`) and simple page shells (`src/app/(auth)/login/page.tsx` which just renders a Client Component) are Server Components.

### `'use client'` Directive
- **Purpose:** Marks a component and its imported child modules as **Client Components**.
- **Location:** Placed at the very top of a `.tsx` or `.js` file.
- **Characteristics:**
    - Rendered on the server for the initial HTML, then "hydrated" on the client to become interactive.
    - **Can use React Hooks** (`useState`, `useEffect`, `useActionState`, etc.).
    - **Can use browser APIs** and handle user events.
- **In this project:**
    - All form components in `src/features/auth/components/` (e.g., `login-form.tsx`, `register-form.tsx`) use `'use client'` because they require:
        - `useState` for local UI state (like password visibility toggles).
        - `useActionState` to manage the state of form submissions with Server Actions.
        - `useEffect` (e.g., for displaying toast notifications based on action state).
    - Components interacting with third-party libraries that need the browser environment (e.g., `src/components/providers/posthog-provider.tsx`).

### `'use server'` Directive
- **Purpose:** Marks functions exported from a file as **Server Actions**. These functions are guaranteed to execute only on the server.
- **Location:** Placed at the very top of a `.ts` or `.js` file, or directly above an exported async function within a component file (though separating them into dedicated files is cleaner).
- **Characteristics:**
    - Can be called from Client Components (typically via form `action` prop or by directly invoking the imported function).
    - Can securely access server-side resources: databases (like Supabase), internal APIs, environment variables.
    - Cannot use browser APIs or directly manipulate the DOM.
    - Ideal for data mutations, form handling, and any operation requiring secure server-side execution.
- **In this project:**
    - `src/features/auth/mutations/auth.mutations.ts`: Contains all authentication-related Server Actions (`signUpNewUser`, `signInWithPassword`, `requestPasswordReset`, `updateUserPassword`). Each ofthese functions handles form data, interacts with Supabase, and returns a state object.
    - `src/features/auth/queries/auth.queries.ts`: Placeholder for future auth-related data-fetching Server Actions.

### Route Handlers (`route.ts`)
- **Purpose:** Define API endpoints or server-side logic for specific URL paths (e.g., handling GET, POST requests).
- **Location:** Files named `route.ts` (or `.js`) within the `app` directory structure (e.g., `src/app/(auth)/auth/confirm/route.ts`).
- **Characteristics:**
    - These are inherently server-side. They do not use the `'use client'` or `'use server'` directives in the same way components or action files do.
    - Can directly access server-only Node.js APIs and Next.js server utilities (e.g., `cookies()` from `next/headers`, `redirect()` from `next/navigation`).
- **In this project:**
    - `src/app/(auth)/auth/confirm/route.ts`: Handles the GET request when a user clicks an email confirmation link, verifies the token with Supabase, and redirects.

## III. Project Structure Highlights

The project follows a feature-based organization within the `src` directory to promote modularity and maintainability.

- **`/src/app/`**:
    - Contains global files (`layout.tsx`, `globals.css`).
    - Defines page routes. Page files (`page.tsx`) are kept lean, primarily importing and rendering components from the `features` directory.
    - Uses route groups like `(auth)/` for logical organization of auth-related pages without affecting URL paths.
- **`/src/features/`**:
    - Each sub-directory represents a distinct feature (e.g., `auth/`, `homepage/`).
    - **`auth/`**:
        - `components/`: Client Components for authentication forms (e.g., `login-form.tsx`).
        - `mutations/`: Server Actions for auth data modification (e.g., `auth.mutations.ts`).
        - `queries/`: (Placeholder) Server Actions for auth data fetching.
        - `schemas/`: Zod validation schemas for auth forms.
        - `hooks/`: (Placeholder) Custom React hooks specific to authentication.
- **`/src/components/`**:
    - `ui/`: Reusable ShadCN UI components.
    - `icons/`: Custom SVG icon components.
    - `providers/`: Global React context providers.
    - `analytics/`: Analytics-related components.
- **`/src/lib/`**:
    - `supabase/`: Supabase client initialization (`client.ts` for browser, `server.ts` for server-side).
    - `utils.ts`: General utility functions (e.g., `cn` for class merging).
- **`/src/hooks/`**:
    - General-purpose custom React Hooks (e.g., `useToast`, `useIsMobile`).
- **`/src/middleware.ts`**:
    - Next.js middleware, primarily used here for Supabase session management and refresh.

## IV. Adapting for Other Projects

This template provides a solid foundation for authentication that can be adapted:

1.  **Supabase Configuration:**
    - Ensure your new project has a `.env.local` file with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing to your Supabase project.
2.  **Styling & UI:**
    - The UI is built with ShadCN components and Tailwind CSS. The theme (CSS HSL variables) is defined in `src/app/globals.css`.
    - You can customize these components or replace them entirely to match your project's design system.
3.  **Redirection URLs:**
    - Carefully review and update `emailRedirectTo` URLs in `src/features/auth/mutations/auth.mutations.ts`.
    - Adjust the `next` query parameter in `src/app/(auth)/auth/confirm/route.ts` if your post-confirmation redirect paths differ.
    - Update navigation links (e.g., post-login redirect in `signInWithPassword` action).
4.  **Protected Routes:**
    - This template focuses on the auth flow itself. To protect routes, you'll need to implement logic (typically in `middleware.ts` or by checking session status in Server Components/Route Handlers) to redirect unauthenticated users.
5.  **Error Handling Pages:**
    - Ensure you create an actual page component for the `/auth/auth-code-error` path (or whatever path you redirect to on OTP verification failure).
6.  **Additional User Metadata:**
    - If you need to collect more user data during registration, add fields to `src/features/auth/components/register-form.tsx`, update the Zod schemas in `src/features/auth/schemas/register.schema.ts`, and modify the `signUpNewUser` action in `src/features/auth/mutations/auth.mutations.ts` to include this data in `options.data`.
7.  **Database Schema (RLS):**
    - Remember to configure Row Level Security (RLS) policies in your Supabase database to control data access appropriately.

## V. Key Technologies Recap

- **Next.js (App Router):** For server-side rendering, client-side navigation, Server Components, and Server Actions.
- **React:** For building user interfaces with a component-based architecture.
- **Supabase:** Open-source Firebase alternative providing database, authentication, and more.
- **ShadCN UI:** A collection of beautifully designed, accessible, and customizable React components.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Zod:** TypeScript-first schema declaration and validation library.
- **Lucide Icons:** Simply beautiful open-source icons.
- **TypeScript:** For static typing and improved code quality.

## Conclusion

This project provides a robust and well-structured template for implementing user authentication in a modern Next.js application. By understanding the flow, the roles of `'use client'` and `'use server'`, and the project's organization, developers can confidently build upon and adapt this foundation for their own applications.
