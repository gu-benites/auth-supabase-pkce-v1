# Next.js Dashboard & Features: Guidelines Cheat Sheet

This guide focuses on structuring your dashboard's shared layout, nested routes like chat, and the organization of your `/src/features/dashboard` directory.

**NOTE:** Items marked with `[MOVED]` or `[EXTRACTED]` indicate changes made during refactoring. Original paths might be obsolete.

## Core Principles:

*   **`/src/app/`**: Handles routing, route groups, and applies layouts.
*   **`/src/features/`**: Contains the actual UI components, logic, services, and types for distinct application features.
    
*   **Naming Conventions**:
    *   **Files & Folders**: `kebab-case` (e.g., `user-profile.tsx`, `page-header/`)
    *   **React Components**: `PascalCase` (e.g., `UserProfileCard`, `DashboardShell`)
    *   **Functions & Actions**: `PascalCase` (e.g., `GetUserData()`, `HandleFormSubmit()`, `UpdateProfileAction()`) _(as per your specified preference)_

## 1\. Dashboard Shared Layout
*   **Layout File Location**:
    *   `/src/app/(dashboard)/layout.tsx` (This uses `DashboardLayout` from `features`)
    *   Purpose: Defines the persistent UI shell (sidebar, header, etc.) for all routes within the `(dashboard)` route group. The `(dashboard)` group itself does not add to the URL path.

*   **Conceptual** Layout Component **(`/src/app/(dashboard)/layout.tsx`)**:
    ```
    // /src/app/(dashboard)/layout.tsx
    import { DashboardLayout } from '@/features/dashboard/components'; // This still points to the main layout component
    
    export default function DashboardLayout({ children }: { children: React.ReactNode }) {
      return (
        <div className="dashboard-container"> {/* Or your specific layout classes */}
          {/* DashboardLayout from features/dashboard/components now orchestrates sidebar/header from features/dashboard/layout */}
          <DashboardLayout>{children}</DashboardLayout>
        </div>
      );
    }
    ```
*   **Actual `DashboardLayout` Orchestrator**: `src/features/dashboard/components/dashboard-layout.tsx` (This component is now leaner and uses the new layout parts)

*   **Shared UI Components (Sidebar, Header, User Menu)**:
    
    *   **Location**: `/src/features/dashboard/layout/`
    *   **Files**:
        *   `dashboard-sidebar.tsx` (exports `DashboardSidebar` component) **[NEW/REFACTORED]**
        *   `dashboard-header.tsx` (exports `DashboardHeader` component) **[NEW/EXTRACTED]**
        *   `user-menu.tsx` (exports `UserMenu` component, used within `DashboardSidebar`) **[NEW/EXTRACTED]**
        *   `index.ts` (Barrel file: `export * from './dashboard-sidebar'; export * from './dashboard-header'; export * from './user-menu';`) **[NEW]**
*   **Old Locations (Obsolete after Phase 1):**
    * `src/features/dashboard/components/sidebar.tsx` `[MOVED to /layout/dashboard-sidebar.tsx]`
    * Header logic was inside `src/features/dashboard/components/dashboard-layout.tsx` `[EXTRACTED to /layout/dashboard-header.tsx]`

## 2\. Dashboard Pages (Example: Main & Chat)
This assumes your dashboard URLs are like `/dashboard`, `/dashboard/chat`, etc.

#### A. Main Dashboard Page (e.g., Overview)
*   **URL**: `/dashboard`
*   **Route File**: `/src/app/(dashboard)/dashboard/page.tsx`
    
    ```
    // /src/app/(dashboard)/dashboard/page.tsx
    import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage'; // Path might change after Phase 2
    
    export default function DashboardPage() {
      return <DashboardHomepageView />;
    }
    ```

*   **Feature Component Location (Target for Phase 2)**: `/src/features/dashboard/dashboard-homepage/`
    *   Main view component file: `dashboard-homepage-view.tsx` (exports `DashboardHomepageView`)
*   **Current Location (Before Phase 2)**: `src/features/dashboard/components/dashboard-homepage/dashboard-homepage.tsx`

#### B. Chat Page (Nested under Dashboard)
*   **URL**: `/dashboard/chat`
*   **Route File**: `/src/app/(dashboard)/dashboard/chat/page.tsx`

    ```
    // /src/app/(dashboard)/dashboard/chat/page.tsx
    import { ChatView } from '@/features/dashboard/chat'; // Path might change after Phase 3
    
    export default function DashboardChatPage() {
      return <ChatView />;
    }
    ```

*   **Feature Component Location (Target for Phase 3)**: `/src/features/dashboard/chat/`
    *   Main view component file: `chat-view.tsx` (exports `ChatView`)
*   **Current Main Chat Component**: `src/features/chat/components/chat-page.tsx` (The new `ChatView` will likely wrap this).

## 3\. Feature Structure: `/src/features/dashboard/`
This directory groups all code related to the dashboard's functionality and views.

```
/src/features/dashboard/
├── layout/                     # Shared UI for the dashboard shell itself - IMPLEMENTED IN PHASE 1
│   ├── dashboard-header.tsx    # Exports DashboardHeader
│   ├── dashboard-sidebar.tsx   # Exports DashboardSidebar (contains navigation links)
│   ├── user-menu.tsx           # Exports UserMenu
│   └── index.ts                # Barrel file for exports
│
├── components/                 # Main orchestrating components or legacy components before full refactor
│   └── dashboard-layout.tsx    # Main layout component, now uses items from /layout/
│   └── dashboard-homepage/     # [TO BE MOVED/RESTRUCTURED in Phase 2 to /features/dashboard/dashboard-homepage/]
│   │   └── dashboard-homepage.tsx # Current main content for /dashboard
│   │   └── index.ts
│   └── index.ts                # Barrel file for components like DashboardLayout
│
├── dashboard-homepage/         # [TARGET for Phase 2] Feature for the main /dashboard page content
│   ├── components/             # UI sub-components specific to dashboard-homepage
│   │   ├── stats-card.tsx
│   │   └── recent-activity.tsx
│   ├── hooks/                  # Custom hooks for this feature (e.g., useFetchDashboardData.ts)
│   ├── dashboard-homepage-view.tsx # Main view component (exports DashboardHomepageView)
│   └── index.ts                # (Optional)
│
├── chat/                       # [TARGET for Phase 3] Feature for the /dashboard/chat page content *within dashboard context*
│   ├── components/             # UI sub-components specific to dashboard's chat view (if any)
│   ├── hooks/                  # Custom hooks for dashboard's chat view (if any)
│   ├── chat-view.tsx           # Main view component (exports ChatView, likely wraps actual chat logic from /src/features/chat)
│   └── index.ts                # (Optional)
│
│
├── settings/                   # Example: Feature for /dashboard/settings
│   ├── components/
│   ├── settings-view.tsx
│   └── index.ts
│
└── types/                      # (Optional) Shared types specific to dashboard features
    └── index.ts                # or dashboard.types.ts
```

#### Key points for feature folders (e.g., `chat/`, `dashboard-homepage/`):
*   **`[feature-name]-view.tsx`**: Often the main entry component for the feature, imported by the route's `page.tsx`.
*   **`components/`**: Contains smaller, reusable React components used only within that specific feature.
*   **`hooks/`**: Custom React hooks specific to the feature's logic.
*   **`services/` or `actions/`**: (Optional) For API calls or business logic functions (e.g., `FetchChatMessages.ts`, `UpdateSettingsAction.ts`). Remember your `PascalCase` convention for functions/actions.
*   **`types/` or `[feature-name].types.ts`**: TypeScript type definitions specific to the feature.
