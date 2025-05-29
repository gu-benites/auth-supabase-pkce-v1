
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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
        getAll() {
          return request.cookies.getAll();
        },
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
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password', // Typically needs a token, but initial access should be allowed
    '/auth/confirm',
    '/auth/auth-code-error',
  ];

  // Check if the current path is one of the public paths
  const isPublicPath = publicPaths.some(path => pathname === path || (path.endsWith('*') && pathname.startsWith(path.slice(0, -1))));


  if (!user && !isPublicPath && !pathname.startsWith('/_next/')) {
    // no user, and not a public path, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  return supabaseResponse;
}
