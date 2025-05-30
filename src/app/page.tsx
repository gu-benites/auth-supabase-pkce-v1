// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { HomepageLayout } from '@/features/homepage/components';

// Removed getTimestamp and useEffect for logging page mount.

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
