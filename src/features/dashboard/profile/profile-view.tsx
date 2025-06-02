
// src/features/dashboard/profile/profile-view.tsx
'use client';

import React, { useEffect, useId, useState, useCallback } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Added import for Zod
import { useAuth } from '@/features/auth/hooks';
import { UserProfileSchema, type UserProfile } from '@/features/user-auth-data/schemas';
import { useCharacterLimit, useImageUpload } from '@/hooks'; // Updated import path

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
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, ImagePlus, X, Check, Save, Loader2, Ban } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
// import { updateUserProfile } from '@/features/user-auth-data/actions'; // TODO: To be created
// import { useMutation } from '@tanstack/react-query'; // TODO: To be used for saving

const MAX_BIO_LENGTH = 180; 

// Form type including client-side data URIs
type ProfileFormValues = UserProfile & {
  avatarDataUri?: string | null;
  bannerDataUri?: string | null;
};


const ProfileBannerUploader: React.FC<{
  control: any; 
  name: string; 
  defaultImage?: string | null;
}> = ({ control, name, defaultImage }) => {
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
      if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "Image too large", description: "Banner image must be less than 5MB.", variant: "destructive" });
        handleBannerRemoveVisuals(); 
        control.setValue(name, null, { shouldDirty: true }); 
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
    }
  });

  useEffect(() => {
    if (defaultImage !== bannerPreview && !(bannerPreview && bannerPreview.startsWith('blob:'))) {
       setBannerPreviewUrlDirectly(defaultImage || null);
    }
  }, [defaultImage, bannerPreview, setBannerPreviewUrlDirectly]);


  const currentImage = bannerPreview || defaultImage;

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null} 
      render={({ field }) => (
        <div className="h-32 sm:h-40 md:h-48 bg-muted relative group rounded-t-lg overflow-hidden">
          {currentImage ? (
            <img
              src={currentImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
              data-ai-hint="abstract banner"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" data-ai-hint="abstract gradient pattern">
              <ImagePlus className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
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
                  handleBannerRemoveVisuals();
                  field.onChange(null); 
                }}
                aria-label="Remove banner image"
              >
                <X size={16} strokeWidth={2}/>
              </Button>
            )}
          </div>
          <input
            type="file"
            ref={bannerFileInputRef}
            onChange={(e) => {
              handleBannerFileChange(e); 
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            id={`${name}-input`}
          />
        </div>
      )}
    />
  );
};


