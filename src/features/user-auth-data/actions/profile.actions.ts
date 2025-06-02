
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

// Define a type that includes the base Profile and the potential data URI fields
type UpdateProfileData = Partial<UserProfile> & {
  avatarDataUri?: string | null;
  bannerImgDataUri?: string | null;
};

/**
 * Server Action to update the current user's profile information.
 * Handles text-based fields and image uploads (avatar and banner).
 * @returns An object containing the updated profile data or an error message.
 */
export async function updateUserProfile(
  data: UpdateProfileData): Promise<UpdateProfileResult> {
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
    subscriptionStartDate, // Usually managed by billing integration
    subscriptionEndDate, // Usually managed by billing integration
    avatarDataUri, // Handled as base64 for upload
    bannerImgDataUri, // Handled as base64 for upload
    ...updatableData // The rest of the fields are candidates for update
  } = data;
  
  const userDataToUpdate: Record<string, any> = {};

  // Map camelCase updatableData to snake_case for database
  if (updatableData.firstName !== undefined) userDataToUpdate.first_name = updatableData.firstName;
  if (updatableData.lastName !== undefined) userDataToUpdate.last_name = updatableData.lastName;
  if (updatableData.gender !== undefined) userDataToUpdate.gender = updatableData.gender;
  if (updatableData.ageCategory !== undefined) userDataToUpdate.age_category = updatableData.ageCategory;
  if (updatableData.specificAge !== undefined) userDataToUpdate.specific_age = updatableData.specificAge;
  if (updatableData.language !== undefined) userDataToUpdate.language = updatableData.language;
  if (updatableData.bio !== undefined) userDataToUpdate.bio = updatableData.bio;

  // Include other updatable fields if necessary, ensure snake_case mapping
  // For example: if (updatableData.someOtherField !== undefined) userDataToUpdate.some_other_field = updatableData.someOtherField;

  userDataToUpdate.updated_at = new Date().toISOString();

  // --- Handle Avatar Upload ---
  if (avatarDataUri) {
    try {
      // Extract base64 data
      const base64Data = avatarDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid avatar Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = avatarDataUri.substring('data:image/'.length, avatarDataUri.indexOf(';base64'));
      const filePath = `avatars/${user.id}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles') // Assuming 'profiles' is your storage bucket name
        .upload(filePath, buffer, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true, // Overwrite existing file
          contentType: `image/${fileExtension}`
        });

      if (uploadError) throw uploadError;

      // Get public URL - assuming bucket is public or RLS allows public read
      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
        userDataToUpdate.avatar_url = publicUrlData.publicUrl;
        logger.info(`Avatar uploaded successfully for user ID: ${user.id}`);
      } else {
         logger.warn(`Failed to get public URL for avatar for user ID: ${user.id}`);
         // Optionally, return an error or continue without updating the URL
      }

    } catch (uploadError: any) {
      logger.error(`Avatar upload failed for user ID: ${user.id}`, { error: uploadError.message });
      // Decide how to handle image upload errors - returning here prevents profile update
      return { error: `Failed to upload avatar: ${uploadError.message}` };
    }
  } else if (avatarDataUri === null) {
      // If avatarDataUri is explicitly null, it means the user removed the image
      userDataToUpdate.avatar_url = null;
      // TODO: Optionally, delete the old file from storage
  }

  // --- Handle Banner Upload ---
  if (bannerImgDataUri) {
    try {
      // Extract base64 data
      const base64Data = bannerImgDataUri.split(';base64,').pop();
      if (!base64Data) throw new Error("Invalid banner Data URI format.");
      const buffer = Buffer.from(base64Data, 'base64');
      const fileExtension = bannerImgDataUri.substring('data:image/'.length, bannerImgDataUri.indexOf(';base64'));
      const filePath = `banners/${user.id}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles') // Assuming 'profiles' is your storage bucket name (or adjust if you have a 'banners' bucket)
        .upload(filePath, buffer, {
          cacheControl: '3600', // Cache for 1 hour
          upsert: true, // Overwrite existing file
          contentType: `image/${fileExtension}`
        });

      if (uploadError) throw uploadError;

      // Get public URL - assuming bucket is public or RLS allows public read
      const { data: publicUrlData } = supabase.storage.from('profiles').getPublicUrl(filePath);
      if (publicUrlData?.publicUrl) {
 userDataToUpdate.banner_img_url = publicUrlData.publicUrl;
        logger.info(`Banner uploaded successfully for user ID: ${user.id}`);
      } else {
         logger.warn(`Failed to get public URL for banner for user ID: ${user.id}`);
      }

    } catch (uploadError: any) {
      logger.error(`Banner upload failed for user ID: ${user.id}`, { error: uploadError.message });
      return { error: `Failed to upload banner: ${uploadError.message}` };
    }
  } else if (bannerImgDataUri === null) { // If bannerImgDataUri is explicitly null, remove banner
      userDataToUpdate.banner_img_url = null;
  }

  logger.info(`Attempting to update profile for user ID: ${user.id}`, { userDataToUpdate });

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles") // Pass the corrected dataToUpdate object
    .update(userDataToUpdate) // Use the correctly prepared data
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
    bannerImgUrl: updatedProfile.banner_img_url,
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
