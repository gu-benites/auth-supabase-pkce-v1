// src/components/providers/posthog-provider.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider as OriginalPostHogProvider } from 'posthog-js/react'
import React from 'react'

if (typeof window !== 'undefined') {
  // Ensure PostHog only initializes on the client side
  const postHogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const postHogApiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (postHogApiKey && postHogApiHost) {
    posthog.init(postHogApiKey, {
      api_host: postHogApiHost,
      // Enable debug mode in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      }
    })
  } else {
    console.warn("PostHog API key or host not configured. Analytics will be disabled.")
  }
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  // Only render PostHogProvider if API key and host are available
  // This prevents errors if PostHog is not configured
  const postHogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const postHogApiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (postHogApiKey && postHogApiHost) {
    return <OriginalPostHogProvider client={posthog}>{children}</OriginalPostHogProvider>
  }
  // If PostHog is not configured, render children without the provider
  return <>{children}</>
}
