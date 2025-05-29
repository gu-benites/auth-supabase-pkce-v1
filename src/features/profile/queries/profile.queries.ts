// src/features/profile/queries/profile.queries.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { UserProfileSchema, type UserProfile } from '../schemas/profile.schema';
import { getProfileByUserId } from '../services/profile.service';

/**
 * Server Action to get the currently authenticated user's profile.
 * This function is intended to be used as a queryFn for TanStack Query.
 *
 * @returns The UserProfile object.
 * @throws Error if user is not authenticated, profile is not found, or service fails.
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error('Authentication error in getCurrentUserProfile:', authError);
    throw new Error(`Authentication error: ${authError.message}`);
  }
  if (!user) {
    console.error('No authenticated user found in getCurrentUserProfile.');
    throw new Error('User not authenticated.');
  }

  const { data: profile, error: serviceError } = await getProfileByUserId(user.id);

  if (serviceError) {
    console.error(`Service error in getCurrentUserProfile for user ${user.id}:`, serviceError);
    throw new Error(`Failed to get user profile: ${serviceError.message}`);
  }
  if (!profile) {
    console.error(`Profile not found for user ${user.id} in getCurrentUserProfile.`);
    // Consider what should happen if a profile is truly not found vs. an error.
    // For now, throwing an error, but you might want to return null or a default profile.
    throw new Error('User profile not found.');
  }
  
  // Validate one last time, primarily to ensure the shape for the client
  const validationResult = UserProfileSchema.safeParse(profile);
  if (!validationResult.success) {
    console.error('Final validation failed in getCurrentUserProfile:', validationResult.error.flatten());
    throw new Error('Profile data failed final validation.');
  }

  return validationResult.data;
}
