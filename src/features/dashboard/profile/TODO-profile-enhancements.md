
# TODO: Profile Page Enhancements & Completion

This document outlines the remaining tasks to fully implement the editable user profile page located at `/dashboard/profile`.

## 1. Implement Image Uploads (Avatar & Banner)

- [x] The current implementation allows client-side preview of avatar and banner images, but server-side saving is pending.
- [x] 
-   **Enhance `updateUserProfile` Server Action** (`src/features/user-auth-data/actions/profile.actions.ts`):
- [x] **Process Image Data URIs**
    - [x] Parse the base64 data and file type from the `avatarDataUri` and `bannerDataUri`.
    - [x] Convert the base64 string to a Buffer.
- [x] **Upload Images to Supabase Storage**
    - [x] Implement logic to upload the avatar Buffer to Supabase Storage (`profiles` bucket, `avatars/[userId].[ext]`).
        - [x] Use `upsert: true` to overwrite existing avatar images.
        - [x] Set appropriate `contentType` for the avatar upload.
    - [x] Implement logic to upload the banner Buffer to Supabase Storage (`profiles` bucket, `banners/[userId].[ext]`).
        - [x] Use `upsert: true` to overwrite existing banner images.
        - [x] Set appropriate `contentType` for the banner upload.
    - [x] Retrieve the public URLs for the uploaded avatar and banner images.
- [x] **Update Database with Image URLs**
    - [x] Update the `avatarUrl` field in the `profiles` table with the new avatar public URL.
    - [x] Update the `bannerUrl` field in the `profiles` table with the new banner public URL.
- [ ] **Handle Image Removal**
    - [x] If `avatarDataUri` is explicitly `null`, set `avatarUrl` in the database to `null`.
    - [x] If `bannerDataUri` is explicitly `null`, set `bannerUrl` in the database to `null`.
    - [ ] **(Optional but Recommended)** Add logic to delete the old image files from Supabase Storage when a new image is uploaded or an image is removed. - **PENDING**
- [x] **Implement Robust Error Handling**
    - [x] Add error handling for invalid file formats and sizes during processing/upload.
    - [x] Handle network issues or Supabase Storage API errors during uploads.
    - [x] Ensure errors are returned by the Server Action and displayed on the client-side (e.g., using toasts).

## 2. Refine Input Fields with Select Components

- [ ] Some profile fields are better suited for `Select` dropdowns than free-text `Input` fields.
- [ ] 
-   [ ] **Update `profile-view.tsx`** (`src/features/dashboard/profile/profile-view.tsx`):
    -   Identify fields like `language`, `gender`, `ageCategory` (and potentially `role` if user-editable, or `subscriptionPeriod` if applicable).
    -   Replace their current ShadCN `Input` components with ShadCN `Select` components.
    -   Define and provide appropriate option sets for these select dropdowns (e.g., arrays of objects like `{ value: 'en', label: 'English' }`). These options could be defined as constants.

## 3. Align Database Column Names with Schema (Consistency Check)

## Refactoring ProfileView Component

This section details the refactoring steps taken to break down the large `profile-view.tsx` component into smaller, more manageable parts, improving readability and separation of concerns.

1.  Extracted `ProfileBannerUploader` and `ProfileAvatarUploader` components to `src/features/dashboard/profile/components`.
2.  Extracted `ProfileSubscriptionDetails` and `ProfileAccountInfo` components to `src/features/dashboard/profile/components`.
3.  Updated `profile-view.tsx` to use the new components.
4.  Updated `src/features/dashboard/profile/components/index.ts` to export the new components.


Ensure consistency between your Zod schema, form field names, and actual Supabase database column names.

- [x] **Review and Align** - **COMPLETED**
    -   [x] Verify the column names in your Supabase `profiles` table (e.g., `first_name` vs. `firstName`, `banner_img_url` vs. `bannerUrl`).
    -   [x] Adjust the data mapping in `src/features/user-auth-data/services/profile.service.ts` (for `getProfileByUserId`) to correctly fetch data.
    -   [x] Adjust the data preparation in `src/features/user-auth-data/actions/profile.actions.ts` (for `updateUserProfile`) to correctly map form field names (likely camelCase) to database column names (potentially snake_case) before the update operation. The current action already does some of this; ensure it's comprehensive.
    -   [x] Ensure the `UserProfileSchema` (`src/features/user-auth-data/schemas/profile.schema.ts`) uses field names consistent with what the application logic expects (typically camelCase).
