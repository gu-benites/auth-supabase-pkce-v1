
// src/app/(dashboard)/dashboard/page.tsx
import { DashboardHomepageView } from '@/features/dashboard/dashboard-homepage';
// QueryClient, HydrationBoundary, getCurrentUserProfile, createClient, redirect are removed
// as user profile prefetching is now handled by the (dashboard) layout.

/**
 * Server Component for the main dashboard page (/dashboard).
 * It renders the DashboardHomepageView. User profile prefetching is handled
 * by the shared (dashboard) layout.
 *
 * @returns {Promise<JSX.Element>} The dashboard page component.
 */
export default async function DashboardPage(): Promise<JSX.Element> {
  // Server-side auth check and prefetching for user profile removed from here.
  // The (dashboard)/layout.tsx now handles prefetching common data like the user profile.
  // Middleware handles the primary auth redirection.

  return (
    <DashboardHomepageView />
  );
}
