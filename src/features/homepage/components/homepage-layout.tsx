// src/features/homepage/components/homepage-layout.tsx
import React from 'react';
import { HeroSection } from '../hero-section'; // Corrected: Import from one level up

/**
 * Provides the overall layout structure for the homepage.
 * It orchestrates the main content area (hero section).
 *
 * @returns {JSX.Element} The homepage layout component.
 */
export function HomepageLayout(): JSX.Element {
  return (
    <HeroSection />
  );
}
