
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server'; // Corrected import

export async function GET(request: NextRequest) {
  const originalUrl = new URL(request.url);
  const searchParams = originalUrl.searchParams;

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextPath = searchParams.get('next') ?? '/'; // Default to home if 'next' is not provided

  if (token_hash && type) {
    const supabase = await createClient(); // Added await

    const { error } = await supabase.auth.verifyOtp({
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
      return redirect(redirectUrl);
    }
  }

  // Redirect the user to an error page with some instructions
  // Ensure /auth/auth-code-error page exists
  return redirect('/auth/auth-code-error');
}
