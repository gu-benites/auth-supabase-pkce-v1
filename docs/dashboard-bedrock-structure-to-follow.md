
# Next.js Dashboard & Features: Guidelines Cheat Sheet

This guide focuses on structuring your dashboard's shared layout, nested routes like chat, and the organization of your `/src/features/dashboard` directory.

**NOTE:** Items marked with `[MOVED]` or `[EXTRACTED]` or `[CREATED]` indicate changes made during refactoring. Original paths might be obsolete or their content significantly altered. `[OBSOLETE]` indicates the file/path is no longer needed.

## Core Principles:

*   `/src/app/`**: Handles routing, route groups, and applies layouts.
*   **`/src/features/`**: Contains the actual UI components, logic, services, and types for distinct application features.
    
*   **Naming Conventions**:
    *   **Files & Folders**: `kebab-case` (e.g., `user-profile.tsx`, `page-header/`)
    *   **React Components**: `PascalCase` (e.g., `UserProfileCard`, `DashboardShell`)
    *   **Functions & Actions**: `PascalCase` (e.g., `GetUserData()`, `HandleFormSubmit()`, `UpdateProfileAction()`) _(as per your specified preference)_

## 1\. Dashboard Shared Layout
*   **Layout File Location**:
    *   `/src/app/(dashboard)/layout.tsx` (This uses `DashboardLayout` from `features`)
    *   Purpose: Defines the persistent UI shell (sidebar, header, etc.) for all routes within the `(dashboard)` route group. **Crucially, this Server Component handles server-side prefetching of the authenticated user's profile data.** The `(dashboard)` group itself does not add to the URL path.

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
*   **Actual `DashboardLayout` Orchestrator**: `src/features/dashboard/components/dashboard-layout.tsx` (This component is now leaner and uses the new layout parts) **[PHASE 1 COMPLETE]**

*   **Shared UI Components (Sidebar, Header, User Menu)**:
    
    *   **Location**: `/src/features/dashboard/components/` **[PHASE 1 COMPLETE - ADJUSTED LOCATION]**
    *   **Files**:
        *   `dashboard-sidebar.tsx` (exports `DashboardSidebar` component) **[CREATED IN PHASE 1]** - Contains navigation links.
        *   `dashboard-header.tsx` (exports `DashboardHeader` component) **[CREATED IN PHASE 1]** - Contains page title and header controls.
        *   `dashboard-user-menu.tsx` (exports `DashboardUserMenu` component, used within `DashboardSidebar`) **[CREATED IN PHASE 1]** - Uses the `useAuth` hook to access `user` and `profile` data for displaying the user's name, email, and avatar. Handles logout using `signOutUserAction`.
        *   `index.ts` (Barrel file: `export * from './dashboard-sidebar'; export * from './dashboard-header'; export * from './dashboard-user-menu';`) **[CREATED IN PHASE 1]** - Exports the shared components.
*   **Old Locations (Obsolete after Phase 1):**
    * `src/features/dashboard/components/sidebar.tsx` `[OBSOLETE after PHASE 1]`
    * Header logic was inside `src/features/dashboard/components/dashboard-layout.tsx` `[EXTRACTED to /layout/dashboard-header.tsx in PHASE 1]`

    **(Note: The `layout` directory was initially planned for shared UI but components were placed directly in `components` during refactoring. This doc reflects the actual final location.)**

## 2\. Dashboard Pages (Example: Main & Chat) - **[UPDATED PATHS IN PHASE 2 & 3]**
This assumes your dashboard URLs are like `/dashboard`, `/dashboard/chat`, etc.

#### A. Main Dashboard Page (e.g., Overview)
*   **URL**: `/dashboard`
*   **Route File**: `/src/app/(dashboard)/dashboard/page.tsx`
    
    ```
    // /src/app/(dashboard)/dashboard/page.tsx
    import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage'; // Path changed in PHASE 2
    
    export default function DashboardPage() {
      return <DashboardHomepageView />;
    }
    ```

*   **Feature Component Location**: `/src/features/dashboard/dashboard-homepage/` **[PHASE 2 COMPLETE]**
    *   Main view component file: `dashboard-homepage-view.tsx` (exports `DashboardHomepageView`) **[CREATED IN PHASE 2]**
    *   Barrel file: `index.ts` (exports `DashboardHomepageView`) **[CREATED IN PHASE 2]**
*   **Old Location (Obsolete after Phase 2)**:
    * `src/features/dashboard/components/dashboard-homepage/dashboard-homepage.tsx` `[OBSOLETE after PHASE 2]`
    * `src/features/dashboard/components/dashboard-homepage/index.ts` `[OBSOLETE after PHASE 2]`

#### B. Chat Page (Nested under Dashboard)
*   **URL**: `/dashboard/chat`
*   **Route File**: `/src/app/(dashboard)/dashboard/chat/page.tsx`

    ```
    // /src/app/(dashboard)/dashboard/chat/page.tsx
    import { ChatView } from '@/features/dashboard/chat'; // Path changed in PHASE 3
    
    export default function DashboardChatPage() {
      return <ChatView />;
    }
    ```

*   **Feature Component Location**: `/src/features/dashboard/chat/` **[PHASE 3 COMPLETE]**
    *   Main view component file: `chat-view.tsx` (exports `ChatView`, contains the main chat UI logic and renders `chat-input.tsx`) **[CREATED IN PHASE 3]**
    *   Sub-component: `components/chat-input.tsx` (exports `ChatInput`, used by `ChatView`) **[CREATED IN PHASE 3]**
    *   Barrel file: `index.ts` (exports `ChatView`) **[CREATED IN PHASE 3]**
*   **Old Chat Component Location**: `src/features/chat/components/chat-page.tsx` `[OBSOLETE after PHASE 3 - logic moved to chat-view.tsx]`
*   **Old Chat Input Component Location**: `src/features/chat/components/chat-input.tsx` `[OBSOLETE after PHASE 3 - logic moved to /dashboard/chat/components/chat-input.tsx]`
*   **Old Chat Messages Component Location**: `src/features/chat/components/chat-messages.tsx` `[OBSOLETE after PHASE 3 - logic handled within chat-view.tsx]`

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
│   └── index.ts                # Barrel file for components like DashboardLayout
│
├── dashboard-homepage/         # [CREATED/POPULATED IN PHASE 2] Feature for the main /dashboard page content
│   ├── components/             # UI sub-components specific to dashboard-homepage (Example)
│   ├── hooks/                  # Custom hooks for this feature (Example)
│   ├── dashboard-homepage-view.tsx # Main view component (exports DashboardHomepageView) [CREATED IN PHASE 2]
│   └── index.ts                # Barrel file for this feature [CREATED IN PHASE 2]
│
├── chat/                       # [CREATED/POPULATED IN PHASE 3] Feature for the /dashboard/chat page content
│   ├── components/             # UI sub-components specific to dashboard's chat view
│   │   └── chat-input.tsx      # Chat input component used by ChatView [CREATED IN PHASE 3]
│   ├── hooks/                  # Custom hooks for dashboard's chat view (if any) (Example)
│   ├── chat-view.tsx           # Main view component (exports ChatView, contains full chat UI) [CREATED IN PHASE 3]
│   └── index.ts                # Barrel file for this feature [CREATED IN PHASE 3]
│
│
├── settings/                   # Example: Feature for /dashboard/settings (Not yet implemented)
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

