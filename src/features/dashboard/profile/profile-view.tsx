
// src/features/dashboard/profile/profile-view.tsx
'use client';

import { useAuth } from '@/features/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, Edit3, Building, UserSquare, Tag, Palette, ShieldAlert } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

/**
 * Renders the display for the user's profile information.
 * It uses the `useAuth` hook to get the user's session and profile data.
 * Handles loading states, errors, and displays the profile details in a Card component.
 * Visuals are inspired by the purchased "Edit Profile" modal template.
 */
export function ProfileView() {
  const {
    user,
    profile,
    isLoadingAuth,
    isSessionLoading,
    sessionError,
    profileError,
    isAuthenticated,
  } = useAuth();

  const getInitials = () => {
    if (!user && !profile) return <UserCircle2 size={32} />; // Larger fallback icon
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={32} />;
  };
  
  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  const displayName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  // Skeleton for the new layout
  if (isSessionLoading || (!profile && isLoadingAuth && user)) {
    return (
      <Card className="w-full max-w-3xl mx-auto shadow-xl rounded-lg overflow-hidden">
        <div className="h-48 bg-muted animate-pulse" /> {/* Banner Skeleton */}
        <div className="relative px-6 pb-6 pt-4">
          <div className="-mt-16 flex flex-col items-center">
            <Skeleton className="h-28 w-28 rounded-full border-4 border-background shadow-lg" />
            <Skeleton className="h-8 w-48 mt-4 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full" /></div>
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full" /></div>
            </div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full" /></div>
            <Separator className="my-6 animate-pulse" />
            <div className="space-y-2"><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-6 w-2/3" /></div>
          </div>
        </div>
      </Card>
    );
  }

  // Error and not authenticated states (remain largely the same logic)
  if (sessionError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Session Error</AlertTitle>
        <AlertDescription>
          {sessionError.message || 'An error occurred while verifying your session.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!user && !isSessionLoading) { 
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Not Authenticated</AlertTitle>
        <AlertDescription>
          Please log in to view your profile. You may be redirected.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (profileError && user) { 
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTitle>Error Loading Profile Data</AlertTitle>
        <AlertDescription>
          {profileError.message || 'An unknown error occurred while fetching your profile details.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!profile && user && !isLoadingAuth) { 
     Sentry.captureMessage('ProfileView: User authenticated but profile data is missing and not loading.', {
        level: 'warning',
        extra: { userId: user.id, profile, isLoadingAuth, isProfileLoading: profileError?.message }
      });
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Profile Not Available</CardTitle>
          <CardDescription>Your profile details could not be loaded at this time.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try refreshing the page or contact support if the issue persists.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!profile || !user) { 
    Sentry.captureMessage('ProfileView: Profile or User is unexpectedly null/undefined after loading checks.', {
      level: 'error',
      extra: { userId: user?.id, profileExists: !!profile, userExists: !!user, isAuthenticated, isLoadingAuth },
    });
    return (
         <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>An unexpected error occurred. Profile data cannot be displayed.</AlertDescription>
        </Alert>
    );
  }

  const DetailValueDisplay = ({ value }: { value?: string | number | null }) => {
    if (value === null || value === undefined || value === '') return <p className="text-sm text-muted-foreground italic">Not set</p>;
    return <p className="text-sm text-foreground break-words">{value}</p>;
  };
  
  const formatProfileDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return "Invalid Date";
    }
  };


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl rounded-lg overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-br from-primary/70 to-accent/70 relative">
        <img
          src="https://placehold.co/1200x300.png"
          alt="Profile banner"
          data-ai-hint="abstract banner"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar and Header Info */}
      <div className="relative px-6 pb-6">
        <div className="-mt-16 flex flex-col items-center text-center">
          <Avatar className="h-28 w-28 text-4xl border-4 border-background shadow-lg bg-muted">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-bold mt-4">{displayName}</CardTitle>
          <CardDescription className="text-md text-muted-foreground mt-1">
              Role: {profile.role || 'User'}
          </CardDescription>
        </div>
        
        <div className="absolute top-4 right-4">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/profile/edit">
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </Link>
            </Button>
        </div>

        {/* Profile Details Content */}
        <div className="mt-8 space-y-8">
          
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <UserSquare className="h-5 w-5 mr-2 text-primary" /> Personal Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground uppercase">First Name</Label>
                  <DetailValueDisplay value={profile.firstName} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground uppercase">Last Name</Label>
                  <DetailValueDisplay value={profile.lastName} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label htmlFor="gender" className="text-xs text-muted-foreground uppercase">Gender</Label>
                  <DetailValueDisplay value={profile.gender} />
                </div>
                 <div className="space-y-1">
                  <Label htmlFor="language" className="text-xs text-muted-foreground uppercase">Preferred Language</Label>
                  <DetailValueDisplay value={profile.language} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label htmlFor="ageCategory" className="text-xs text-muted-foreground uppercase">Age Category</Label>
                  <DetailValueDisplay value={profile.ageCategory} />
                </div>
                {profile.specificAge && (
                  <div className="space-y-1">
                    <Label htmlFor="specificAge" className="text-xs text-muted-foreground uppercase">Specific Age</Label>
                    <DetailValueDisplay value={profile.specificAge} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-primary" /> Account Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs text-muted-foreground uppercase">Email</Label>
                <DetailValueDisplay value={profile.email} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="userId" className="text-xs text-muted-foreground uppercase">User ID</Label>
                <DetailValueDisplay value={profile.id} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1">
                  <Label htmlFor="createdAt" className="text-xs text-muted-foreground uppercase">Profile Created</Label>
                  <DetailValueDisplay value={formatProfileDate(profile.createdAt)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="updatedAt" className="text-xs text-muted-foreground uppercase">Last Updated</Label>
                  <DetailValueDisplay value={formatProfileDate(profile.updatedAt)} />
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details Section (Conditional) */}
          {(profile.stripeCustomerId || profile.subscriptionStatus) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" /> Subscription Details
                </h3>
                <div className="p-4 bg-muted/50 rounded-md space-y-3">
                  {profile.stripeCustomerId && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Stripe Customer ID</Label>
                        <DetailValueDisplay value={profile.stripeCustomerId} />
                    </div>
                  )}
                  {profile.subscriptionStatus && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Status</Label>
                        <DetailValueDisplay value={profile.subscriptionStatus} />
                    </div>
                  )}
                  {profile.subscriptionTier && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Tier</Label>
                        <DetailValueDisplay value={profile.subscriptionTier} />
                    </div>
                  )}
                  {profile.subscriptionPeriod && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Period</Label>
                        <DetailValueDisplay value={profile.subscriptionPeriod} />
                    </div>
                  )}
                  {profile.subscriptionEndDate && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Renews/Expires On</Label>
                        <DetailValueDisplay value={formatProfileDate(profile.subscriptionEndDate)} />
                    </div>
                  )}
                  {profile.subscriptionStartDate && (
                    <div className="flex items-center">
                        <Label className="text-xs text-muted-foreground uppercase w-1/3">Current Period Start</Label>
                        <DetailValueDisplay value={formatProfileDate(profile.subscriptionStartDate)} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

    