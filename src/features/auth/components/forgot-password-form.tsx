
"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requestPasswordReset } from "@/features/auth/actions";
import { useToast } from "@/hooks";
import { PassForgeLogo } from "@/components/icons";
import { Mail, Loader2 } from "lucide-react";
import * as Sentry from '@sentry/nextjs';

/**
 * A button component that displays a loading spinner while the form action is pending.
 * @returns {JSX.Element} The submit button.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
      Send Reset Link
    </Button>
  );
}

// List of common user-facing error/info messages that shouldn't be sent to Sentry as system errors.
const USER_FACING_FORGOT_PASSWORD_MESSAGES = [
  "invalid email address",
  "if an account exists for this email, a password reset link has been sent." // This is a success message
];

/**
 * Renders the "Forgot Password" form.
 * Allows users to enter their email address to request a password reset link.
 * Uses a Server Action (`requestPasswordReset`) to handle the submission.
 * Displays success or error messages using toasts.
 * This component is intended to be rendered within a layout that handles overall page structure.
 *
 * @returns {JSX.Element} The forgot password form component.
 */
export default function ForgotPasswordForm(): JSX.Element {
  const { toast } = useToast();
  const initialState = { message: null, success: false, errorFields: null };
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        });
      } else {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
        // Log to Sentry if the error doesn't seem like a common user validation/info error.
        const isUserFacingError = USER_FACING_FORGOT_PASSWORD_MESSAGES.some(sub => 
          state.message!.toLowerCase().includes(sub)
        );
        if (!isUserFacingError && !state.errorFields) {
          Sentry.captureMessage('Forgot password action failed with unexpected server message', {
            level: 'error',
            extra: { 
              action: 'requestPasswordReset', 
              formStateMessage: state.message,
              emailUsed: (document.getElementById('email') as HTMLInputElement)?.value?.substring(0,3) + '...'
            }
          });
        }
      }
    }
  }, [state, toast]);

  return (
    <div className="w-full animate-fade-in">
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PassForgeLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Forgot Password?</CardTitle>
          <CardDescription>Enter your email to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
               <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="pl-10 focus:ring-accent"
                  aria-describedby={state?.errorFields?.email ? "email-error" : undefined}
                />
              </div>
              {state?.errorFields?.email && <p id="email-error" className="text-sm text-destructive">{state.errorFields.email}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved.
      </footer>
    </div>
  );
}
