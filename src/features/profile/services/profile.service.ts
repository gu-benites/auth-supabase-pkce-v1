// src/features/profile/services/profile.service.ts
'use server'; // Important: This service will be called by a Server Action

import { createClient } from '@/lib/supabase/server';
import { type UserProfile, UserProfileSchema } from '../schemas/profile.schema';
import { PostgrestError } from '@supabase/supabase-js';

export interface ProfileServiceResponse {
  data: UserProfile | null;
  error: PostgrestError | Error | null; // Allow for general errors too
}

/**
 * Fetches a user's profile data from the 'profiles' table and merges it
 * with email from 'auth.users'.
 *
 * IMPORTANT ASSUMPTION: This service assumes there is a 'profiles' table in your
 * Supabase database that has a foreign key relationship with 'auth.users.id'.
 * The 'profiles' table should contain fields like 'first_name', 'last_name',
 * 'avatar_url', etc., corresponding to the UserProfileSchema.
 * Adjust field names (e.g., 'first_name' vs 'firstName') as per your DB schema.
 *
 * @param userId The ID of the user whose profile is to be fetched.
 * @returns An object containing the user profile data or an error.
 */
export async function getProfileByUserId(userId: string): Promise<ProfileServiceResponse> {
  const supabase = await createClient();

  try {
    // 1. Fetch profile data from the 'profiles' table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles') // ASSUMPTION: Table name is 'profiles'
      .select('*') // Select all columns defined in your UserProfileSchema from this table
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error(`Error fetching profile for user ${userId}:`, profileError);
      return { data: null, error: profileError };
    }

    // 2. Fetch the user's email from auth.users (as it's authoritative there)
    // This is often done because email in auth.users might be more up-to-date
    // or have different RLS policies than a 'profiles' table.
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error(`Error fetching auth user ${userId} for email:`, authUserError);
      // Depending on requirements, you might still proceed without email or return error
      return { data: null, error: authUserError };
    }

    // 3. Combine data and validate with Zod
    // Ensure field names from DB (e.g., profileData.first_name) match UserProfileSchema keys (e.g., firstName)
    // This example assumes direct mapping or that your DB uses snake_case and Zod schema uses camelCase
    // and you'd handle the transformation if necessary (e.g. using a helper function or manual mapping).
    // For simplicity, this example assumes fields fetched match schema expectations or are nullable.

    const combinedData = {
      id: userId,
      email: authUser?.user?.email ?? null,
      firstName: profileData?.first_name ?? null, // Adjust 'first_name' if your DB column is different
      lastName: profileData?.last_name ?? null,   // Adjust 'last_name'
      gender: profileData?.gender ?? null,
      ageCategory: profileData?.age_category ?? null,
      specificAge: profileData?.specific_age ?? null,
      language: profileData?.language ?? 'en',
      avatarUrl: profileData?.avatar_url ?? null, // Adjust 'avatar_url'
      role: profileData?.role ?? 'user',
      stripeCustomerId: profileData?.stripe_customer_id ?? null,
      subscriptionStatus: profileData?.subscription_status ?? null,
      subscriptionTier: profileData?.subscription_tier ?? null,
      subscriptionPeriod: profileData?.subscription_period ?? null,
      subscriptionStartDate: profileData?.subscription_start_date ?? null,
      subscriptionEndDate: profileData?.subscription_end_date ?? null,
      createdAt: profileData?.created_at ?? new Date().toISOString(), // Fallback if not in DB
      updatedAt: profileData?.updated_at ?? new Date().toISOString(), // Fallback if not in DB
    };

    const validationResult = UserProfileSchema.safeParse(combinedData);

    if (!validationResult.success) {
      console.error(`Validation failed for user profile ${userId}:`, validationResult.error.flatten());
      return { data: null, error: new Error('Profile data validation failed.') };
    }

    return { data: validationResult.data, error: null };

  } catch (e) {
    console.error('Unexpected error in getProfileByUserId:', e);
    return { data: null, error: e instanceof Error ? e : new Error('An unexpected error occurred.') };
  }
}
