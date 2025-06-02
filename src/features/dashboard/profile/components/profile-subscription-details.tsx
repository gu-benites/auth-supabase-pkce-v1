// src/features/dashboard/profile/components/profile-subscription-details.tsx
import React from 'react';
import { Briefcase } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { type UserProfile } from '@/features/user-auth-data/schemas'; // Assuming UserProfile schema is needed for type checking

interface ProfileSubscriptionDetailsProps {
  currentFormValues: UserProfile; // Assuming UserProfile contains subscription fields
}

export const ProfileSubscriptionDetails: React.FC<ProfileSubscriptionDetailsProps> = ({ currentFormValues }) => {
  // Check if any subscription-related fields are present to conditionally render the section
  const hasSubscriptionInfo = currentFormValues.stripeCustomerId ||
                             currentFormValues.subscriptionStatus ||
                             currentFormValues.subscriptionTier ||
                             currentFormValues.subscriptionPeriod ||
                             currentFormValues.subscriptionEndDate;

  if (!hasSubscriptionInfo) {
    return null; // Don't render the section if no subscription info exists
  }

  return (
    <>
      <Separator className="my-6 !mt-6 !mb-4"/>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
          <Briefcase className="h-4 w-4 mr-2 text-primary/80"/>
          Subscription Details
        </h3>
        <div className="p-4 bg-muted/50 rounded-md space-y-2 text-sm">
            {currentFormValues.subscriptionStatus && <p><span className="font-medium text-foreground">Status:</span> {currentFormValues.subscriptionStatus}</p>}
            {currentFormValues.subscriptionTier && <p><span className="font-medium text-foreground">Tier:</span> {currentFormValues.subscriptionTier}</p>}
            {currentFormValues.subscriptionPeriod && <p><span className="font-medium text-foreground">Period:</span> {currentFormValues.subscriptionPeriod}</p>}
            {currentFormValues.subscriptionEndDate && (
              <p>
                <span className="font-medium text-foreground">Renews/Expires:</span>{' '}
                {new Date(currentFormValues.subscriptionEndDate).toLocaleDateString()}
              </p>
            )}
        </div>
      </div>
    </>
  );
};