
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const emailSchema = z.string().email({ message: "Invalid email address. Please enter a valid email." });
const passwordSchema = z
  .string()
  .min(1, { message: "Password cannot be empty." }) // For login, just needs to not be empty. Min 8 for reset.
  .min(8, { message: "Password must be at least 8 characters long." });
  // .regex(/[A-Z]/, { message: "Password must contain an uppercase letter." })
  // .regex(/[a-z]/, { message: "Password must contain a lowercase letter." })
  // .regex(/[0-9]/, { message: "Password must contain a number." })
  // .regex(/[^A-Za-z0-9]/, { message: "Password must contain a special character." })

export async function requestPasswordReset(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;

  const validation = emailSchema.safeParse(email);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.errors.map((e) => e.message).join(", "),
      errorFields: { email: validation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = createClient();
  const origin = headers().get("origin");
  
  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Password reset failed.",
    };
  }

  const redirectTo = `${origin}/auth/confirm?next=/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    return {
      success: false,
      message: `Password reset request failed: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "If an account exists for this email, a password reset link has been sent.",
  };
}

export async function updateUserPassword(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
      errorFields: { confirmPassword: "Passwords do not match."}
    };
  }

  const passwordValidation = passwordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return {
      success: false,
      message: passwordValidation.error.errors.map((e) => e.message).join(", "),
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
        success: false,
        message: "User not authenticated. Please try the password reset process again."
    }
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      success: false,
      message: `Failed to update password: ${error.message}`,
    };
  }

  return {
    success: true,
    message: "Your password has been updated successfully. You can now log in with your new password.",
  };
}

// New action for signing in
export async function signInWithPassword(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const emailValidation = emailSchema.safeParse(email);
  if (!emailValidation.success) {
    return {
      success: false,
      message: "Invalid email address.",
      errorFields: { email: emailValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const passwordValidation = z.string().min(1, {message: "Password is required."}).safeParse(password);
   if (!passwordValidation.success) {
    return {
      success: false,
      message: "Password is required.",
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      message: error.message || "Invalid login credentials.", // More specific error if available
    };
  }
  
  if (!data.user) {
     return {
      success: false,
      message: "Login failed. Please check your credentials.",
    };
  }

  // Do not redirect from server action. Client will handle redirect.
  return {
    success: true,
    message: "Logged in successfully! Redirecting...",
  };
}
