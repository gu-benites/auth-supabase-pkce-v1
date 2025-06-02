
// src/features/dashboard/profile/profile-view.tsx
'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form'; // Added Controller
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks';
import { UserProfileSchema, type UserProfile } from '@/features/user-auth-data/schemas';
import { useCharacterLimit, useImageUpload } from '@/hooks'; // Corrected path to global hooks
import { updateUserProfile } from '@/features/user-auth-data/actions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, ImagePlus, X, Save, Loader2, Ban } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const MAX_BIO_LENGTH = 180;

// Form type including client-side data URIs
type ProfileFormValues = UserProfile & {
  avatarDataUri?: string | null;
  bannerDataUri?: string | null;
};

// Extend UserProfileSchema for form validation, making client-side URI fields optional
const ProfileFormSchema = UserProfileSchema.extend({
    avatarDataUri: z.string().optional().nullable(),
    bannerDataUri: z.string().optional().nullable(),
    // Ensure other fields from UserProfileSchema are correctly part of this or the base
});


const ProfileBannerUploader: React.FC<{
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the banner data URI
  defaultImage?: string | null; // URL of the existing banner image
  disabled?: boolean;
}> = ({ control, name, defaultImage, disabled }) => {
  const { toast } = useToast();
  const {
    previewUrl: bannerPreview,
    fileInputRef: bannerFileInputRef,
    handleTriggerClick: handleBannerTriggerClick,
    handleFileChange: handleBannerFileChange,
    handleRemove: handleBannerRemoveVisuals,
    setPreviewUrlDirectly: setBannerPreviewUrlDirectly
  } = useImageUpload({
    initialPreviewUrl: defaultImage,
    onUpload: (file, dataUrl) => {
      if (disabled) return;
      if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Banner image must be less than 5MB.", variant: "destructive" });
        handleBannerRemoveVisuals(); // Clear the faulty preview
        control.setValue(name, null, { shouldDirty: true }); // Clear form value
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
    }
  });

  // Effect to sync the preview URL if defaultImage prop changes (e.g., after profile re-fetch)
   useEffect(() => {
    // Only update if defaultImage is different and current preview isn't a fresh blob
    if (defaultImage !== bannerPreview && !(bannerPreview && bannerPreview.startsWith('blob:'))) {
       setBannerPreviewUrlDirectly(defaultImage || null);
    }
  }, [defaultImage, bannerPreview, setBannerPreviewUrlDirectly]);


  const currentImage = bannerPreview || defaultImage;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => ( // field.onChange will be called by useImageUpload's onUpload
        <div className="h-32 sm:h-40 md:h-48 bg-muted relative group rounded-t-lg overflow-hidden">
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
              data-ai-hint="abstract banner"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" data-ai-hint="abstract pattern gradient">
              <ImagePlus className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          {!disabled && (
            <div
              className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300"
              role="group"
              aria-label="Banner image actions"
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white focus-visible:ring-white"
                onClick={handleBannerTriggerClick}
                aria-label={currentImage ? "Change banner image" : "Upload banner image"}
                disabled={disabled}
              >
                <ImagePlus size={16} strokeWidth={2}/>
              </Button>
              {currentImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white focus-visible:ring-white"
                  onClick={() => {
                    handleBannerRemoveVisuals(); // Clears client-side preview
                    field.onChange(null); // Updates react-hook-form state
                  }}
                  aria-label="Remove banner image"
                  disabled={disabled}
                >
                  <X size={16} strokeWidth={2}/>
                </Button>
              )}
            </div>
          )}
          <input
            type="file"
            ref={bannerFileInputRef}
            onChange={(e) => {
              handleBannerFileChange(e); // This calls onUpload which calls field.onChange
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            id={`${name}-input`} // Ensure unique ID if multiple instances
            disabled={disabled}
          />
        </div>
      )}
    />
  );
};


