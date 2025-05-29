// src/components/providers/query-client-provider.tsx
'use client';

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Import devtools
import React, { type ReactNode } from 'react'; // Import React for useState

/**
 * Provides a TanStack Query (React Query) client to the application.
 * This component initializes a QueryClient and wraps its children with QueryClientProvider.
 * It's crucial for enabling client-side data fetching, caching, and synchronization capabilities
 * provided by TanStack Query.
 * Includes ReactQueryDevtools for development.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The QueryClientProvider wrapping the children.
 */
export default function QueryClientProvider({ children }: { children: ReactNode }): JSX.Element {
  // Create a new QueryClient instance for each session (on the client)
  // to avoid sharing data between users if prefetching on the server.
  // Store it in React state to ensure it's stable across re-renders on the client.
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes, example
        refetchOnWindowFocus: false, // Example: disable aggressive refetching
        // Consider other defaults like gcTime (formerly cacheTime)
      },
    },
  }));

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {/* ReactQueryDevtools is recommended for development */}
      {/* Ensure it's only included in development environments if preferred */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </TanstackQueryClientProvider>
  );
}
