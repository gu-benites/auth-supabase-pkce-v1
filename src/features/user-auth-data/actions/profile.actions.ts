
// src/features/user-auth-data/actions/profile.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { UserProfileSchema, type UserProfile } from "../schemas/profile.schema"; // Assuming UserProfile is exported
import { getServerLogger } from '@/lib/logger';

const logger = getServerLogger('ProfileActions');

interface UpdateProfileResult {
  data?: UserProfile;
  error?: string;
}

/**
 * Server Action to update the current user's profile information.
 * Handles text-based fields only for now.
 *
 * @param data - An object containing the profile fields to update.
 * @returns An object containing the updated profile data or an error message.
 */
export async function updateUserProfile(
  data: Partial<UserProfile>
): Promise<UpdateProfileResult> {
  logger.info("updateUserProfile action started.", {
    providedFields: Object.keys(data),
  });

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logger.error("Authentication error in updateUserProfile.", { error: authError.message });
    return { error: `Authentication error: ${authError.message}` };
  }
  if (!user) {
    logger.warn("No authenticated user found in updateUserProfile.");
    return { error: "User not authenticated." };
  }

  // Prepare data for update, excluding fields not directly on the 'profiles' table or managed elsewhere
  const {
    id,            // Managed by Supabase auth
    email,         // Managed by Supabase auth, usually not updated here
    createdAt,     // Set by database
    updatedAt,     // Will be set now
    role,          // Potentially managed by admin or specific logic
    stripeCustomerId, // Usually managed by billing integration
    subscriptionStatus,
    subscriptionTier,
    subscriptionPeriod,
    subscriptionStartDate,
    subscriptionEndDate,
    avatarUrl,     // Will be handled separately
    bannerUrl,     // Will be handled separately
    ...updatableData // The rest of the fields are candidates for update
  } = data;

  const dataToUpdate: Record<string, any> = { ...updatableData };

  // Ensure fields match the schema expected by the 'profiles' table
  // Supabase typically uses snake_case for column names
  if (dataToUpdate.firstName !== undefined) dataToUpdate.first_name = dataToUpdate.firstName;
  if (dataToUpdate.lastName !== undefined) dataToUpdate.last_name = dataToUpdate.lastName;
  if (dataToUpdate.ageCategory !== undefined) dataToUpdate.age_category = dataToUpdate.ageCategory;
  if (dataToUpdate.specificAge !== undefined) dataToUpdate.specific_age = dataToUpdate.specificAge;
  
  // Remove camelCase versions if snake_case was added
  delete dataToUpdate.firstName;
  delete dataToUpdate.lastName;
  delete dataToUpdate.ageCategory;
  delete dataToUpdate.specificAge;

  dataToUpdate.updated_at = new Date().toISOString();

  logger.info(`Attempting to update profile for user ID: ${user.id}`, { dataToUpdate });

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(dataToUpdate)
    .eq("id", user.id)
    .select()
    .single();

  if (updateError) {
    logger.error(`Failed to update profile for user ID: ${user.id}`, { error: updateError });
    return { error: `Failed to update profile: ${updateError.message}` };
  }

  if (!updatedProfile) {
    logger.error(`Profile update for user ID: ${user.id} did not return data.`, { updateError });
    return { error: "Profile update failed to return data." };
  }

  // Map back to camelCase for consistency with UserProfileSchema
  const resultProfile: UserProfile = {
    id: updatedProfile.id,
    email: user.email, // Use email from auth user
    firstName: updatedProfile.first_name,
    lastName: updatedProfile.last_name,
    gender: updatedProfile.gender,
    ageCategory: updatedProfile.age_category,
    specificAge: updatedProfile.specific_age,
    language: updatedProfile.language,
    avatarUrl: updatedProfile.avatar_url,
    bannerUrl: updatedProfile.banner_url,
    bio: updatedProfile.bio,
    role: updatedProfile.role,
    stripeCustomerId: updatedProfile.stripe_customer_id,
    subscriptionStatus: updatedProfile.subscription_status,
    subscriptionTier: updatedProfile.subscription_tier,
    subscriptionPeriod: updatedProfile.subscription_period,
    subscriptionStartDate: updatedProfile.subscription_start_date,
    subscriptionEndDate: updatedProfile.subscription_end_date,
    createdAt: updatedProfile.created_at,
    updatedAt: updatedProfile.updated_at,
  };
  
  const validationResult = UserProfileSchema.safeParse(resultProfile);
  if (!validationResult.success) {
      logger.error('Updated profile data failed validation after mapping.', { errors: validationResult.error.flatten() });
      return { error: 'Updated profile data is invalid.' };
  }

  logger.info(`Profile updated successfully for user ID: ${user.id}`);
  return { data: validationResult.data };
}
