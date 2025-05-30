// src/features/profile/services/profile.service.ts
'use server'; // Important: This service will be called by a Server Action

import { createClient } from '@/lib/supabase/server';
import { type UserProfile, UserProfileSchema } from '../schemas/profile.schema';
import { PostgrestError } from '@supabase/supabase-js';

const getTimestamp = () => new Date().toISOString();

export interface ProfileServiceResponse {
  data: UserProfile | null;
  error: PostgrestError | Error | null; // Allow for general errors too
}

/**
 * Fetches a user's profile data from the 'profiles' table and merges it
 * with email from 'auth.users'.
 *
 * @param userId The ID of the user whose profile is to be fetched.
 * @returns An object containing the user profile data or an error.
 */
export async function getProfileByUserId(userId: string): Promise<ProfileServiceResponse> {
  console.log(`[${getTimestamp()}] getProfileByUserId: Service started for user ID: ${userId}.`);
  const supabase = await createClient();

  try {
    // 1. Fetch profile data from the 'profiles' table
    console.log(`[${getTimestamp()}] getProfileByUserId: Fetching from 'profiles' table for user ID: ${userId}.`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles') // ASSUMPTION: Table name is 'profiles'
      .select('*') // Select all columns defined in your UserProfileSchema from this table
      .eq('id', userId)
      .maybeSingle();
    console.log(`[${getTimestamp()}] getProfileByUserId: 'profiles' table query completed.`);

    if (profileError) {
      console.error(`[${getTimestamp()}] getProfileByUserId: Error fetching profile for user ${userId}:`, profileError);
      return { data: null, error: profileError };
    }

    // 2. Fetch the user's email from auth.users (as it's authoritative there)
    console.log(`[${getTimestamp()}] getProfileByUserId: Fetching auth user (admin) for email for user ID: ${userId}.`);
    // Ensure you have appropriate permissions if using admin client functions.
    // For profile service, using the regular client if it's the authenticated user's profile is safer.
    // However, if this service is only ever called by a server action that has already authenticated the user,
    // then fetching their own details or related details might be acceptable.
    // The current auth.getUser() in the calling Server Action is already user-scoped.
    // If we just need the email of the *current* user, the Server Action already has it.
    // Let's assume the goal is to get the email directly for the given userId, potentially for admin scenarios (though less likely for a "get own profile" service).
    // Sticking to the existing pattern which might rely on admin rights if this service were more generic.
    // For a current user profile, user.email from the server action is already available.
    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(userId);
    console.log(`[${getTimestamp()}] getProfileByUserId: Auth user (admin) fetch completed for user ID: ${userId}.`);


    if (authUserError) {
      console.error(`[${getTimestamp()}] getProfileByUserId: Error fetching auth user ${userId} for email:`, authUserError);
      return { data: null, error: authUserError };
    }
    
    const userEmail = authUserData?.user?.email ?? null;
    console.log(`[${getTimestamp()}] getProfileByUserId: Email for user ${userId}: ${userEmail}.`);

    // 3. Combine data and validate with Zod
    const combinedData = {
      id: userId,
      email: userEmail,
      firstName: profileData?.first_name ?? null,
      lastName: profileData?.last_name ?? null,
      gender: profileData?.gender ?? null,
      ageCategory: profileData?.age_category ?? null,
      specificAge: profileData?.specific_age ?? null,
      language: profileData?.language ?? 'en',
      avatarUrl: profileData?.avatar_url ?? null,
      role: profileData?.role ?? 'user',
      stripeCustomerId: profileData?.stripe_customer_id ?? null,
      subscriptionStatus: profileData?.subscription_status ?? null,
      subscriptionTier: profileData?.subscription_tier ?? null,
      subscriptionPeriod: profileData?.subscription_period ?? null,
      subscriptionStartDate: profileData?.subscription_start_date ?? null,
      subscriptionEndDate: profileData?.subscription_end_date ?? null,
      createdAt: profileData?.created_at ?? new Date().toISOString(),
      updatedAt: profileData?.updated_at ?? new Date().toISOString(),
    };
    console.log(`[${getTimestamp()}] getProfileByUserId: Combined data for user ID: ${userId}. Validating.`);

    const validationResult = UserProfileSchema.safeParse(combinedData);

    if (!validationResult.success) {
      console.error(`[${getTimestamp()}] getProfileByUserId: Validation failed for user profile ${userId}:`, validationResult.error.flatten());
      return { data: null, error: new Error('Profile data validation failed.') };
    }
    console.log(`[${getTimestamp()}] getProfileByUserId: Validation successful. Returning data for user ID: ${userId}.`);

    return { data: validationResult.data, error: null };

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    console.error(`[${getTimestamp()}] getProfileByUserId: Unexpected error for user ID ${userId}:`, errorMessage);
    return { data: null, error: new Error(errorMessage) };
  }
}