- [x] 3.3 Verify Supabase Schema - **COMPLETED (Manual Check with SQL Definition)**
 - [ ] Use the Supabase CLI (`supabase gen types typescript --project-id <your-project-id> --schema public > src/types/supabase.ts`) to generate TypeScript types from the database schema.
    - [ ] Compare the generated types for the `profiles` table with the `UserProfileSchema` to ensure column name and type consistency.

## 4. Abstract Database Update to Service Layer (Optional Refactor)

## Storage Configuration Verification

- [x] Verify that the Supabase Storage bucket named `profiles` exists and that the Row Level Security (RLS) policies are configured to allow authenticated users to upload images (INSERT/UPDATE) and for files to be publicly readable (SELECT). This was confirmed via manual inspection of the Supabase Dashboard Storage policies after identifying the correct bucket name via SQL query.


For better separation of concerns and adherence to DRY principles, the database update logic can be moved from the Server Action to a dedicated service function.

- [ ] **Create/Update Service Function**:
    - [ ] Create or update a function in `src/features/user-auth-data/services/profile.service.ts` to handle updating the profile record in the Supabase database.
        - [ ] This function should take the user ID and the data to update (in database column name format) as parameters.
        - [ ] It should encapsulate the `supabase.from("profiles").update(...).eq(...)` call.
-   **Refactor Server Action**:
    -   Modify the `updateUserProfile` Server Action in `src/features/user-auth-data/actions/profile.actions.ts` to call this new service function instead of directly interacting with `supabase.from("profiles").update(...)`.

## 5. Enhance User Experience (UX) for Image Uploads

- [ ] Provide clearer feedback to the user during image operations.
- [ ] 
-   [ ] **Update `profile-view.tsx`**:
    -   [ ] **Loading Indicators**: When an image is selected and being prepared/uploaded (i.e., when `mutation.isPending` is true and image data is present), display a loading indicator (e.g., a small spinner overlay) on the `ProfileBannerUploader` and `ProfileAvatarUploader` components.
    - [ ] **Error Display**: Ensure errors related to image uploads (size, type, server failure) are clearly communicated to the user.
        - [ ] Display error messages near the respective uploader components.
        - [ ] Use detailed toasts for transient notifications of upload failures.

## 6. Thorough Testing

Once all functionalities are implemented, conduct comprehensive testing.

-   **Functional Tests**:
    -   [ ] Verify all text-based field updates are saved and correctly re-fetched.
    -   [ ] Test avatar image upload:
        -   [ ] Uploading a new avatar.
        -   [ ] Replacing an existing avatar.
        -   [ ] Removing an avatar.
- [ ] Test banner image upload:
    - [ ] Uploading a new banner.
    - [ ] Replacing an existing banner.
    - [ ] Removing a banner.
- [ ] Test form validation messages for all fields (client-side and server-side).
- [ ] Test the "Cancel" button functionality:
    - [ ] Ensure form fields reset to the last saved state.
    - [ ] Verify client-side image previews are cleared or reverted to the saved image.
- [ ] Test profile creation flow for a new user.
- [ ] Test profile update flow for an existing user.
- [ ] **Error Handling Tests**
    - [ ] Test uploading image files that exceed the defined size limits.
    - [ ] Test uploading image files with incorrect formats.
    - [ ] Simulate network errors during the profile save/image upload process.
    - [ ] Verify server-side validation errors are correctly captured and displayed on the frontend.
-   [ ] **Responsive Design**:
    -   [ ] Check the profile page layout and functionality on various screen sizes.
-   [ ] **Cross-browser Testing (Basic)**:
    -   [ ] Verify functionality in major modern browsers.

By addressing these tasks, the profile page will become a fully functional and robust feature.
