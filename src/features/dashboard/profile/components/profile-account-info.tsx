// src/features/dashboard/profile/components/profile-account-info.tsx
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { Briefcase, CalendarDays, Languages, UserCircle2 } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/features/user-auth-data/schemas'; // Assuming UserProfile is needed for types

interface ProfileAccountInfoProps {
  currentFormValues: UserProfile;
  user: User | null | undefined; // Include user for fallback data
}

const ProfileAccountInfo: React.FC<ProfileAccountInfoProps> = ({ currentFormValues, user }) => {
  return (
    <>
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
    </>
  );
};

export default ProfileAccountInfo;