// src/features/dashboard/profile/components/profile-banner-uploader.tsx
'use client';

import React, { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks'; // Assuming useImageUpload is a global hook
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default ProfileBannerUploader;