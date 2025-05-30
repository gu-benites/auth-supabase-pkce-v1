// src/app/testpage/page.tsx
"use client"; // Assuming HeroSection or its children might use client-side features

import { HeroSection } from "@/features/testpage"; // Import from the barrel file

/**
 * Renders the test page for the application.
 * This page displays content from the /src/features/testpage feature.
 *
 * @returns {JSX.Element} The test page component.
 */
export default function TestPage(): JSX.Element {
  return <HeroSection />;
}