const ProfileAvatarUploader: React.FC<{
  control: any; // react-hook-form control object
  name: string; // Name of the form field for the avatar data URI
  defaultImage?: string | null; // URL of the existing avatar
  displayName?: string;
  getInitialsFn: () => React.ReactNode;
  disabled?: boolean;
}> = ({ control, name, defaultImage, displayName, getInitialsFn, disabled }) => {
  const { toast } = useToast();
  const {
    previewUrl: avatarPreview,
    fileInputRef: avatarFileInputRef,
    handleTriggerClick: handleAvatarTriggerClick,
    handleFileChange: handleAvatarFileChange,
    handleRemove: handleAvatarRemoveVisuals,
    setPreviewUrlDirectly: setAvatarPreviewUrlDirectly,
  } = useImageUpload({
    initialPreviewUrl: defaultImage,
    onUpload: (file, dataUrl) => { // dataUrl is the blob URI
      if (disabled) return;
       if (file && file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        handleAvatarRemoveVisuals(); // Clear the faulty preview
        control.setValue(name, null, { shouldDirty: true }); // Clear form value
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true }); // Store blob URI
    }
  });

   useEffect(() => {
     if (defaultImage !== avatarPreview && !(avatarPreview && avatarPreview.startsWith('blob:'))) {
        setAvatarPreviewUrlDirectly(defaultImage || null);
     }
  }, [defaultImage, avatarPreview, setAvatarPreviewUrlDirectly]);

  const currentAvatarSrc = avatarPreview || defaultImage;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Default to null for the DataURI field
      render={({ field }) => ( // field.onChange will be called by useImageUpload's onUpload
        <div className="relative -mt-10 sm:-mt-12 flex justify-center">
          <ShadcnAvatar className="h-20 w-20 sm:h-24 sm:w-24 text-3xl border-4 border-background bg-muted shadow-md group">
            <AvatarImage src={currentAvatarSrc || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitialsFn()}
            </AvatarFallback>
            {!disabled && (
                <div
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 cursor-pointer"
                onClick={handleAvatarTriggerClick}
                role="button"
                aria-label="Change profile picture"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarTriggerClick();}}
                >
                <ImagePlus size={20} strokeWidth={2} className="text-white" />
                </div>
            )}
          </ShadcnAvatar>
          <input
            type="file"
            ref={avatarFileInputRef}
            onChange={(e) => {
                handleAvatarFileChange(e); // This calls onUpload which calls field.onChange
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            id={`${name}-input`} // Ensure unique ID
            disabled={disabled}
          />
        </div>
      )}
    />
  );
};


