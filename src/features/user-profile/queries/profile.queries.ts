// src/features/profile/queries/profile.queries.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { UserProfileSchema, type UserProfile } from '../schemas/profile.schema';
import { getProfileByUserId } from '../services/profile.service';

const getTimestamp = () => new Date().toISOString();

/**
 * Server Action to get the currently authenticated user's profile.
 * This function is intended to be used as a queryFn for TanStack Query.
 *
 * @returns The UserProfile object.
 * @throws Error if user is not authenticated, profile is not found, or service fails.
 */
export async function getCurrentUserProfile(): Promise<UserProfile> {
  console.log(`[${getTimestamp()}] getCurrentUserProfile: Action started.`);
  const supabase = await createClient();

  console.log(`[${getTimestamp()}] getCurrentUserProfile: Fetching auth user.`);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error(`[${getTimestamp()}] getCurrentUserProfile: Authentication error:`, authError.message);
    throw new Error(`Authentication error: ${authError.message}`);
  }
  if (!user) {
    console.error(`[${getTimestamp()}] getCurrentUserProfile: No authenticated user found.`);
    throw new Error('User not authenticated.');
  }
  console.log(`[${getTimestamp()}] getCurrentUserProfile: Auth user ID: ${user.id}, Email: ${user.email ? user.email.substring(0,3) + '...' : 'N/A'}. Fetching profile by ID.`);

  // Pass the user's email directly to the service
  const { data: profile, error: serviceError } = await getProfileByUserId(user.id, user.email);
  console.log(`[${getTimestamp()}] getCurrentUserProfile: Profile service call completed.`);

  if (serviceError) {
    console.error(`[${getTimestamp()}] getCurrentUserProfile: Service error for user ${user.id}:`, serviceError.message);
    // Propagate a cleaner error or the original one
    throw new Error(serviceError.message || 'Failed to get user profile due to service error.');
  }
  if (!profile) {
    console.error(`[${getTimestamp()}] getCurrentUserProfile: Profile not found for user ${user.id}.`);
    throw new Error('User profile not found.');
  }
  console.log(`[${getTimestamp()}] getCurrentUserProfile: Profile data received. Validating.`);
  
  // Validate one last time, primarily to ensure the shape for the client
  const validationResult = UserProfileSchema.safeParse(profile);
  if (!validationResult.success) {
    console.error(`[${getTimestamp()}] getCurrentUserProfile: Final validation failed:`, validationResult.error.flatten());
    throw new Error('Profile data failed final validation.');
  }
  console.log(`[${getTimestamp()}] getCurrentUserProfile: Validation successful. Returning profile.`);

  return validationResult.data;
}
