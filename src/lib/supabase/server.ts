
"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() { // This is the server client, note: async function
  const cookieStore = await cookies(); // Corrected: await cookies() is asynchronous

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        // The 'remove' method was not in the original code for this file,
        // so it's removed to match the user's working version.
      },
    }
  )
}

