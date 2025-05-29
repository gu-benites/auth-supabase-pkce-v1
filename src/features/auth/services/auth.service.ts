// src/features/auth/services/auth.service.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import type { SignUpWithPasswordCredentials, SignInWithPasswordCredentials, UserAttributes } from '@supabase/supabase-js';

interface SignUpOptions {
  emailRedirectTo?: string;
  data?: Record<string, any>;
}

export async function signUpWithSupabase(
  credentials: SignUpWithPasswordCredentials,
  options?: SignUpOptions
) {
  const supabase = await createClient();
  return supabase.auth.signUp({ ...credentials, options });
}

export async function signInWithPasswordWithSupabase(
  credentials: SignInWithPasswordCredentials
) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword(credentials);
}

export async function resetPasswordForEmailWithSupabase(
  email: string,
  options?: { redirectTo?: string }
) {
  const supabase = await createClient();
  return supabase.auth.resetPasswordForEmail(email, options);
}

export async function updateUserWithSupabase(attributes: UserAttributes) {
  const supabase = await createClient();
  return supabase.auth.updateUser(attributes);
}

export async function signOutWithSupabase() {
  const supabase = await createClient();
  return supabase.auth.signOut();
}

// Add other direct Supabase auth calls here if needed
