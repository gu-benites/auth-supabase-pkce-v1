
# Dashboard Feature (`src/features/dashboard`)

## Overview

The Dashboard feature provides the main user interface and navigational structure for authenticated users (though currently configured for public access during development). It encompasses the primary layout, including a sidebar, header, and content area where various application modules and data are presented.

## Key Responsibilities

*   Render the main application layout post-authentication (sidebar, header, content area).
*   Provide navigation to various sections of the application like the dashboard overview, chat, settings, etc.
*   Display aggregated information, summaries, or entry points to other features.

## Core Modules

*   **`components/dashboard-layout.tsx`**: The React component that defines the structural layout of the dashboard (sidebar, header, main content). It manages sidebar visibility and mobile responsiveness.
*   **`components/sidebar.tsx`**: The navigation sidebar component, allowing users to navigate between different dashboard sections. It's collapsible and includes a user menu.
*   **`components/dashboard-homepage/`**: Contains components specific to the main `/dashboard` landing page, such as `dashboard-homepage.tsx` which renders overview cards and placeholder content.
*   **`components/header.tsx`**: (Currently integrated within `dashboard-layout.tsx`) Responsible for the top bar within the content area, displaying page titles and actions like theme toggling.

## Related Application Parts

*   **`src/app/(dashboard)/`**: Next.js App Router route group containing all pages that fall under the dashboard layout (e.g., `/dashboard`, `/chat`).
    *   `src/app/(dashboard)/layout.tsx`: The route layout file that uses `features/dashboard/components/dashboard-layout.tsx`.
    *   `src/app/(dashboard)/dashboard/page.tsx`: The route for the main dashboard view.
    *   `src/app/(dashboard)/chat/page.tsx`: The route for the chat feature, using the dashboard layout.
*   **`src/features/chat/`**: The chat feature is typically accessed via the dashboard.
*   **`src/components/theme/theme-toggle.tsx`**: Used within the dashboard layout's header.
*   **`useAuth` hook (`src/features/auth/hooks/use-auth.ts`)**: While the dashboard is currently public, in a typical setup, dashboard components would use this hook to access authenticated user information for personalization and data display.

## Detailed Documentation

For a more in-depth understanding of the dashboard architecture, component responsibilities, and how it integrates with other parts of the application, please refer to the [Dashboard Feature Detailed Documentation](/docs/features/dashboard-docs.md).
