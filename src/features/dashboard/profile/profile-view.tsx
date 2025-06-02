
// src/features/dashboard/profile/profile-view.tsx
'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link'; // Keep Link if "Cancel" navigates away, or remove if it just resets
import { useAuth } from '@/features/auth/hooks';
import { UserProfileSchema, type UserProfile } from '@/features/user-auth-data/schemas';
import { useCharacterLimit, useImageUpload } from './hooks';

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
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, ImagePlus, X, Edit3, Check, Save, Loader2, Ban } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
// import { updateUserProfile } from '@/features/user-auth-data/actions'; // TODO: To be created
// import { useMutation } from '@tanstack/react-query'; // TODO: To be used for saving

const MAX_BIO_LENGTH = 180; // Consistent with schema

// Helper component for Profile Banner, adapted from template's ProfileBg
const ProfileBannerUploader: React.FC<{
  control: any; // react-hook-form control
  name: string; // form field name e.g., "bannerDataUri"
  defaultImage?: string | null;
}> = ({ control, name, defaultImage }) => {
  const { toast } = useToast();
  const {
    previewUrl: bannerPreview,
    fileInputRef: bannerFileInputRef,
    handleTriggerClick: handleBannerTriggerClick,
    handleFileChange: handleBannerFileChange,
    handleRemove: handleBannerRemove,
    setPreviewUrlDirectly: setBannerPreviewUrlDirectly
  } = useImageUpload({
    initialPreviewUrl: defaultImage,
    onUpload: (file, dataUrl) => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Banner image must be less than 5MB.", variant: "destructive" });
        handleBannerRemove(); // Or setPreviewUrlDirectly(defaultImage)
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
    }
  });

  useEffect(() => {
    setBannerPreviewUrlDirectly(defaultImage || null);
  }, [defaultImage, setBannerPreviewUrlDirectly]);

  const currentImage = bannerPreview || defaultImage;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} // Or defaultImage if you want to submit it if unchanged
      render={({ field }) => (
        <div className="h-40 sm:h-48 md:h-56 bg-muted relative group">
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10" data-ai-hint="abstract gradient">
              <ImagePlus className="w-12 h-12 text-muted-foreground/50" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white"
              onClick={handleBannerTriggerClick}
              aria-label={currentImage ? "Change banner image" : "Upload banner image"}
            >
              <ImagePlus size={18} />
            </Button>
            {currentImage && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="z-10 rounded-full bg-black/60 text-white hover:bg-black/80 border-white/50 hover:border-white"
                onClick={() => {
                  handleBannerRemove();
                  field.onChange(null); // Clear form value
                  setBannerPreviewUrlDirectly(null); // And visual preview explicitly to placeholder
                }}
                aria-label="Remove banner image"
              >
                <X size={18} />
              </Button>
            )}
          </div>
          <input
            type="file"
            ref={bannerFileInputRef}
            onChange={(e) => {
              handleBannerFileChange(e);
              // RHF Controller's field.onChange will be called by useImageUpload's onUpload
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
        </div>
      )}
    />
  );
};


