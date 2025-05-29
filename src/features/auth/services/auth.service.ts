// src/features/auth/services/auth.service.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js';

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
 *
 * @param {SignUpWithPasswordCredentials} credentials - The email and password for the new user.
 * @param {SignUpOptions} [options] - Optional parameters like emailRedirectTo and user metadata.
 * @returns {Promise<ReturnType<typeof supabase.auth.signUp>>} The response from Supabase, containing user data or an error.
 */
export async function signUpWithSupabase(
  credentials: SignUpWithPasswordCredentials,
  options?: SignUpOptions
) {
  const supabase = await createClient();
  return supabase.auth.signUp({ ...credentials, options });
}

/**
 * Signs in an existing user with Supabase using email and password.
 *
 * @param {SignInWithPasswordCredentials} credentials - The user's email and password.
 * @returns {Promise<ReturnType<typeof supabase.auth.signInWithPassword>>} The response from Supabase, containing session data or an error.
 */
export async function signInWithPasswordWithSupabase(
  credentials: SignInWithPasswordCredentials
) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword(credentials);
}

/**
 * Sends a password reset email to the user.
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
  const supabase = await createClient();
  return supabase.auth.resetPasswordForEmail(email, options);
}

/**
 * Updates attributes for the currently authenticated user (e.g., password).
 *
 * @param {UserAttributes} attributes - The user attributes to update (e.g., { password: 'newPassword' }).
 * @returns {Promise<ReturnType<typeof supabase.auth.updateUser>>} The response from Supabase, containing updated user data or an error.
 */
export async function updateUserWithSupabase(attributes: UserAttributes) {
  const supabase = await createClient();
  return supabase.auth.updateUser(attributes);
}

/**
 * Signs out the currently authenticated user.
 *
 * @returns {Promise<ReturnType<typeof supabase.auth.signOut>>} The response from Supabase (typically just an error object if one occurs).
 */
export async function signOutWithSupabase() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}
