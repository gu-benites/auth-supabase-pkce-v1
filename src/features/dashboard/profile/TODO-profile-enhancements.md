
# TODO: Profile Page Enhancements & Completion

This document outlines the remaining tasks to fully implement the editable user profile page located at `/dashboard/profile`.

## 1. Implement Image Uploads (Avatar & Banner)

The current implementation allows client-side preview of avatar and banner images, but server-side saving is pending.

-   **Enhance `updateUserProfile` Server Action** (`src/features/user-auth-data/actions/profile.actions.ts`):
    -   **Process `avatarDataUri` and `bannerDataUri`**:
        -   If new Data URIs are provided:
            -   Parse the base64 data from the URI.
            -   Convert the base64 string to a Buffer.
            -   Determine the file type/extension (e.g., `png`, `jpeg`).
            -   Upload the Buffer to Supabase Storage (e.g., using a `profiles` bucket, with paths like `avatars/[userId].[ext]` and `banners/[userId].[ext]`).
                -   Use `upsert: true` to overwrite existing images.
                -   Set appropriate `contentType`.
            -   Retrieve the public URL of the uploaded image from Supabase Storage.
            -   Update the `avatarUrl` and `bannerUrl` fields in the `profiles` table record with these new public URLs.
    -   **Handle Image Removal**:
        -   If `avatarDataUri` or `bannerDataUri` is explicitly `null` (indicating the user wants to remove the image):
            -   Set the corresponding `avatarUrl` or `bannerUrl` in the database to `null`.
            -   **(Optional but Recommended)** Implement logic to delete the old image file from Supabase Storage to free up space and avoid orphaned files.
    -   **Robust Error Handling**:
        -   Implement comprehensive error handling for the image upload process (e.g., invalid file format, file size exceeding limits (enforce on client too), network issues during upload, Supabase Storage API errors).
        -   Ensure these errors are relayed back to the client via the Server Action's response so they can be displayed in toasts.

## 2. Refine Input Fields with Select Components

Some profile fields are better suited for `Select` dropdowns than free-text `Input` fields.

-   **Update `profile-view.tsx`** (`src/features/dashboard/profile/profile-view.tsx`):
    -   Identify fields like `language`, `gender`, `ageCategory` (and potentially `role` if user-editable, or `subscriptionPeriod` if applicable).
    -   Replace their current ShadCN `Input` components with ShadCN `Select` components.
    -   Define and provide appropriate option sets for these select dropdowns (e.g., arrays of objects like `{ value: 'en', label: 'English' }`). These options could be defined as constants.

## 3. Align Database Column Names with Schema (Consistency Check)

Ensure consistency between your Zod schema, form field names, and actual Supabase database column names.

-   **Review and Align**:
    -   Verify the column names in your Supabase `profiles` table (e.g., `first_name` vs. `firstName`, `banner_img_url` vs. `bannerUrl`).
    -   Adjust the data mapping in `src/features/user-auth-data/services/profile.service.ts` (for `getProfileByUserId`) to correctly fetch data.
    -   Adjust the data preparation in `src/features/user-auth-data/actions/profile.actions.ts` (for `updateUserProfile`) to correctly map form field names (likely camelCase) to database column names (potentially snake_case) before the update operation. The current action already does some of this; ensure it's comprehensive.
    -   Ensure the `UserProfileSchema` (`src/features/user-auth-data/schemas/profile.schema.ts`) uses field names consistent with what the application logic expects (typically camelCase).

## 4. Abstract Database Update to Service Layer (Optional Refactor)

For better separation of concerns and adherence to DRY principles, the database update logic can be moved from the Server Action to a dedicated service function.

-   **Create/Update Service Function**:
    -   In `src/features/user-auth-data/services/profile.service.ts`, create or ensure a function like `updateProfileInSupabase(userId: string, dataToUpdate: Partial<UserProfileInDbFormat>)` exists.
        -   This function would encapsulate the `supabase.from("profiles").update(...).eq(...)` call.
        -   `UserProfileInDbFormat` would represent the data with field names matching DB columns.
-   **Refactor Server Action**:
    -   Modify the `updateUserProfile` Server Action in `src/features/user-auth-data/actions/profile.actions.ts` to call this new service function instead of directly interacting with `supabase.from("profiles").update(...)`.

## 5. Enhance User Experience (UX) for Image Uploads

Provide clearer feedback to the user during image operations.

-   **Update `profile-view.tsx`**:
    -   **Loading Indicators**: When an image is selected and being prepared/uploaded (i.e., when `mutation.isPending` is true and image data is present), display a loading indicator (e.g., a small spinner overlay) on the `ProfileBannerUploader` and `ProfileAvatarUploader` components.
    -   **Error Display**: Ensure errors related to image uploads (size, type, server failure) are clearly communicated, possibly near the uploader component or via detailed toasts.

## 6. Thorough Testing

Once all functionalities are implemented, conduct comprehensive testing.

-   **Functional Tests**:
    -   Verify all text-based field updates are saved and correctly re-fetched.
    -   Test avatar image upload:
        -   Uploading a new avatar.
        -   Replacing an existing avatar.
        -   Removing an avatar.
    -   Test banner image upload (similar scenarios as avatar).
    -   Test form validation messages for all fields.
    -   Test the "Cancel" button: ensure form resets correctly to last saved state, and image previews are cleared/reverted.
    -   Test behavior for a new user creating their profile for the first time versus an existing user updating their profile.
-   **Error Handling Tests**:
    -   Attempt to upload files that are too large or of incorrect types.
    -   Simulate network errors during save/upload if possible.
    -   Verify server-side validation errors are displayed correctly.
-   **Responsive Design**:
    -   Check the profile page layout and functionality on various screen sizes.
-   **Cross-browser Testing (Basic)**:
    -   Verify functionality in major modern browsers.

By addressing these tasks, the profile page will become a fully functional and robust feature.
