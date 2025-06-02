# Profile Image Upload and Update Checklist

This checklist outlines the steps to fully implement the avatar and banner image upload functionality and integrate it with the user profile updates in the `updateUserProfile` server action. It follows a chronological order for implementation, building upon the existing code and test coverage.

## 1. Enhance `updateUserProfile` Server Action for Robust Image Handling

This involves refining the server-side logic to handle image uploads, updates, removals, and associated storage cleanup.

- [ ] **1.1 Implement Old Image Deletion Logic**
    - [ ] **1.1.1 Refactor Image Upload Logic to Include Pre-Upload Deletion Check**
        - [ ] Modify the avatar upload block in `updateUserProfile`.
            - [ ] Before uploading a new avatar (`if (avatarDataUri)`), check if the user currently has an `avatar_url` stored in their profile in the database. This likely requires fetching the current profile data first.
            - [ ] If an `avatar_url` exists, extract the file path from the URL.
            - [ ] Implement logic to delete the old avatar file from the 'profiles' Supabase Storage bucket using `supabase.storage.from('profiles').remove([filePath])`.
            - [ ] Add basic error handling for the deletion process (e.g., log errors, but don't necessarily fail the entire update).
        - [ ] Modify the banner upload block in `updateUserProfile`.
            - [ ] Before uploading a new banner (`if (bannerImgDataUri)`), check if the user currently has a `banner_img_url` stored in their profile in the database.
            - [ ] If a `banner_img_url` exists, extract the file path from the URL.
            - [ ] Implement logic to delete the old banner file from the 'profiles' Supabase Storage bucket using `supabase.storage.from('profiles').remove([filePath])`.
            - [ ] Add basic error handling for the deletion process.
    - [ ] **1.1.2 Implement Deletion Logic for Image Removal (Setting URL to null)**
        - [ ] Modify the avatar removal block (`else if (avatarDataUri === null)`).
            - [ ] Fetch the current user profile to get the existing `avatar_url`.
            - [ ] If an `avatar_url` exists, extract the file path from the URL.
            - [ ] Implement logic to delete the avatar file from the 'profiles' bucket using `supabase.storage.from('profiles').remove([filePath])`.
            - [ ] Add basic error handling for the deletion process.
        - [ ] Modify the banner removal block (`else if (bannerImgDataUri === null)`).
            - [ ] Fetch the current user profile to get the existing `banner_img_url`.
            - [ ] If a `banner_img_url` exists, extract the file path from the URL.
            - [ ] Implement logic to delete the banner file from the 'profiles' bucket using `supabase.storage.from('profiles').remove([filePath])`.
            - [ ] Add basic error handling for the deletion process.

- [ ] **1.2 Refine Error Handling within `updateUserProfile`**
    - [ ] **1.2.1 Ensure Comprehensive Error Reporting**
        - [ ] Review existing `try...catch` blocks for image uploads.
        - [ ] Ensure error objects from Supabase Storage (`uploadError`, `removeError`) are logged with sufficient detail (e.g., error message, relevant file path, user ID).
        - [ ] Ensure user-friendly error messages are returned by the action for client-side display.
    - [ ] **1.2.2 Decide Error Handling Strategy**
        - [ ] Confirm whether a failed image upload or deletion should prevent the entire profile update from saving other text fields. (Current code prevents the whole update on upload failure). Maintain this or adjust as required.

## 2. Update Client-side Components for Enhanced UX

Improve the user experience during the image upload and update process.

- [ ] **2.1 Implement Loading Indicators**
    - [ ] **2.1.1 Add Loading State to Uploaders**
        - [ ] Pass the `mutation.isPending` state from `profile-view.tsx` down to `ProfileAvatarUploader` and `ProfileBannerUploader` components.
        - [ ] In `ProfileAvatarUploader`, display a loading spinner or visual indicator when `disabled` is true (derived from `isPending`) and an image is being processed/uploaded (perhaps by checking for a pending state within the `useImageUpload` hook or passing an explicit `isUploading` prop).
        - [ ] In `ProfileBannerUploader`, display a loading spinner or visual indicator under similar conditions.
- [ ] **2.2 Enhance Error Display**
    - [ ] **2.2.1 Improve In-Form Error Feedback**
        - [ ] If possible, display image-specific validation or upload errors directly near the avatar and banner uploader components, in addition to toasts. This might require receiving more granular error details from the server action or performing more validation client-side.
        - [ ] Ensure toasts provide clear and actionable messages for upload failures.

## 3. Update and Expand Test Coverage

Ensure the new image handling logic is adequately tested.

- [ ] **3.1 Enhance Existing Storage Tests**
    - [ ] **3.1.1 Update Mocks for Deletion**
        - [ ] Enhance the mocks in relevant test files (e.g., `profile.storage.test.ts`) to include the `remove` method of the Supabase Storage mock.
        - [ ] Create mock scenarios where an existing file is assumed to exist before an upload or removal.
    - [ ] **3.1.2 Add Tests for Old Image Deletion**
        - [ ] Write a test case for `updateUserProfile` that simulates uploading a new avatar when an old one exists and verifies that `supabase.storage.from('profiles').remove` was called with the correct path for the old avatar.
        - [ ] Write a test case for `updateUserProfile` that simulates uploading a new banner when an old one exists and verifies that `supabase.storage.from('profiles').remove` was called with the correct path for the old banner.
        - [ ] Write a test case for `updateUserProfile` that simulates removing an avatar (setting `avatarDataUri` to `null`) when an avatar exists and verifies that `supabase.storage.from('profiles').remove` was called with the correct path.
        - [ ] Write a test case for `updateUserProfile` that simulates removing a banner (setting `bannerImgDataUri` to `null`) when a banner exists and verifies that `supabase.storage.from('profiles').remove` was called with the correct path.
        - [ ] Add tests for error handling during the deletion process.
- [ ] **3.2 Manual End-to-End Testing**
    - [ ] **3.2.1 Perform Comprehensive UI Testing**
        - [ ] Test uploading new avatar and banner images.
        - [ ] Test replacing existing avatar and banner images.
        - [ ] Test removing avatar and banner images.
        - [ ] Verify that the displayed images update correctly after saving.
        - [ ] Verify that updating other profile fields (text inputs) still works correctly alongside image updates.
        - [ ] Test with different image file types and sizes (within limits).
        - [ ] Test error scenarios (too large file, wrong type) to ensure correct feedback.

## 4. Final Review and Cleanup

- [ ] **4.1 Code Review**
    - [ ] Review the changes in `profile.actions.ts` and the uploader components for clarity, correctness, and adherence to best practices.
- [ ] **4.2 Documentation**
    - [ ] Update any relevant documentation (including the `TODO-profile-enhancements.md` file) to reflect the completed tasks.