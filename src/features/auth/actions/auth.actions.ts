// src/features/auth/actions/auth.actions.ts
"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import * as authService from '@/features/auth/services/auth.service';
import {
  emailSchema as commonEmailSchema,
  passwordSchema as commonPasswordSchema,
  firstNameSchema as commonFirstNameSchema,
  lastNameSchema as commonLastNameSchema,
} from "@/features/auth/schemas";
import { loginPasswordSchema } from "@/features/auth/schemas/login.schema"; // Ensure this path is correct
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('AuthActions');

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
  logger.info(`Password reset requested for email: ${email?.substring(0,3)}...`);

  const validationResult = commonEmailSchema.safeParse(email);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map((e) => e.message).join(", ");
    logger.warn('Password reset validation failed for email.', { emailProvided: !!email, error: errorMessage });
    return {
      success: false,
      message: errorMessage,
      errorFields: { email: errorMessage }
    };
  }

  const origin = headers().get("origin");
  if (!origin) {
    logger.error('Could not determine application origin for password reset.');
    return {
      success: false,
      message: "Could not determine application origin. Password reset failed.",
    };
  }
  const redirectTo = `${origin}/auth/confirm?next=/reset-password&email=${encodeURIComponent(email)}`;

  const { error } = await authService.resetPasswordForEmailWithSupabase(email, { redirectTo });

  if (error) {
    logger.error('Service error during password reset request.', { email, serviceError: error.message });
    return {
      success: false,
      message: `Password reset request failed: ${error.message}`,
    };
  }
  logger.info(`Password reset email sent successfully for email: ${email?.substring(0,3)}...`);
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
  const email = formData.get("email") as string; // Assuming email is passed if needed for context, though not directly used by Supabase updateUser
  logger.info(`Attempting to update password for user (email from form: ${email?.substring(0,3)}...).`);


  if (password !== confirmPassword) {
    logger.warn('Password update validation failed: Passwords do not match.');
    return {
      success: false,
      message: "Passwords do not match.",
      errorFields: { confirmPassword: "Passwords do not match."}
    };
  }

  const passwordValidation = commonPasswordSchema.safeParse(password);
  if (!passwordValidation.success) {
    const errorMessage = passwordValidation.error.errors.map((e) => e.message).join(", ");
    logger.warn('Password update validation failed for new password.', { error: errorMessage });
    return {
      success: false,
      message: errorMessage,
      errorFields: { password: errorMessage }
    };
  }

  const { error } = await authService.updateUserWithSupabase({ password });

  if (error) {
    let friendlyMessage = `Failed to update password: ${error.message}`;
    if (error.message.includes("User not found") || error.message.includes("Auth session missing")) {
        friendlyMessage = "User not authenticated or session invalid. Please try the password reset process again.";
    }
    logger.error('Service error during password update.', { serviceError: error.message, friendlyMessage });
    return {
      success: false,
      message: friendlyMessage,
    };
  }

  logger.info(`Password updated successfully for user (email from form: ${email?.substring(0,3)}...).`);
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
  logger.info(`Sign-in attempt for email: ${email?.substring(0,3)}...`);

  const emailValidation = commonEmailSchema.safeParse(email);
  if (!emailValidation.success) {
    const errorMessage = emailValidation.error.errors.map((e) => e.message).join(", ");
    logger.warn('Sign-in validation failed for email.', { emailProvided: !!email, error: errorMessage });
    return {
      success: false,
      message: "Invalid email address.",
      errorFields: { email: errorMessage }
    };
  }

  const passwordValidation = loginPasswordSchema.safeParse(password);
   if (!passwordValidation.success) {
    const errorMessage = passwordValidation.error.errors.map((e) => e.message).join(", ");
    logger.warn('Sign-in validation failed for password.', { error: errorMessage });
    return {
      success: false,
      message: "Password is required.",
      errorFields: { password: errorMessage }
    };
  }

  const { data, error } = await authService.signInWithPasswordWithSupabase({ email, password });

  if (error) {
    logger.error('Service error during sign-in.', { email: email?.substring(0,3), serviceError: error.message });
    return {
      success: false,
      message: error.message || "Invalid login credentials.",
    };
  }

  if (!data.user) {
     logger.warn('Sign-in failed: No user data returned despite no service error.', { email: email?.substring(0,3) });
     return {
      success: false,
      message: "Login failed. Please check your credentials.",
    };
  }
  
  logger.info(`Sign-in successful, redirecting user: ${data.user.id} to /dashboard`);
  redirect('/dashboard');
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
  logger.info(`Sign-up attempt for email: ${email?.substring(0,3)}...`, { firstNameProvided: !!firstName, lastNameProvided: !!lastName });

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
    logger.warn('Sign-up validation failed.', { errorFields });
    return {
      success: false,
      message: overallMessage,
      errorFields
    };
  }

  const origin = headers().get("origin");
  if (!origin) {
    logger.error('Could not determine application origin for sign-up.');
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
    logger.error('Service error during sign-up.', { email: email?.substring(0,3), serviceError: error.message });
    return {
      success: false,
      message: `Sign up failed: ${error.message}`,
    };
  }

  // Check if user is already confirmed (e.g., if auto-confirm is on, or if it's an existing unconfirmed user re-signing up)
  // Supabase returns user and session null if email requires confirmation and it's a new user.
  // It might return a user if the user already exists (e.g., unconfirmed)
  if (data.user && data.user.email_confirmed_at) {
    logger.info(`Sign-up successful and user already confirmed for email: ${email?.substring(0,3)}... User ID: ${data.user.id}`);
    return {
      success: true,
      message: "Account already confirmed. You can now log in.",
    };
  }
  
  if (!data.user && !data.session && !error) {
    logger.info(`Sign-up successful, email confirmation required for: ${email?.substring(0,3)}...`);
    return {
      success: true,
      message: "Sign up initiated! Please check your email to confirm your account before logging in.",
    };
  }
  
  // Fallback for unexpected states, log and provide a generic message
  logger.warn('Sign-up completed with unexpected state from Supabase.', { email: email?.substring(0,3), data });
  return {
    success: true, // Still, consider it a success in terms of initiating the flow
    message: "Sign up process initiated. Please check your email.",
  };
}

/**
 * Server Action to sign out the currently authenticated user.
 * Calls the authentication service and redirects to the login page.
 *
 * @returns {Promise<void>} Void on successful redirect.
 */
export async function signOutUserAction(): Promise<void> {
  logger.info('Sign-out action initiated.');
  const { error } = await authService.signOutWithSupabase();

  if (error) {
    // The service already logs this error. Here, we just log that the action encountered it.
    logger.error("Sign-out action encountered an error from the service.", { serviceError: error.message });
  } else {
    logger.info('Sign-out action successful, redirecting to /login.');
  }
  redirect('/login');
}