// Helper component for Profile Avatar, adapted from template's Avatar
const ProfileAvatarUploader: React.FC<{
  control: any; // react-hook-form control
  name: string; // form field name e.g., "avatarDataUri"
  defaultImage?: string | null;
  displayName?: string;
  getInitialsFn: () => React.ReactNode;
}> = ({ control, name, defaultImage, displayName, getInitialsFn }) => {
  const { toast } = useToast();
  const {
    previewUrl: avatarPreview,
    fileInputRef: avatarFileInputRef,
    handleTriggerClick: handleAvatarTriggerClick,
    handleFileChange: handleAvatarFileChange,
    setPreviewUrlDirectly: setAvatarPreviewUrlDirectly
    // handleRemove for avatar is not in the template, but could be added
  } = useImageUpload({
    initialPreviewUrl: defaultImage,
    onUpload: (file, dataUrl) => {
       if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        // Potentially revert preview: setAvatarPreviewUrlDirectly(defaultImage)
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
    }
  });

  useEffect(() => {
    setAvatarPreviewUrlDirectly(defaultImage || null);
  }, [defaultImage, setAvatarPreviewUrlDirectly]);

  const currentAvatarSrc = avatarPreview || defaultImage;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({ field }) => ( // field is not directly used for value, but Controller needs render
        <div className="relative">
          <ShadcnAvatar className="h-24 w-24 text-3xl border-4 border-background shadow-lg bg-muted group">
            <AvatarImage src={currentAvatarSrc || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitialsFn()}
            </AvatarFallback>
            <div
              className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={handleAvatarTriggerClick}
              role="button"
              aria-label="Change profile picture"
            >
              <ImagePlus size={24} className="text-white" />
            </div>
          </ShadcnAvatar>
          <input
            type="file"
            ref={avatarFileInputRef}
            onChange={(e) => {
              handleAvatarFileChange(e);
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
          />
        </div>
      )}
    />
  );
};