export function ProfileView() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    user,
    profile,
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
  } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileFormSchema),
    defaultValues: profile || {}, // Initialize with fetched profile or empty object
  });

  const bioFormValue = form.watch('bio');
  const {
    value: bioDisplayValue, // This is the value managed by useCharacterLimit
    characterCount: bioCharacterCount,
    handleChange: handleBioChangeInternal, // Internal handler for useCharacterLimit's textarea
    updateValue: updateBioDisplayValue, // To programmatically set useCharacterLimit's value
    maxLength: bioMaxLength,
  } = useCharacterLimit({
    maxLength: MAX_BIO_LENGTH,
    initialValue: profile?.bio || "",
  });

  // Separate state for optimistic UI during submission, can be driven by mutation.isPending
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const mutation = useMutation({
    mutationFn: updateUserProfile,
    onMutate: () => {
        setIsUpdatingProfile(true);
    },
    onSuccess: (result) => {
      if (result.error) {
        toast({ title: "Update Failed", description: result.error, variant: "destructive" });
        Sentry.captureMessage('Profile update failed (server action error)', {
            level: 'error', extra: { userId: user?.id, error: result.error },
        });
      } else if (result.data) {
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
        
        // Reset form with new data, but keep current preview URIs if they were just uploaded
        // The server action for now only returns text fields
        const currentPreviews = {
            avatarDataUri: form.getValues('avatarDataUri'),
            bannerDataUri: form.getValues('bannerDataUri'),
        };
        form.reset({
            ...result.data, // This is the updated text data from server
            avatarDataUri: currentPreviews.avatarDataUri, // Preserve client-side preview if it exists
            bannerDataUri: currentPreviews.bannerDataUri,
        }, { keepValues: false, keepDirty: false, keepDefaultValues: false });

        updateBioDisplayValue(result.data.bio || ""); // Sync useCharacterLimit hook
      } else {
        toast({ title: "Update Incomplete", description: "Profile update returned no data.", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      Sentry.captureException(error, {
        tags: { context: 'profileUpdateMutation' },
        extra: { userId: user?.id },
      });
    },
    onSettled: () => {
      setIsUpdatingProfile(false);
    }
  });


  // Effect to reset form when profile data changes (e.g., after initial load or re-fetch)
  useEffect(() => {
    if (profile) {
      // Ensure all fields from schema are present for reset, defaulting to null for data URIs
      const defaultValuesWithNulls = {
        ...UserProfileSchema.parse(profile), // Ensure all fields from schema are present
        avatarDataUri: null, // These are client-side temporary previews
        bannerDataUri: null,
      };
      form.reset(defaultValuesWithNulls);
      updateBioDisplayValue(profile.bio || ""); // Sync character limit hook
    } else if (user && !isLoadingAuth && !profileError) { // If user exists but no profile yet (e.g. new user)
        // Initialize form with some defaults from user object for a better UX
        form.reset({
            id: user.id,
            email: user.email,
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            // Other fields from UserProfileSchema should default to Zod defaults or null/undefined
            bannerUrl: null,
            bio: "",
            language: "en", // default from schema
            ageCategory: null,
            specificAge: null,
            role: 'user', // default from schema
            createdAt: new Date().toISOString(), // Placeholder, server will manage
            updatedAt: new Date().toISOString(), // Placeholder
            avatarDataUri: null,
            bannerDataUri: null,
        });
        updateBioDisplayValue("");
    }
  }, [profile, user, form, updateBioDisplayValue, isLoadingAuth, profileError]);

  // Effect to keep form's bio in sync with useCharacterLimit hook's internal value
  useEffect(() => {
    // This ensures that if handleBioChangeInternal (from useCharacterLimit) updates bioDisplayValue,
    // the react-hook-form state for 'bio' is also updated.
    if (bioDisplayValue !== bioFormValue) {
      form.setValue('bio', bioDisplayValue, { shouldDirty: true, shouldValidate: true });
    }
  }, [bioDisplayValue, bioFormValue, form]);


  const getInitials = useCallback(() => {
    if (!user && !profile && !form.getValues('firstName')) return <UserCircle2 size={32} />;
    const formValues = form.getValues();
    const first = formValues.firstName || profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = formValues.lastName || profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || <UserCircle2 size={32} />;
  }, [user, profile, form]);


  const currentFormValues = form.watch(); // Watch all form values
  const displayName = currentFormValues.firstName || currentFormValues.lastName
    ? `${currentFormValues.firstName || ''} ${currentFormValues.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';


  const onSubmit = (data: ProfileFormValues) => {
    // For now, we are only submitting text-based fields.
    // Image Data URIs (avatarDataUri, bannerDataUri) are in `data` but not sent to updateUserProfile yet.
    const { avatarDataUri, bannerDataUri, ...profileToUpdate } = data;
    console.log("Form data to submit (text fields only):", profileToUpdate); // Log what's being sent
    mutation.mutate(profileToUpdate as Partial<UserProfile>); // Cast to Partial<UserProfile> as server action expects this
  };

  const handleCancel = () => {
    if (profile) {
      // Reset to the original profile data, clearing any client-side image previews
      form.reset({
        ...profile,
        avatarDataUri: null, // Clear temporary preview
        bannerDataUri: null, // Clear temporary preview
      });
      updateBioDisplayValue(profile.bio || ""); // Reset bio character count
    } else if (user) {
        // Reset to initial user-derived state if no profile existed
         form.reset({
            id: user.id, email: user.email,
            firstName: (user.user_metadata?.first_name as string) || "",
            lastName: (user.user_metadata?.last_name as string) || "",
            avatarUrl: (user.user_metadata?.avatar_url as string) || null,
            bannerUrl: null, bio: "", language: "en", ageCategory: null, specificAge: null,
            role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            avatarDataUri: null, bannerDataUri: null,
        });
        updateBioDisplayValue("");
    }
    toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
  };

  const idPrefix = useId(); // For unique IDs for form elements

  // Use isSessionLoading for the initial full-page skeleton
  if (isSessionLoading) {
    return (
      // Full page skeleton (same as before, matches the new layout structure)
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden animate-pulse">
        <Skeleton className="h-32 sm:h-40 md:h-48 w-full rounded-t-lg" />
        <div className="relative px-6 pb-6 flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-background shadow-lg -mt-10 sm:-mt-12" />
          <Skeleton className="h-7 w-40 mt-4 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
        <CardContent className="px-6 pb-6 pt-0 space-y-6">
          {/* Skeletons for form fields */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-24 w-full rounded-md" /></div>
          {/* Skeletons for buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-6">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessionError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Session Error</AlertTitle><AlertDescription>{sessionError.message || 'An error occurred while loading your session. Please try refreshing.'}</AlertDescription>
      </Alert>
    );
  }

  if (!user && !isSessionLoading) { // If still no user after session loading is complete
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle><AlertDescription>Please log in to view and edit your profile. You may need to refresh the page.</AlertDescription>
      </Alert>
    );
  }

  // If there was a profile loading error after session was confirmed
  if (profileError && user && !profile && !isLoadingAuth) { // Check isLoadingAuth to ensure profile fetch attempt completed
     Sentry.captureMessage('ProfileView: Profile data error on initial load, but user session exists.', {
      level: 'error', extra: { userId: user.id, errorMessage: profileError.message },
    });
    // Allow rendering the form for creation if profile doesn't exist but user does
    toast({
        title: "Profile Data Issue",
        description: `Could not load your existing profile details (${profileError.message}). You can try creating or updating your profile by saving changes.`,
        variant: "destructive", // More assertive for an error
        duration: 7000
    });
  }


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
          {/* Banner Uploader */}
          <ProfileBannerUploader
            control={form.control}
            name="bannerDataUri" // This field in react-hook-form will hold the Data URI
            defaultImage={form.watch('bannerUrl')} // Reads initial URL from profile.bannerUrl
            disabled={mutation.isPending}
          />

          <div className="relative px-6 pb-6 flex flex-col items-center text-center">
            {/* Avatar Uploader */}
            <ProfileAvatarUploader
              control={form.control}
              name="avatarDataUri" // This field in react-hook-form will hold the Data URI
              defaultImage={form.watch('avatarUrl')} // Reads initial URL from profile.avatarUrl
              displayName={displayName}
              getInitialsFn={getInitials}
              disabled={mutation.isPending}
            />
            <CardTitle className="text-2xl font-semibold mt-3">{displayName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {/* Display role from form state, falling back to profile, then 'User' */}
              {currentFormValues.role ? currentFormValues.role.charAt(0).toUpperCase() + currentFormValues.role.slice(1) : (profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User')}
            </CardDescription>
          </div>

          {/* Form Content */}
          <CardContent className="px-6 pb-6 pt-0 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
                {/* First Name and Last Name side-by-side */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-first-name`}>First name</FormLabel>
                        <FormControl>
                          <Input id={`${idPrefix}-first-name`} placeholder="Your first name" {...field} value={field.value || ""} disabled={mutation.isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-last-name`}>Last name</FormLabel>
                        <FormControl>
                          <Input id={`${idPrefix}-last-name`} placeholder="Your last name" {...field} value={field.value || ""} disabled={mutation.isPending}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email (Read-only) */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-email`}>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                              id={`${idPrefix}-email`}
                              type="email"
                              placeholder="your.email@example.com"
                              {...field}
                              value={field.value || user?.email || ""} // Prioritize form, then auth user
                              readOnly // Make it clear it's not editable here
                              disabled // Visually indicate non-interactivity
                              className="pl-10 cursor-not-allowed bg-muted/50" // Style as disabled
                          />
                        </FormControl>
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormDescription>Your email address cannot be changed here.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Biography */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field: formFieldControl }) => ( // Renamed field to avoid conflict
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-bio`}>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          id={`${idPrefix}-bio`}
                          placeholder="Write a few sentences about yourself"
                          value={bioDisplayValue} // Controlled by useCharacterLimit
                          onChange={(e) => {
                              handleBioChangeInternal(e); // Updates useCharacterLimit's state
                              formFieldControl.onChange(e.target.value); // Updates react-hook-form's state
                          }}
                          maxLength={bioMaxLength}
                          className="min-h-[80px] resize-none" // Match template
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormDescription className={cn("text-right text-xs tabular-nums", bioCharacterCount === bioMaxLength ? "text-destructive" : "text-muted-foreground")}>
                        {bioMaxLength - bioCharacterCount} characters left
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator className="my-6 !mt-6 !mb-4"/> {/* Added ! for important spacing */}

                {/* Other profile fields - simplified for now, can use Selects later */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="language" render={({ field }) => (
                      <FormItem className="space-y-2"><FormLabel>Preferred Language</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., English" disabled={mutation.isPending}/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ageCategory" render={({ field }) => (
                      <FormItem className="space-y-2"><FormLabel>Age Category</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Adult" disabled={mutation.isPending}/></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                 <FormField control={form.control} name="specificAge" render={({ field }) => (
                    <FormItem  className="space-y-2"><FormLabel>Specific Age (Optional)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ""} placeholder="Your age" disabled={mutation.isPending}/></FormControl><FormMessage /></FormItem>
                )} />


                {/* Subscription Info (Read-only section) */}
                {(currentFormValues.stripeCustomerId || currentFormValues.subscriptionStatus) && (
                  <>
                    <Separator className="my-6 !mt-6 !mb-4"/>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary/80"/>Subscription Details</h3>
                      <div className="p-4 bg-muted/50 rounded-md space-y-2 text-sm">
                          {currentFormValues.subscriptionStatus && <p><span className="font-medium text-foreground">Status:</span> {currentFormValues.subscriptionStatus}</p>}
                          {currentFormValues.subscriptionTier && <p><span className="font-medium text-foreground">Tier:</span> {currentFormValues.subscriptionTier}</p>}
                          {currentFormValues.subscriptionPeriod && <p><span className="font-medium text-foreground">Period:</span> {currentFormValues.subscriptionPeriod}</p>}
                          {currentFormValues.subscriptionEndDate && <p><span className="font-medium text-foreground">Renews/Expires:</span> {new Date(currentFormValues.subscriptionEndDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Account Info (Read-only section) */}
                <Separator className="my-6 !mt-6 !mb-4"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                   <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center overflow-hidden text-ellipsis whitespace-nowrap">{currentFormValues.id || user?.id || 'N/A'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{currentFormValues.role ? currentFormValues.role.charAt(0).toUpperCase() + currentFormValues.role.slice(1) : 'User'}</p>
                   </div>
                    {currentFormValues.createdAt && <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Created</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(currentFormValues.createdAt).toLocaleDateString()}</p>
                    </div>}
                    {currentFormValues.updatedAt && <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(currentFormValues.updatedAt).toLocaleDateString()}</p>
                    </div>}
                </div>
            </div>
          </CardContent>

          {/* Footer with Save and Cancel buttons */}
          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={mutation.isPending || !form.formState.isDirty}>
              <Ban className="mr-2 h-4 w-4"/> Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}
