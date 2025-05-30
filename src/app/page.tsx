// src/app/page.tsx
// 'use client' directive removed as this page only renders HomepageLayout
import { HomepageLayout } from '@/features/homepage/components';

/**
 * Renders the main homepage of the PassForge application.
 * This component serves as the entry point for the '/' route.
 * It renders the HomepageLayout component, which contains the actual structure and content of the homepage.
 *
 * @returns {JSX.Element} The homepage component rendering the HomepageLayout.
 */
export default function RootPage(): JSX.Element {
  return <HomepageLayout />;
}
