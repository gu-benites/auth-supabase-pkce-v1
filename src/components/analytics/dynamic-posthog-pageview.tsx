// src/components/analytics/dynamic-posthog-pageview.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import PostHogPageview to ensure it's client-side only
const PostHogPageview = dynamic(() => import('@/components/analytics/posthog-pageview').then(mod => mod.PostHogPageview), {
  ssr: false,
});

export function DynamicPostHogPageview() {
  return <PostHogPageview />;
}
