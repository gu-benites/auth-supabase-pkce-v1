// src/features/user-profile/components/profile-display.tsx
'use client';

import { useAuth } from '@/features/auth/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle2, Mail, Info, ShieldCheck, Briefcase, CalendarDays, Languages, Edit3 } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Renders the display for the user's profile information.
 * It uses the `useAuth` hook to get the user's session and profile data.
 * Handles loading states, errors, and displays the profile details in a Card component.
 */
export function ProfileDisplay() {
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
    if (!user && !profile) return <UserCircle2 size={24} />;
    const first = profile?.firstName || (user?.user_metadata?.first_name as string)?.[0] || '';
    const last = profile?.lastName || (user?.user_metadata?.last_name as string)?.[0] || '';
    return `${first}${last}`.toUpperCase() || <UserCircle2 size={24} />;
  };
  
  const avatarUrl = profile?.avatarUrl || (user?.user_metadata?.avatar_url as string | undefined);
  const displayName = profile?.firstName || profile?.lastName 
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.email?.split('@')[0] || 'User Profile';

  if (isSessionLoading || (!profile && isLoadingAuth && user)) {
    return (
      <Card className="w-full max-w-2xl mx-auto animate-pulse">
        <CardHeader className="items-center text-center">
          <Skeleton className="h-28 w-28 rounded-full mb-4" />
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-2/3" /></div>
              <div className="space-y-1"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-2/3" /></div>
            </div>
          ))}
        </CardContent>
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
     Sentry.captureMessage('ProfileDisplay: User authenticated but profile data is missing and not loading.', {
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
     Sentry.captureMessage('ProfileDisplay: Profile or User is unexpectedly null/undefined after loading checks.', {
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

  // Helper to render profile items
  const ProfileDetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string | number | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-foreground text-lg">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="text-center bg-muted/30 p-8 rounded-t-lg relative">
         <div className="absolute top-4 right-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/profile/edit"> {/* Placeholder for edit page */}
              <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
            </Link>
          </Button>
        </div>
        <div className="flex justify-center mb-4">
          <Avatar className="h-32 w-32 text-5xl border-4 border-background shadow-lg">
            <AvatarImage src={avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
            </AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-4xl font-bold">{displayName}</CardTitle>
        <CardDescription className="text-md text-muted-foreground">
            Role: {profile.role || 'User'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <ProfileDetailItem icon={Mail} label="Email" value={profile.email} />
          <ProfileDetailItem icon={ShieldCheck} label="User ID" value={profile.id} />
        </div>
        
        {(profile.firstName || profile.lastName) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileDetailItem icon={UserCircle2} label="First Name" value={profile.firstName} />
            <ProfileDetailItem icon={UserCircle2} label="Last Name" value={profile.lastName} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <ProfileDetailItem icon={Languages} label="Preferred Language" value={profile.language} />
            <ProfileDetailItem icon={Info} label="Age Category" value={profile.ageCategory} />
        </div>
        
        {profile.specificAge && (
            <ProfileDetailItem icon={Info} label="Specific Age" value={profile.specificAge} />
        )}

        {profile.subscriptionStatus && (
             <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center"><Briefcase className="h-5 w-5 mr-2 text-primary"/>Subscription Details</h3>
                <div className="p-4 bg-muted/50 rounded-md space-y-2">
                    <p className="text-sm"><span className="font-medium text-foreground">Status:</span> {profile.subscriptionStatus}</p>
                    {profile.subscriptionTier && <p className="text-sm"><span className="font-medium text-foreground">Tier:</span> {profile.subscriptionTier}</p>}
                    {profile.subscriptionPeriod && <p className="text-sm"><span className="font-medium text-foreground">Period:</span> {profile.subscriptionPeriod}</p>}
                    {profile.subscriptionEndDate && <p className="text-sm"><span className="font-medium text-foreground">Renews/Expires:</span> {new Date(profile.subscriptionEndDate).toLocaleDateString()}</p>}
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-border">
          <ProfileDetailItem icon={CalendarDays} label="Profile Created" value={new Date(profile.createdAt).toLocaleDateString()} />
          <ProfileDetailItem icon={CalendarDays} label="Last Updated" value={new Date(profile.updatedAt).toLocaleDateString()} />
        </div>
      </CardContent>
    </Card>
  );
}
