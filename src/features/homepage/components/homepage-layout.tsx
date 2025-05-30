// src/features/homepage/components/homepage-layout.tsx
import React from 'react';
import { HeroSection } from './hero-section'; // Changed to direct relative import

/**
 * Provides the overall layout structure for the homepage.
 * It orchestrates the main content area (hero section).
 * The actual header is part of HeroSection now.
 *
 * @returns {JSX.Element} The homepage layout component.
 */
export function HomepageLayout(): JSX.Element {
  return (
    <HeroSection />
  );
}
