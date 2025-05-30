// src/app/page.tsx
"use client";
import { useEffect } from 'react';
import { HeroSection } from '@/features/homepage';

const getTimestamp = () => new Date().toISOString();

/**
 * Renders the main homepage of the PassForge application.
 * This component serves as the entry point for the '/' route.
 * @returns {JSX.Element} The homepage layout component.
 */
export default function RootPage(): JSX.Element {
  useEffect(() => {
    console.log(`[${getTimestamp()}] Homepage (RootPage) mounted.`);
  }, []);

  return <HeroSection />;
}
