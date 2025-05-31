
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Input, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui";
import { signInWithPassword } from "@/features/auth/actions";
import { useToast } from "@/hooks";
import { PassForgeLogo } from "@/components/icons";
import { LogIn, Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import * as Sentry from '@sentry/nextjs';

/**
 * A button component that displays a loading spinner while the form action is pending.
 * @returns {JSX.Element} The submit button.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
      Log In
    </Button>
  );
}

// List of common user-facing error messages that shouldn't be sent to Sentry as system errors.
const USER_FACING_ERROR_SUBSTRINGS = [
  "invalid email address",
  "password is required",
  "invalid login credentials",
  "please check your credentials"
];

/**
 * Renders the login form.
 * Allows users to sign in with their email and password.
 * Uses a Server Action (`signInWithPassword`) to handle authentication.
 * Displays success or error messages using toasts and handles redirection on success.
 * Includes a password visibility toggle.
 * This component is intended to be rendered within a layout that handles overall page structure.
 *
 * @returns {JSX.Element} The login form component.
 */
export default function LoginForm(): JSX.Element {
  const { toast } = useToast();
  const initialState = { message: null, success: false, errorFields: null };
  const [state, formAction] = useActionState(signInWithPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Success!",
          description: state.message,
        });
      } else {
        toast({
          title: "Login Failed",
          description: state.message,
          variant: "destructive",
        });
        // Log to Sentry if the error doesn't seem like a common user validation error.
        const isUserFacingError = USER_FACING_ERROR_SUBSTRINGS.some(sub => 
          state.message!.toLowerCase().includes(sub)
        );
        if (!isUserFacingError && !state.errorFields) {
          Sentry.captureMessage('Login action failed with unexpected server message', {
            level: 'error',
            extra: { 
              action: 'signInWithPassword', 
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
          <CardTitle className="text-3xl font-bold">Welcome Back!</CardTitle>
          <CardDescription>Log in to your PassForge account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 focus:ring-accent"
                  aria-describedby={state?.errorFields?.password ? "password-error" : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {state?.errorFields?.password && <p id="password-error" className="text-sm text-destructive">{state.errorFields.password}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
         <CardFooter className="flex-col items-center text-sm">
            <p className="text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign Up
              </Link>
            </p>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved.
      </footer>
    </div>
  );
}
