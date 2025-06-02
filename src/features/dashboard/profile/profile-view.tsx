
// src/features/dashboard/profile/profile-view.tsx
'use client';

import { useAuth } from '@/features/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // CardDescription will be used for role
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label'; // For labels next to values
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, Edit3, UserSquare, Tag, Palette, ShieldAlert, Building } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/**
 * Renders the display for the user's profile information.
 * It uses the `useAuth` hook to get the user's session and profile data.
 * Handles loading states, errors, and displays the profile details in a Card component,
 * with aesthetics inspired by the purchased "Edit Profile" modal template.
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
    if (!user && !profile) return <UserCircle2 size={48} />; // Adjusted for larger avatar
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={48} />;
  };
  
  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  const displayName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  // Skeleton for the new layout
  if (isSessionLoading || (!profile && isLoadingAuth && user)) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-32 bg-muted" /> 
        {/* Avatar and Header Skeleton */}
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-col items-center text-center"> {/* Adjusted margin for larger avatar */}
            <Skeleton className="h-24 w-24 rounded-full border-4 border-background shadow-lg" /> {/* Larger Avatar Skeleton */}
            <Skeleton className="h-7 w-40 mt-4 mb-1" /> {/* Name Skeleton */}
            <Skeleton className="h-4 w-24" /> {/* Role Skeleton */}
          </div>
        </div>
        {/* Content Skeleton (mimicking form structure) */}
        <div className="px-6 pb-6 pt-4 space-y-6">
          <div className="absolute top-4 right-4">
            <Skeleton className="h-8 w-24 rounded-md" /> {/* Edit Button Skeleton */}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full rounded-md" /></div>
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full rounded-md" /></div>
          </div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/4 mb-1" /><Skeleton className="h-8 w-full rounded-md" /></div>
          <Separator className="my-4" />
          <div className="space-y-2"><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-6 w-2/3" /></div>
          <div className="space-y-2"><Skeleton className="h-4 w-1/3 mb-1" /><Skeleton className="h-6 w-2/3" /></div>
        </div>
      </Card>
    );
  }

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
  
  const DetailValueDisplay = ({ value }: { value?: string | number | null | undefined }) => {
    if (value === null || value === undefined || value === '') {
      return <p className="text-sm text-muted-foreground italic bg-muted/30 p-2 rounded-md h-9 flex items-center">Not set</p>;
    }
    return <p className="text-sm text-foreground bg-muted/30 p-2 rounded-md h-9 flex items-center break-words">{value}</p>;
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
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
      {/* Banner (Inspired by ProfileBg) */}
      <div className="h-32 bg-muted relative">
        <img 
            src="https://placehold.co/800x200.png" 
            alt="Profile background" 
            data-ai-hint="abstract waves"
            className="w-full h-full object-cover"
        />
      </div>

      {/* Avatar and Header Info (Inspired by Avatar section of ProfileDialogDemo) */}
      <div className="relative px-6 pb-6">
        <div className="-mt-12 flex flex-col items-center text-center"> {/* Adjusted -mt for larger avatar */}
          <Avatar className="h-24 w-24 text-3xl border-4 border-background shadow-lg bg-muted"> {/* Larger Avatar */}
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold mt-4">{displayName}</h2> {/* Used h2 for name as CardTitle is usually for card header */}
          <p className="text-sm text-muted-foreground mt-1">
              {profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'User'}
          </p>
        </div>
      </div>
      
      {/* Profile Details Content (Inspired by form structure in ProfileDialogDemo) */}
      <div className="px-6 pb-6 pt-2 relative"> {/* Adjusted pt to reduce space if CardHeader is not used */}
        <div className="absolute top-0 right-6"> {/* Positioning edit button */}
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/profile/edit">
                    <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
                </Link>
            </Button>
        </div>

        <div className="space-y-6 mt-8"> {/* Added mt-8 to give space for absolutely positioned button */}
          
          {/* Personal Information Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="firstName" className="text-xs text-muted-foreground uppercase">First Name</Label>
                <DetailValueDisplay value={profile.firstName} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="lastName" className="text-xs text-muted-foreground uppercase">Last Name</Label>
                <DetailValueDisplay value={profile.lastName} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="gender" className="text-xs text-muted-foreground uppercase">Gender</Label>
                <DetailValueDisplay value={profile.gender} />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="language" className="text-xs text-muted-foreground uppercase">Preferred Language</Label>
                <DetailValueDisplay value={profile.language} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="ageCategory" className="text-xs text-muted-foreground uppercase">Age Category</Label>
                  <DetailValueDisplay value={profile.ageCategory} />
                </div>
              {profile.specificAge !== null && profile.specificAge !== undefined && (
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="specificAge" className="text-xs text-muted-foreground uppercase">Specific Age</Label>
                  <DetailValueDisplay value={profile.specificAge} />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Account Information Section */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground uppercase">Email</Label>
              <DetailValueDisplay value={profile.email} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="userId" className="text-xs text-muted-foreground uppercase">User ID</Label>
              <DetailValueDisplay value={profile.id} />
            </div>
             <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="createdAt" className="text-xs text-muted-foreground uppercase">Profile Created</Label>
                  <DetailValueDisplay value={formatProfileDate(profile.createdAt)} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="updatedAt" className="text-xs text-muted-foreground uppercase">Last Updated</Label>
                  <DetailValueDisplay value={formatProfileDate(profile.updatedAt)} />
                </div>
            </div>
          </div>

          {/* Subscription Details Section (Conditional) */}
          {(profile.stripeCustomerId || profile.subscriptionStatus) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground mb-1 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-primary/80"/>Subscription Details
                </h3>
                <div className="p-4 bg-muted/20 rounded-md space-y-2 border border-border/50">
                  {profile.stripeCustomerId && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Stripe ID</Label>
                        <p className="text-xs text-foreground">{profile.stripeCustomerId}</p>
                    </div>
                  )}
                  {profile.subscriptionStatus && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                        <p className={cn("text-xs font-semibold", profile.subscriptionStatus.toLowerCase() === 'active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400')}>{profile.subscriptionStatus}</p>
                    </div>
                  )}
                  {profile.subscriptionTier && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Tier</Label>
                        <p className="text-xs text-foreground">{profile.subscriptionTier}</p>
                    </div>
                  )}
                  {profile.subscriptionPeriod && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Period</Label>
                        <p className="text-xs text-foreground">{profile.subscriptionPeriod}</p>
                    </div>
                  )}
                  {profile.subscriptionEndDate && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Renews/Expires</Label>
                        <p className="text-xs text-foreground">{formatProfileDate(profile.subscriptionEndDate)}</p>
                    </div>
                  )}
                  {profile.subscriptionStartDate && (
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground uppercase">Current Period Start</Label>
                        <p className="text-xs text-foreground">{formatProfileDate(profile.subscriptionStartDate)}</p>
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

    