export function ProfileView() {
  const { toast } = useToast();
  const {
    user,
    profile,
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
    isAuthenticated,
  } = useAuth();

  const form = useForm<UserProfile & { avatarDataUri?: string | null, bannerDataUri?: string | null }>({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: profile || {}, // Initialize with profile data
  });

  const bioValue = form.watch('bio');
  const {
    characterCount: bioCharacterCount,
    handleChange: handleBioChangeInternal,
    updateValue: updateBioValue,
    maxLength: bioMaxLength,
  } = useCharacterLimit({
    maxLength: MAX_BIO_LENGTH,
    initialValue: profile?.bio || "",
  });

  // Sync react-hook-form with useCharacterLimit for bio
  useEffect(() => {
    form.setValue('bio', bioValue || '');
  }, [bioValue, form]);

  // Sync useCharacterLimit with react-hook-form if profile changes (e.g., after save & refetch)
  useEffect(() => {
    if (profile?.bio) {
      updateBioValue(profile.bio);
    }
     // Reset form with new profile data when it changes (e.g., after saving)
    if (profile) {
      form.reset({
        ...profile,
        avatarDataUri: null, // Don't repopulate DataURIs from profile URLs
        bannerDataUri: null,
      });
    }
  }, [profile, form, updateBioValue]);


  const getInitials = useCallback(() => {
    if (!user && !profile) return <UserCircle2 size={48} />;
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={48} />;
  }, [user, profile]);

  const displayName = profile?.firstName || profile?.lastName
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';


  // const { mutate: updateProfile, isPending: isUpdatingProfile } = useMutation({ // TODO
  //   mutationFn: async (data: UserProfile & { avatarDataUri?: string | null, bannerDataUri?: string | null }) => {
  //     // return updateUserProfile(data); // TODO: Implement this server action
  //     console.log("Submitting data:", data);
  //     await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
  //     // throw new Error("Simulated save error!");
  //     return { success: true, message: "Profile updated successfully!" };
  //   },
  //   onSuccess: (data) => {
  //     toast({ title: "Success", description: data.message });
  //     // queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] }); // TODO
  //   },
  //   onError: (error) => {
  //     toast({ title: "Error", description: error.message, variant: "destructive" });
  //     Sentry.captureException(error, { extra: { component: "ProfileView", stage: "updateMutation" } });
  //   },
  // });


  const onSubmit = async (data: UserProfile & { avatarDataUri?: string | null, bannerDataUri?: string | null }) => {
    console.log("Form data to submit:", data);
    toast({ title: "Profile Update", description: "Save functionality not yet implemented. Check console for data." });
    // updateProfile(data); // TODO: Uncomment when server action is ready
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({ // Reset to the original profile data
        ...profile,
        avatarDataUri: null, // Clear any temporary client-side image selections
        bannerDataUri: null,
      });
      updateBioValue(profile.bio || ""); // Reset bio hook as well
      // Also reset useImageUpload previews explicitly if they don't reset via defaultImage prop change
      // This might require exposing a reset function from useImageUpload or setting previewUrl directly to initial/default.
      // For now, relying on useEffect in uploader components to reset to defaultImage.
    }
    toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
  };
  
  const id = useId(); // For unique form element IDs

  if (isSessionLoading || (!profile && isLoadingAuth && user)) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden animate-pulse">
        <div className="h-48 bg-muted" />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full border-4 border-background shadow-lg" />
            <Skeleton className="h-7 w-40 mt-4 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="px-6 pb-6 pt-4 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-24 w-full rounded-md" /></div>
          <div className="flex justify-end gap-2 pt-4">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </Card>
    );
  }
  // Error and not authenticated states (unchanged)
  if (sessionError) { /* ... */ }
  if (!user && !isSessionLoading) { /* ... */ }
  if (profileError && user) { /* ... */ }
  if (!profile && user && !isLoadingAuth) { /* ... */ }
  if (!profile || !user) { /* ... */ }


  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
          <ProfileBannerUploader
            control={form.control}
            name="bannerDataUri"
            defaultImage={profile?.bannerUrl}
          />
          <div className="relative px-6 pb-6">
            <div className="-mt-12 flex flex-col items-center text-center">
              <ProfileAvatarUploader
                control={form.control}
                name="avatarDataUri"
                defaultImage={profile?.avatarUrl}
                displayName={displayName}
                getInitialsFn={getInitials}
              />
              <h2 className="text-2xl font-semibold mt-4">{displayName}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel htmlFor={`${id}-first-name`}>First Name</FormLabel>
                      <FormControl>
                        <Input id={`${id}-first-name`} placeholder="Your first name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel htmlFor={`${id}-last-name`}>Last Name</FormLabel>
                      <FormControl>
                        <Input id={`${id}-last-name`} placeholder="Your last name" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${id}-email`}>Email</FormLabel>
                    <FormControl>
                      <Input id={`${id}-email`} type="email" placeholder="your.email@example.com" {...field} value={field.value || ""} readOnly disabled className="cursor-not-allowed bg-muted/50"/>
                    </FormControl>
                    <FormDescription>Your email address cannot be changed here.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor={`${id}-bio`}>Biography</FormLabel>
                    <FormControl>
                      <Textarea
                        id={`${id}-bio`}
                        placeholder="Write a few sentences about yourself"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e); // RHF's onChange
                          handleBioChangeInternal(e); // Character limit hook's onChange
                        }}
                        maxLength={bioMaxLength}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormDescription className="text-right">
                      {bioMaxLength - bioCharacterCount} characters left
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Placeholder for other fields like language, gender, ageCategory, specificAge */}
              <Separator/>
              <p className="text-sm text-muted-foreground">Additional details (gender, language, age) can be added here as editable fields.</p>
              
              {/* Display non-editable fields */}
               <div className="space-y-2 pt-2">
                  <Label className="text-xs text-muted-foreground uppercase">User ID</Label>
                  <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{profile.id}</p>
               </div>
               <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Profile Created</Label>
                    <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(profile.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs text-muted-foreground uppercase">Last Updated</Label>
                    <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                  </div>
              </div>


              {/* Subscription Details Section (Non-editable view) */}
              {(profile.stripeCustomerId || profile.subscriptionStatus) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-foreground mb-1 flex items-center">
                      <Briefcase className="h-4 w-4 mr-2 text-primary/80"/>Subscription Details
                    </h3>
                     {/* Display subscription details here as read-only */}
                  </div>
                </>
              )}

            </div>
          </div>

          <div className="border-t border-border px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={false /* TODO: isUpdatingProfile*/}>
              <Ban className="mr-2 h-4 w-4"/> Cancel
            </Button>
            <Button type="submit" disabled={false /* TODO: isUpdatingProfile*/ || !form.formState.isDirty}>
              {false /* TODO: isUpdatingProfile*/ ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}
