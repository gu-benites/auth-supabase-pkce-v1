
"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Input, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui";
import { signUpNewUser } from "@/features/auth/mutations"; // Updated import
import { useToast } from "@/hooks";
import { PassForgeLogo } from "@/components/icons";
import { UserPlus, Mail, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
      Create Account
    </Button>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const initialState = { message: null, success: false, errorFields: null };
  const [state, formAction] = useActionState(signUpNewUser, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: "Account Created!",
          description: state.message,
        });
        // No automatic redirect here, user needs to confirm email.
        // Optionally, you could redirect to a page saying "check your email"
      } else {
        toast({
          title: "Registration Failed",
          description: state.message,
          variant: "destructive",
        });
      }
    }
  }, [state, toast, router]);

  if (state?.success) {
    return (
     <main className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
       <Card className="w-full max-w-md shadow-xl">
         <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <PassForgeLogo className="h-12 w-12 text-primary" />
           </div>
           <CardTitle className="text-3xl font-bold">Confirm Your Email</CardTitle>
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
          <CardTitle className="text-3xl font-bold">Create Account</CardTitle>
          <CardDescription>Join PassForge today.</CardDescription>
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
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  Password
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
                Confirm Password
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
         <CardFooter className="flex-col items-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log In
              </Link>
            </p>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} PassForge. All rights reserved.
      </footer>
    </main>
  );
}
