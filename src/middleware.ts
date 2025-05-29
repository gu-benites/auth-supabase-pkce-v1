
import { type NextRequest } from 'next/server';
import { updateSession } from '@/features/auth/utils';

/**
 * Next.js middleware entry point.
 * This function is invoked for requests matching the `config.matcher` patterns.
 * Its primary responsibility is to call the `updateSession` utility to manage
 * user sessions (refreshing them if necessary) and handle route protection
 * by redirecting unauthenticated users from protected paths.
 *
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse,
 *                                  which may include updated cookies or be a redirect.
 */
export async function middleware(request: NextRequest) {
  // Ensure environment variables are available for the utility function.
  // While the utility itself checks, this is an early check.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is not defined at middleware entry. Please check environment variables.");
    // If Supabase isn't configured, bypass session updates to avoid errors,
    // but this means auth features will not work correctly.
    // Consider how to handle this case based on your app's requirements.
    // For now, we'll let the request proceed, and the utility will log another error.
  }
  
  return await updateSession(request);
}

/**
 * Configuration object for the Next.js middleware.
 * The `matcher` property specifies the paths for which this middleware will run.
 *
 * It's configured to match all request paths except for:
 * - `_next/static` (static files)
 * - `_next/image` (image optimization files)
 * - `favicon.ico` (favicon file)
 * - `api/` (API routes, including Genkit)
 * - `assets/` (any static assets folder)
 * - `fonts/` (any static font folder)
 * - Files with common image extensions (`.svg`, `.png`, `.jpg`, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes, including Genkit)
     * - assets/ (any static assets folder)
     * -fonts/ (any static font folder)
     * - *.png, *.jpg, etc. (image files)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
