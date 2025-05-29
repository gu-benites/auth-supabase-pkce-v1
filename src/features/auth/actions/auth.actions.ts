// src/features/auth/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
// import { redirect } from "next/navigation"; // Not used directly for redirection, but good to keep if future actions need it

import * as authService from '@/features/auth/services/auth.service';
import {
  emailSchema as commonEmailSchema,
  passwordSchema as commonPasswordSchema,
  firstNameSchema as commonFirstNameSchema,
  lastNameSchema as commonLastNameSchema,
  loginPasswordSchema as commonLoginPasswordSchema
} from "@/features/auth/schemas";

// Schemas specific to actions, re-exporting or using common ones
const forgotPasswordEmailSchema = commonEmailSchema;
const updateUserPasswordSchema = commonPasswordSchema;
const signInEmailSchema = commonEmailSchema;
const signInPasswordSchema = commonLoginPasswordSchema;
const signUpEmailSchema = commonEmailSchema;
const signUpPasswordSchema = commonPasswordSchema;
const signUpFirstNameSchema = commonFirstNameSchema;
const signUpLastNameSchema = commonLastNameSchema;


interface AuthActionState {
  success: boolean;
  message: string | null;
  errorFields?: Record<string, string> | null;
}

export async function requestPasswordReset(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get("email") as string;

  const validation = forgotPasswordEmailSchema.safeParse(email);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.errors.map((e) => e.message).join(", "),
      errorFields: { email: validation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const origin = headers().get("origin");
  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Password reset failed.",
    };
  }
  const redirectTo = `${origin}/auth/confirm?next=/reset-password&email=${encodeURIComponent(email)}`;

  const { error } = await authService.resetPasswordForEmailWithSupabase(email, { redirectTo });

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

export async function updateUserPassword(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match.",
      errorFields: { confirmPassword: "Passwords do not match."}
    };
  }

  const passwordValidation = updateUserPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return {
      success: false,
      message: passwordValidation.error.errors.map((e) => e.message).join(", "),
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  // No direct supabase.auth.getUser() here, service implies an authenticated context for updateUser
  const { error } = await authService.updateUserWithSupabase({ password });

  if (error) {
    // Supabase's updateUser might return specific errors if user isn't authenticated
    // or if the session isn't valid. We might need more robust checks upstream or
    // rely on Supabase RLS for this.
    let friendlyMessage = `Failed to update password: ${error.message}`;
    if (error.message.includes("User not found") || error.message.includes("Auth session missing")) {
        friendlyMessage = "User not authenticated or session invalid. Please try the password reset process again.";
    }
    return {
      success: false,
      message: friendlyMessage,
    };
  }

  return {
    success: true,
    message: "Your password has been updated successfully. You can now log in with your new password.",
  };
}

export async function signInWithPassword(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const emailValidation = signInEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    return {
      success: false,
      message: "Invalid email address.",
      errorFields: { email: emailValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const passwordValidation = signInPasswordSchema.safeParse(password);
   if (!passwordValidation.success) {
    return {
      success: false,
      message: "Password is required.",
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const { data, error } = await authService.signInWithPasswordWithSupabase({ email, password });

  if (error) {
    return {
      success: false,
      message: error.message || "Invalid login credentials.",
    };
  }

  if (!data.user) {
     return {
      success: false,
      message: "Login failed. Please check your credentials.",
    };
  }

  // Redirect is handled by client-side navigation after success for better UX
  return {
    success: true,
    message: "Logged in successfully! Redirecting...",
  };
}

export async function signUpNewUser(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  let errorFields: Record<string, string> = {};
  let overallMessage = "";

  const firstNameValidation = signUpFirstNameSchema.safeParse(firstName);
  if (!firstNameValidation.success) {
    errorFields.firstName = firstNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const lastNameValidation = signUpLastNameSchema.safeParse(lastName);
  if (!lastNameValidation.success) {
    errorFields.lastName = lastNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const emailValidation = signUpEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    errorFields.email = emailValidation.error.errors.map((e) => e.message).join(", ");
  }

  const passwordValidation = signUpPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    errorFields.password = passwordValidation.error.errors.map((e) => e.message).join(", ");
  }

  if (password !== confirmPassword) {
    errorFields.confirmPassword = "Passwords do not match.";
  }

  if (Object.keys(errorFields).length > 0) {
    overallMessage = "Please correct the errors in the form.";
     if (Object.keys(errorFields).length === 1 && errorFields.confirmPassword) {
        overallMessage = "Passwords do not match.";
    } else if (Object.keys(errorFields).length === 1 && !errorFields.confirmPassword) { // check if not confirmPassword to avoid double message
        overallMessage = Object.values(errorFields)[0];
    }
    return {
      success: false,
      message: overallMessage,
      errorFields
    };
  }

  const origin = headers().get("origin");
  if (!origin) {
    return {
      success: false,
      message: "Could not determine application origin. Sign up failed.",
    };
  }
  const emailRedirectTo = `${origin}/auth/confirm?next=/login`;

  const { data, error } = await authService.signUpWithSupabase(
    { email, password },
    {
      emailRedirectTo,
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  );

  if (error) {
    return {
      success: false,
      message: `Sign up failed: ${error.message}`,
    };
  }

  if (!data.user && !data.session) { // More robust check as per Supabase docs
     return {
      success: false,
      // For some providers, data.user might be null if email confirmation is pending
      // but data.session might also be null initially.
      // The key is that `error` was null.
      message: data.user === null && data.session === null && !error ?
               "Sign up process initiated. Please check your email to confirm your account before logging in." :
               "Sign up successful, but no user data returned. Please check your email to confirm.",
    };
  }
  
  // If user is immediately available (e.g. auto-confirm enabled, or some social providers)
  // data.user will exist. If email confirmation is required, data.user might be null but an email sent.
  // The key is that `error` is null.
  return {
    success: true,
    message: "Sign up successful! Please check your email to confirm your account before logging in.",
  };
}
