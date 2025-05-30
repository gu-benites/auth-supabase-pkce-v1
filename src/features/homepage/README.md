
# Homepage Feature (`src/features/homepage`)

## Overview

This feature module is responsible for rendering the main landing page of the PassForge application, accessible at the root URL (`/`). It aims to provide an engaging introduction to the application, highlight key features, and guide users towards sign-up or login.

## Key Responsibilities

*   Display the primary marketing and informational content for new visitors.
*   Provide clear navigation to authentication pages (Login, Register) and potentially other key public pages (e.g., Profile if authenticated).
*   Offer a visually appealing and interactive experience to capture user interest.

## Core Modules

*   **`hero-section.tsx`**: The main orchestrating component that brings together all parts of the homepage (header, canvas background, content).
*   **`components/hero-header/`**: Contains components related to the homepage's navigation header:
    *   `hero-header.tsx`: The main header component, including logo, navigation links, dropdowns, mobile menu toggle, and authentication-related action buttons. It integrates with the project's central `useAuth` hook (`@/features/auth/hooks/use-auth.ts`) for authentication state.
    *   `nav-link.tsx`, `dropdown-menu.tsx`, `mobile-menu.tsx`: Reusable components for building the navigation.
*   **`components/hero-content/`**: Holds the main textual content, calls-to-action, and imagery for the hero section of the page. It uses `framer-motion` for animations.
*   **`components/hero-canvas-background/`**: Renders an interactive dot-matrix background animation using HTML5 Canvas.
*   **`components/rotating-text/` & `components/shiny-text/`**: Specialized components for animated text effects used in the hero content.
*   **`constants/`**: Stores constants used by the homepage feature, such as navigation items and canvas animation parameters.
*   **`types/`**: TypeScript type definitions specific to the homepage feature.

## Related Application Parts

*   **`src/app/page.tsx`**: The Next.js App Router entry point for the root URL (`/`). It directly renders the `HeroSection` from this feature.
*   **`src/features/auth/hooks/use-auth.ts`**: The `useAuth` hook is used by `HeroHeader` and `MobileMenu` to display appropriate authentication-related buttons (e.g., "Sign In", "Register" vs. "Profile", "Log Out") and user information.
*   **`src/features/auth/actions/auth.actions.ts`**: The `signOutUserAction` Server Action is used for handling user sign-out.
*   **`src/hooks/use-window-size.tsx`**: Used by the `HeroCanvasBackground` to adapt to screen resizes.
*   **Styling**: Relies on global styles in `src/styles/globals.css` and Tailwind CSS utility classes.

## Detailed Documentation

For a more in-depth understanding of the homepage's architecture (as originally purchased), component interactions, animations, and specific functionalities, please refer to the [Purchased Homepage Template Detailed Documentation](/docs/do_not_change_or_delete/purchased_homepage_template/homepage-docs.md). **Note that authentication state in the header components has been integrated with the project's central `useAuth` hook.**