const ProfileAvatarUploader: React.FC<{
  control: any; 
  name: string; 
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
    handleRemove: handleAvatarRemoveVisuals,
    setPreviewUrlDirectly: setAvatarPreviewUrlDirectly,
  } = useImageUpload({
    initialPreviewUrl: defaultImage,
    onUpload: (file, dataUrl) => {
       if (file && file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Image too large", description: "Avatar image must be less than 2MB.", variant: "destructive" });
        handleAvatarRemoveVisuals();
        control.setValue(name, null, { shouldDirty: true });
        return;
      }
      control.setValue(name, dataUrl, { shouldDirty: true, shouldValidate: true });
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
      defaultValue={null}
      render={({ field }) => (
        <div className="relative -mt-10 sm:-mt-12 flex justify-center">
          <ShadcnAvatar className="h-20 w-20 sm:h-24 sm:w-24 text-3xl border-4 border-background bg-muted shadow-md group">
            <AvatarImage src={currentAvatarSrc || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitialsFn()}
            </AvatarFallback>
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
          </ShadcnAvatar>
          <input
            type="file"
            ref={avatarFileInputRef}
            onChange={(e) => {
              handleAvatarFileChange(e);
            }}
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            id={`${name}-input`}
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
  } = useAuth();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(UserProfileSchema.extend({
        avatarDataUri: z.string().optional().nullable(), 
        bannerDataUri: z.string().optional().nullable(),
    })),
    defaultValues: profile || {}, // Initialize with profile data or empty object
  });
  
  const bioFormValue = form.watch('bio');
  const {
    value: bioDisplayValue, 
    characterCount: bioCharacterCount,
    handleChange: handleBioChangeInternal, 
    updateValue: updateBioDisplayValue, 
    maxLength: bioMaxLength,
  } = useCharacterLimit({
    maxLength: MAX_BIO_LENGTH,
    initialValue: profile?.bio || "",
  });

  useEffect(() => {
    if (profile) {
      form.reset({ 
        ...profile,
        avatarDataUri: null, 
        bannerDataUri: null,
      });
      updateBioDisplayValue(profile.bio || ""); 
    } else {
      form.reset({ // Reset to empty-like state if no profile
        firstName: "",
        lastName: "",
        email: user?.email || "", // Pre-fill email if available from session
        bio: "",
        language: "en",
        ageCategory: "",
        specificAge: undefined,
        avatarUrl: null,
        bannerUrl: null,
        avatarDataUri: null,
        bannerDataUri: null,
      });
      updateBioDisplayValue("");
    }
  }, [profile, user, form, updateBioDisplayValue]);

  useEffect(() => {
    if (bioDisplayValue !== bioFormValue) {
      form.setValue('bio', bioDisplayValue, { shouldDirty: true, shouldValidate: true });
    }
  }, [bioDisplayValue, bioFormValue, form]);


  const getInitials = useCallback(() => {
    if (!user && !profile) return <UserCircle2 size={32} />;
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={32} />;
  }, [user, profile]);

  const displayName = profile?.firstName || profile?.lastName
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsUpdatingProfile(true);
    console.log("Form data to submit:", data);
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    toast({ title: "Profile Update (Simulated)", description: "Save functionality pending server action. Check console for data." });
    setIsUpdatingProfile(false);
    form.reset(data, { keepValues: true, keepDirty: false, keepDefaultValues: false }); 
  };

  const handleCancel = () => {
    if (profile) {
      form.reset({ 
        ...profile,
        avatarDataUri: null, 
        bannerDataUri: null,
      });
      updateBioDisplayValue(profile.bio || "");
    } else {
      // Reset to a blank state if no initial profile
      form.reset({
        firstName: "", lastName: "", email: user?.email || "", bio: "", 
        language: "en", ageCategory: "", specificAge: undefined,
        avatarUrl: null, bannerUrl: null, avatarDataUri: null, bannerDataUri: null,
      });
      updateBioDisplayValue("");
    }
    toast({ title: "Changes Canceled", description: "Your changes have been discarded."});
  };
  
  const idPrefix = useId(); 

  if (isSessionLoading || (!profile && isLoadingAuth && user && !profileError)) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden animate-pulse">
        <Skeleton className="h-32 sm:h-40 md:h-48 w-full rounded-t-lg" /> 
        <div className="relative px-6 pb-6 flex flex-col items-center text-center">
          <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-background shadow-lg -mt-10 sm:-mt-12" /> 
          <Skeleton className="h-7 w-40 mt-4 mb-1" /> 
          <Skeleton className="h-4 w-24" /> 
        </div>
        <CardContent className="px-6 pb-6 pt-0 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-10 w-full rounded-md" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-24 w-full rounded-md" /></div>
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
        <AlertTitle>Session Error</AlertTitle><AlertDescription>{sessionError.message || 'An error occurred.'}</AlertDescription>
      </Alert>
    );
  }
  
  if (!user && !isSessionLoading) { 
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle><AlertDescription>Please log in.</AlertDescription>
      </Alert>
    );
  }
  
  // If profileError exists and we have a user (meaning we expected a profile but it failed)
  if (profileError && user) { 
    Sentry.captureMessage('ProfileView: Profile data error after loading checks.', {
      level: 'error', extra: { userId: user.id, errorMessage: profileError.message },
    });
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Error Loading Profile</AlertTitle><AlertDescription>{profileError.message || 'Could not load profile data. You can try editing and saving to create one.'}</AlertDescription>
      </Alert>
    );
  }
  // Allow rendering the form even if profile is initially null (e.g., new user, profile creation flow)
  // but we have a user session.

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
          <ProfileBannerUploader
            control={form.control}
            name="bannerDataUri"
            defaultImage={form.watch('bannerUrl')} 
          />
          <div className="px-6 pb-6 pt-0 text-center"> {/* pt-0 to accommodate avatar correctly */}
            <ProfileAvatarUploader
              control={form.control}
              name="avatarDataUri"
              defaultImage={form.watch('avatarUrl')}
              displayName={displayName}
              getInitialsFn={getInitials}
            />
            <CardTitle className="text-2xl font-semibold mt-3">{displayName}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
            </CardDescription>
          </div>

          <CardContent className="px-6 pb-6 pt-4 space-y-6"> {/* pt-4 from ProfileDialogDemo */}
            <div className="space-y-4"> {/* Matching ProfileDialogDemo form structure */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="flex-1 space-y-2">
                        <FormLabel htmlFor={`${idPrefix}-first-name`}>First name</FormLabel>
                        <FormControl>
                          <Input id={`${idPrefix}-first-name`} placeholder="Your first name" {...field} value={field.value || ""} />
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
                          <Input id={`${idPrefix}-last-name`} placeholder="Your last name" {...field} value={field.value || ""}/>
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
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-email`}>Email</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input 
                              id={`${idPrefix}-email`} 
                              type="email" 
                              placeholder="your.email@example.com" 
                              {...field} 
                              value={field.value || user?.email || ""} 
                              readOnly 
                              disabled 
                              className="pl-10 cursor-not-allowed bg-muted/50"
                          />
                        </FormControl>
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      <FormDescription>Your email address cannot be changed here.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field: formField }) => ( 
                    <FormItem className="space-y-2">
                      <FormLabel htmlFor={`${idPrefix}-bio`}>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          id={`${idPrefix}-bio`}
                          placeholder="Write a few sentences about yourself"
                          value={bioDisplayValue} 
                          onChange={(e) => {
                              handleBioChangeInternal(e); 
                              formField.onChange(e.target.value); 
                          }}
                          maxLength={bioMaxLength}
                          className="min-h-[80px] resize-none" // from ProfileDialogDemo
                        />
                      </FormControl>
                      <FormDescription className="text-right text-xs text-muted-foreground tabular-nums">
                        {bioMaxLength - bioCharacterCount} characters left
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Separator className="my-6 !mt-6 !mb-4"/> {/* Adjusted spacing around separator */}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="language" render={({ field }) => (
                      <FormItem className="space-y-2"><FormLabel>Language</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., English" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ageCategory" render={({ field }) => (
                      <FormItem className="space-y-2"><FormLabel>Age Category</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="e.g., Adult" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                {profile?.specificAge !== undefined && ( // Only show if specificAge exists on original profile
                   <FormField control={form.control} name="specificAge" render={({ field }) => (
                      <FormItem  className="space-y-2"><FormLabel>Specific Age</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))} value={field.value ?? ""} placeholder="Your age" /></FormControl><FormMessage /></FormItem>
                  )} />
                )}

                {(profile?.stripeCustomerId || profile?.subscriptionStatus) && (
                  <>
                    <Separator className="my-6 !mt-6 !mb-4"/>
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center"><Briefcase className="h-4 w-4 mr-2 text-primary/80"/>Subscription Details</h3>
                      <div className="p-4 bg-muted/50 rounded-md space-y-2 text-sm">
                          {profile.subscriptionStatus && <p><span className="font-medium text-foreground">Status:</span> {profile.subscriptionStatus}</p>}
                          {profile.subscriptionTier && <p><span className="font-medium text-foreground">Tier:</span> {profile.subscriptionTier}</p>}
                          {profile.subscriptionPeriod && <p><span className="font-medium text-foreground">Period:</span> {profile.subscriptionPeriod}</p>}
                          {profile.subscriptionEndDate && <p><span className="font-medium text-foreground">Renews/Expires:</span> {new Date(profile.subscriptionEndDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </>
                )}

                <Separator className="my-6 !mt-6 !mb-4"/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                   <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center overflow-hidden text-ellipsis whitespace-nowrap">{profile?.id || user?.id || 'N/A'}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}</p>
                   </div>
                    {profile?.createdAt && <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Profile Created</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(profile.createdAt).toLocaleDateString()}</p>
                    </div>}
                    {profile?.updatedAt && <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</p>
                      <p className="text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center">{new Date(profile.updatedAt).toLocaleDateString()}</p>
                    </div>}
                </div>
            </div>
          </CardContent>

          <div className="border-t border-border px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isUpdatingProfile || !form.formState.isDirty}>
              <Ban className="mr-2 h-4 w-4"/> Cancel
            </Button>
            <Button type="submit" disabled={isUpdatingProfile || !form.formState.isDirty}>
              {isUpdatingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </FormProvider>
  );
}

    