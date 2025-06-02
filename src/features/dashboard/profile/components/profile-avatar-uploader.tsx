// src/features/dashboard/profile/components/profile-avatar-uploader.tsx
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import { z } from 'zod';

import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react'; // X might not be needed here, but included from original component
import { useImageUpload } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { UserCircle2 } from 'lucide-react';


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

export { ProfileAvatarUploader };