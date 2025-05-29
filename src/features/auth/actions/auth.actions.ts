// src/features/auth/actions/auth.actions.ts
"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import * as authService from '@/features/auth/services/auth.service';
import {
  emailSchema as commonEmailSchema,
  passwordSchema as commonPasswordSchema,
  firstNameSchema as commonFirstNameSchema,
  lastNameSchema as commonLastNameSchema,
  loginPasswordSchema,
} from "@/features/auth/schemas";

/**
 * Represents the state returned by authentication server actions.
 * @property {boolean} success - Indicates if the action was successful.
 * @property {string | null} message - A message describing the result of the action.
 * @property {Record<string, string> | null} [errorFields] - Optional. A record of field-specific error messages.
 */
interface AuthActionState {
  success: boolean;
  message: string | null;
  errorFields?: Record<string, string> | null;
}

/**
 * Server Action to request a password reset link for a user.
 * Validates the email, then calls the authentication service to send a reset link.
 *
 * @param {AuthActionState} prevState - The previous state of the form action.
 * @param {FormData} formData - The form data submitted by the user, expected to contain an 'email'.
 * @returns {Promise<AuthActionState>} The new state indicating success or failure, with messages.
 */
export async function requestPasswordReset(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = formData.get("email") as string;

  const validationResult = commonEmailSchema.safeParse(email);
  if (!validationResult.success) {
    return {
      success: false,
      message: validationResult.error.errors.map((e) => e.message).join(", "),
      errorFields: { email: validationResult.error.errors.map((e) => e.message).join(", ") }
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

/**
 * Server Action to update a user's password after they've confirmed via email link.
 * Validates the new password and confirmation, then calls the authentication service.
 *
 * @param {AuthActionState} prevState - The previous state of the form action.
 * @param {FormData} formData - The form data, expected to contain 'password' and 'confirmPassword'.
 * @returns {Promise<AuthActionState>} The new state indicating success or failure.
 */
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

  const passwordValidation = commonPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    return {
      success: false,
      message: passwordValidation.error.errors.map((e) => e.message).join(", "),
      errorFields: { password: passwordValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const { error } = await authService.updateUserWithSupabase({ password });

  if (error) {
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

/**
 * Server Action to sign in a user with their email and password.
 * Validates credentials, calls the authentication service, and redirects on success.
 *
 * @param {AuthActionState} prevState - The previous state of the form action.
 * @param {FormData} formData - The form data, expected to contain 'email' and 'password'.
 * @returns {Promise<AuthActionState | void>} The new state on failure, or void on successful redirect.
 */
export async function signInWithPassword(prevState: AuthActionState, formData: FormData): Promise<AuthActionState | void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const emailValidation = commonEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    return {
      success: false,
      message: "Invalid email address.",
      errorFields: { email: emailValidation.error.errors.map((e) => e.message).join(", ") }
    };
  }

  const passwordValidation = loginPasswordSchema.safeParse(password);
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
  
  redirect('/');
}

/**
 * Server Action to register a new user.
 * Validates all input fields, then calls the authentication service to create the user
 * and send a confirmation email. User metadata (first name, last name) is included.
 *
 * @param {AuthActionState} prevState - The previous state of the form action.
 * @param {FormData} formData - The form data, including 'firstName', 'lastName', 'email', 'password', 'confirmPassword'.
 * @returns {Promise<AuthActionState>} The new state indicating success or failure.
 */
export async function signUpNewUser(prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  let errorFields: Record<string, string> = {};
  let overallMessage = "";

  const firstNameValidation = commonFirstNameSchema.safeParse(firstName);
  if (!firstNameValidation.success) {
    errorFields.firstName = firstNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const lastNameValidation = commonLastNameSchema.safeParse(lastName);
  if (!lastNameValidation.success) {
    errorFields.lastName = lastNameValidation.error.errors.map((e) => e.message).join(", ");
  }

  const emailValidation = commonEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    errorFields.email = emailValidation.error.errors.map((e) => e.message).join(", ");
  }

  const passwordValidation = commonPasswordSchema.safeParse(password);
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
    } else if (Object.keys(errorFields).length === 1 && !errorFields.confirmPassword) { 
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
        first_name: firstName, // Stored in user_metadata
        last_name: lastName,   // Stored in user_metadata
      }
    }
  );

  if (error) {
    return {
      success: false,
      message: `Sign up failed: ${error.message}`,
    };
  }

  if (!data.user && !data.session) { 
     return {
      success: false,
      message: data.user === null && data.session === null && !error ?
               "Sign up process initiated. Please check your email to confirm your account before logging in." :
               "Sign up successful, but no user data returned. Please check your email to confirm.",
    };
  }
  
  return {
    success: true,
    message: "Sign up successful! Please check your email to confirm your account before logging in.",
  };
}

/**
 * Server Action to sign out the currently authenticated user.
 * Calls the authentication service and redirects to the login page.
 *
 * @returns {Promise<void>} Void on successful redirect.
 */
export async function signOutUserAction(): Promise<void> {
  const { error } = await authService.signOutWithSupabase();

  if (error) {
    console.error("Sign out error:", error.message);
  }
  redirect('/login');
}
