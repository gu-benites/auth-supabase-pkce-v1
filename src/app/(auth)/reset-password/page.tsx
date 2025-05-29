
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { updateUserPassword } from "../../actions";
import { useToast } from "@/hooks";
import { PassForgeLogo } from "@/components/icons";
import { KeyRound, Loader2, Eye, EyeOff, Mail } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
      Update Password
    </Button>
  );
}

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email");

  const initialState = { message: null, success: false, errorFields: null };
  const [state, formAction] = useActionState(updateUserPassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You are not authorized to update password. Please try the reset process again.",
          variant: "destructive",
        });
        router.push('/forgot-password'); 
      }
      setIsLoadingUser(false);
    });
  }, [supabase, router, toast]);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Success!",
          description: state.message,
        });
        // User is shown a success message with button to login
      } else {
        toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast, router]);

  if (isLoadingUser) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (state?.success) {
     return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <PassForgeLogo className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Password Updated!</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
         <footer className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} PassForge. All rights reserved.
        </footer>
      </main>
     )
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PassForgeLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Set New Password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            {emailFromQuery && (
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
                    value={emailFromQuery}
                    disabled
                    readOnly
                    className="pl-10 focus:ring-accent bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                New Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
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
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground"
              >
                Confirm New Password
              </label>
              <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="pl-10 pr-10 focus:ring-accent"
                  aria-describedby={state?.errorFields?.confirmPassword ? "confirmPassword-error" : undefined}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </Button>
              </div>
              {state?.errorFields?.confirmPassword && <p id="confirmPassword-error" className="text-sm text-destructive">{state.errorFields.confirmPassword}</p>}
            </div>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved.
      </footer>
    </main>
  );
}
