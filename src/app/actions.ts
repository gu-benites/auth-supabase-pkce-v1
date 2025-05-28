
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

const emailSchema = z.string().email({ message: "Invalid email address." });
const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  // Add more complexity requirements if needed, e.g.,
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
    };
  }

  const supabase = createClient();
  const origin = headers().get("origin"); // Get the site URL dynamically
  
  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Password reset failed.",
    };
  }

  // Updated redirectTo to include the 'next' parameter for successful OTP verification
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
    };
  }

  const validation = passwordSchema.safeParse(password);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.errors.map((e) => e.message).join(", "),
    };
  }

  const supabase = createClient();

  // Check if user is authenticated (should be after token exchange)
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
