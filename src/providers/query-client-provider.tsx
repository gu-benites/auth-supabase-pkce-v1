'use client'; // Add this directive

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query';
// ReactQueryDevtools import removed from here
import React, { type ReactNode } from 'react';

/**
 * Provides a TanStack Query (React Query) client to the application.
 * This component initializes a QueryClient and wraps its children with QueryClientProvider.
 * It's crucial for enabling client-side data fetching, caching, and synchronization capabilities
 * provided by TanStack Query.
 *
 * @param {object} props - The component's props.
 * @param {ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The QueryClientProvider wrapping the children.
 */
export default function QueryClientProvider({ children }: { children: ReactNode }): JSX.Element {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {/* ReactQueryDevtools rendering removed from here */}
    </TanstackQueryClientProvider>
  );
}
