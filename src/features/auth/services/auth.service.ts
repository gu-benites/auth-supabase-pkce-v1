// src/features/auth/services/auth.service.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js';
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('AuthService');

/**
 * Defines the options for the signUpWithSupabase service function.
 * @property {string} [emailRedirectTo] - The URL to redirect the user to after email confirmation.
 * @property {Record<string, any>} [data] - Additional user metadata to store.
 */
interface SignUpOptions {
  emailRedirectTo?: string;
  data?: Record<string, any>;
}

/**
 * Signs up a new user with Supabase using email and password.
 * Logs the attempt and the outcome.
 *
 * @param {SignUpWithPasswordCredentials} credentials - The email and password for the new user.
 * @param {SignUpOptions} [options] - Optional parameters like emailRedirectTo and user metadata.
 * @returns {Promise<ReturnType<typeof supabase.auth.signUp>>} The response from Supabase, containing user data or an error.
 */
export async function signUpWithSupabase(
  credentials: SignUpWithPasswordCredentials,
  options?: SignUpOptions
) {
  logger.info(`Attempting Supabase sign-up for email: ${credentials.email}`, { options: options ? { emailRedirectTo: options.emailRedirectTo, hasData: !!options.data } : {} });
  const supabase = await createClient();
  const result = await supabase.auth.signUp({ ...credentials, options });

  if (result.error) {
    logger.error({
      message: `Supabase sign-up failed for email: ${credentials.email}`,
      error: {
        name: result.error.name,
        message: result.error.message,
        status: result.error.status,
        // stack: result.error.stack, // Stack might be too verbose for regular logs, but good for Sentry
      },
      supabaseError: result.error, // Keep full error for Sentry or detailed debugging
    });
  } else {
    logger.info(`Supabase sign-up successful for email: ${credentials.email}. User ID: ${result.data.user?.id}`);
  }
  return result;
}

/**
 * Signs in an existing user with Supabase using email and password.
 * Logs the attempt and the outcome.
 *
 * @param {SignInWithPasswordCredentials} credentials - The user's email and password.
 * @returns {Promise<ReturnType<typeof supabase.auth.signInWithPassword>>} The response from Supabase, containing session data or an error.
 */
export async function signInWithPasswordWithSupabase(
  credentials: SignInWithPasswordCredentials
) {
  logger.info(`Attempting Supabase sign-in for email: ${credentials.email}`);
  const supabase = await createClient();
  const result = await supabase.auth.signInWithPassword(credentials);

  if (result.error) {
     logger.error({
      message: `Supabase sign-in failed for email: ${credentials.email}`,
      error: { name: result.error.name, message: result.error.message, status: result.error.status },
      supabaseError: result.error,
    });
  } else {
    logger.info(`Supabase sign-in successful for email: ${credentials.email}. User ID: ${result.data.user?.id}`);
  }
  return result;
}

/**
 * Sends a password reset email to the user.
 * Logs the attempt and the outcome.
 *
 * @param {string} email - The user's email address.
 * @param {object} [options] - Optional parameters.
 * @param {string} [options.redirectTo] - The URL to redirect the user to after clicking the reset link.
 * @returns {Promise<ReturnType<typeof supabase.auth.resetPasswordForEmail>>} The response from Supabase.
 */
export async function resetPasswordForEmailWithSupabase(
  email: string,
  options?: { redirectTo?: string }
) {
  logger.info(`Requesting password reset for email: ${email}`, { options });
  const supabase = await createClient();
  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: options?.redirectTo,
  });

  if (result.error) {
     logger.error({
      message: `Supabase password reset request failed for email: ${email}`,
      error: { name: result.error.name, message: result.error.message, status: result.error.status },
      supabaseError: result.error,
    });
  } else {
    logger.info(`Supabase password reset email sent successfully for email: ${email}`);
  }
  return result;
}

/**
 * Updates attributes for the currently authenticated user (e.g., password).
 * Logs the attempt and the outcome.
 *
 * @param {UserAttributes} attributes - The user attributes to update (e.g., { password: 'newPassword' }).
 * @returns {Promise<ReturnType<typeof supabase.auth.updateUser>>} The response from Supabase, containing updated user data or an error.
 */
export async function updateUserWithSupabase(attributes: UserAttributes) {
  // Do NOT log the full 'attributes' object if it contains a password.
  logger.info('Attempting to update user attributes.', { hasPassword: !!attributes.password });
  const supabase = await createClient();
  const result = await supabase.auth.updateUser(attributes);

  if (result.error) {
    logger.error({
      message: 'Supabase user update failed.',
      error: { name: result.error.name, message: result.error.message, status: result.error.status },
      supabaseError: result.error,
    });
  } else {
    logger.info(`Supabase user update successful. User ID: ${result.data.user?.id}`);
  }
  return result;
}

/**
 * Signs out the currently authenticated user.
 * Logs the attempt and the outcome.
 *
 * @returns {Promise<ReturnType<typeof supabase.auth.signOut>>} The response from Supabase (typically just an error object if one occurs).
 */
export async function signOutWithSupabase() {
  logger.info('Attempting Supabase sign-out.');
  const supabase = await createClient();
  // Important: Get user before signing out to log which user is signing out, if needed.
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const userId = currentUser?.id;

  const result = await supabase.auth.signOut();

  if (result.error) {
    logger.error({
      message: `Supabase sign-out failed for user ID: ${userId || 'unknown'}`,
      error: { name: result.error.name, message: result.error.message },
      supabaseError: result.error,
    });
  } else {
    logger.info(`Supabase sign-out successful for user ID: ${userId || 'unknown'}`);
  }
  return result;
}
