
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server'; // NextResponse might be needed for complex redirects
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles GET requests to the /auth/confirm endpoint.
 * This route is responsible for verifying One-Time Passwords (OTPs) sent via email,
 * typically for email confirmation or password recovery.
 *
 * It expects 'token_hash' and 'type' query parameters from the confirmation link.
 * An optional 'next' query parameter can specify where to redirect the user upon successful verification.
 * Additional query parameters (e.g., 'email' for password reset context) are forwarded to the 'next' URL.
 *
 * @param {NextRequest} request - The incoming Next.js request object, containing URL and query parameters.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse, typically a redirect
 *                                 to the 'next' path on success or to an error page on failure.
 *                                 Note: `redirect()` from `next/navigation` throws a special error
 *                                 that Next.js handles to perform the redirection.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const originalUrl = new URL(request.url);
  const searchParams = originalUrl.searchParams;

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextPath = searchParams.get('next') ?? '/'; // Default to home if 'next' is not provided

  console.log('Confirm route received:', { token_hash, type, nextPath });

  if (token_hash && type) {
    const supabase = await createClient();

    console.log('Supabase client created successfully');

    const { error } = await supabase.auth.verifyOtp(
    {
      type,
      token_hash,
    });

    if (!error) {
      // Forward all query parameters from the original request,
      // except for Supabase-specific OTP ones (token_hash, type, next itself).
      const paramsToForward = new URLSearchParams();
      searchParams.forEach((value, key) => {
        if (key !== 'token_hash' && key !== 'type' && key !== 'next') {
          paramsToForward.append(key, value);
        }
      });
      
      let redirectUrl = nextPath;
      if (paramsToForward.toString()) {
        redirectUrl = `${nextPath}?${paramsToForward.toString()}`;
      }
      // Supabase recommends redirecting from the server so that cookies are set correctly.
      return redirect(redirectUrl);
    }
  }

  console.error('OTP verification failed or missing token/type:', error);

  // Redirect the user to an error page with some instructions
  // Ensure /auth/auth-code-error page exists
  return redirect('/auth/auth-code-error');
}
