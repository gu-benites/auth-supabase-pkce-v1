import { createBrowserClient } from '@supabase/ssr'
// It's good practice to generate this file using `npx supabase gen types typescript > src/lib/database.types.ts`
// For now, we'll use a generic Database type or 'any'.
// import type { Database } from '@/lib/database.types'

// Replace 'any' with 'Database' once you have your types generated.
type Database = any;

export function createClient() {
  // Ensure environment variables are defined.
  // You should add these to your .env.local file.
  // NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  // NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL or Anon Key is not defined. Please check your .env.local file.");
  }
  
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
