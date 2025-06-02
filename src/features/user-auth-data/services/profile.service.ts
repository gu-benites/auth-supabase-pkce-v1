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
 * Fetches a user's profile data from the 'profiles' table and uses the provided email.
 *
 * @param userId The ID of the user whose profile is to be fetched.
 * @param userEmail The email of the user, passed from an authenticated context.
 * @returns An object containing the user profile data or an error.
 */
export async function getProfileByUserId(userId: string, userEmail: string | null | undefined): Promise<ProfileServiceResponse> {
  console.log(`[${getTimestamp()}] getProfileByUserId: Service started for user ID: ${userId}, with email: ${userEmail ? userEmail.substring(0,3) + '...' : 'N/A'}.`);
  const supabase = await createClient();

  try {
    // 1. Fetch profile data from the 'profiles' table
    console.log(`[${getTimestamp()}] getProfileByUserId: Fetching from 'profiles' table for user ID: ${userId}.`);
    const { data: profileData, error: profileError } = await supabase
      .from('profiles') 
      .select('*') 
      .eq('id', userId)
      .maybeSingle();
    console.log(`[${getTimestamp()}] getProfileByUserId: 'profiles' table query completed for user ID: ${userId}.`);

    if (profileError) {
      console.error(`[${getTimestamp()}] getProfileByUserId: Error fetching profile for user ${userId}:`, profileError);
      return { data: null, error: profileError };
    }

    // Email is now passed directly, no need to fetch it via admin client here.
    console.log(`[${getTimestamp()}] getProfileByUserId: Using provided email for user ${userId}: ${userEmail ? userEmail.substring(0,3) + '...' : 'N/A'}.`);

    // 3. Combine data and validate with Zod
    const combinedData = {
      id: userId,
      email: userEmail, // Use the passed email
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
      createdAt: profileData?.created_at ?? new Date().toISOString(), // Fallback for existing records
      updatedAt: profileData?.updated_at ?? new Date().toISOString(), // Fallback for existing records
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
    console.error(`[${getTimestamp()}] getProfileByUserId: Unexpected error for user ID ${userId}:`, errorMessage, e);
    return { data: null, error: new Error(errorMessage) };
  }
}
