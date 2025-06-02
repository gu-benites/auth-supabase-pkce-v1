
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Handles Supabase session updates and route protection.
 * This function is called by the main middleware (`src/middleware.ts`).
 *
 * Responsibilities:
 * 1. Initializes a Supabase server client using cookies from the request.
 * 2. Calls `supabase.auth.getUser()` to:
 *    - Refresh the user's session token if it's expired.
 *    - Retrieve the current user's authentication status.
 * 3. Updates cookies in the response if the session was refreshed.
 * 4. Implements route protection:
 *    - Defines a list of public paths.
 *    - If the user is not authenticated and attempts to access a non-public path,
 *      it redirects them to the `/login` page.
 *
 * @param {NextRequest} request - The incoming Next.js request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse.
 *                                  This response might be the original request's continuation
 *                                  (with potentially updated cookies) or a redirect response
 *                                  if route protection is triggered.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is not defined in middleware utility. Please check environment variables.");
    // Allow request to proceed but log error. Critical auth functionality might be affected.
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        /**
         * Retrieves all cookies from the request.
         * @returns {Array<object>} An array of cookie objects.
         */
        getAll() {
          return request.cookies.getAll();
        },
        /**
         * Sets multiple cookies in both the request (for Supabase client's internal use)
         * and the outgoing response (to be sent to the browser).
         * @param {Array<object>} cookiesToSet - An array of cookie objects to set.
         * Each object should have `name`, `value`, and `options` properties.
         */
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value, options);
          });
          // Re-create supabaseResponse with the potentially updated request object
          // This ensures the Supabase client uses the latest cookie state internally
          supabaseResponse = NextResponse.next({
            request,
          });
          // Apply cookies to the actual response that will be sent to the browser
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
        /**
         * Removes a cookie by setting its value to empty and maxAge to 0.
         * Applies to both the request and the outgoing response.
         * @param {string} name - The name of the cookie to remove.
         * @param {CookieOptions} options - Cookie options.
         */
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  // Refresh session if expired - important for maintaining user login state
  // and getting user information for route protection.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  const publicPaths = [
    '/', // Homepage
    '/dashboard',
    '/dashboard/chat',
    '/dashboard/profile', // Added /dashboard/profile as a public path
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password', // Typically needs a token, but initial access should be allowed
    '/auth/confirm', // Server-side route for OTP verification
    '/auth/auth-code-error', // Error page for OTP failures
    '/sentry-example-page', // Sentry example page
    '/monitoring', // Sentry tunnel route
    // Add other public marketing pages or asset paths if needed
  ];

  // Check if the current path is one of the public paths
  // Also allows access to Next.js internal paths like /_next/
  // and common static asset paths.
  const isPublicPath = publicPaths.some(path => 
    pathname === path || 
    (path.endsWith('*') && pathname.startsWith(path.slice(0, -1)))
  );


  if (!user && !isPublicPath && !pathname.startsWith('/_next/')) {
    // no user, and not a public path, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Optionally, you can add a 'redirectedFrom' query parameter
    // url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}
