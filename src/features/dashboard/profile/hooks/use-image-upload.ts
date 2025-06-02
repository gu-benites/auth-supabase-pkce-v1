
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadOptions {
  onUpload?: (file: File, dataUrl: string) => void; // Pass File object too
  initialPreviewUrl?: string | null;
}

export function useImageUpload({ onUpload, initialPreviewUrl = null }: UseImageUploadOptions = {}) {
  const previewRef = useRef<string | null>(initialPreviewUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    // Sync with initialPreviewUrl if it changes after mount
    if (initialPreviewUrl !== previewRef.current) {
        if (previewRef.current) {
          URL.revokeObjectURL(previewRef.current); // Clean up old if it was an object URL
        }
        setPreviewUrl(initialPreviewUrl);
        previewRef.current = initialPreviewUrl;
        setFileName(null); // Reset file name as we don't know it from a URL
    }
  }, [initialPreviewUrl]);


  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        // Clean up previous object URL if it exists
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(previewRef.current);
        }
        const dataUrl = URL.createObjectURL(file);
        setPreviewUrl(dataUrl);
        previewRef.current = dataUrl; // Store the new object URL
        if (onUpload) {
         onUpload(file, dataUrl);
        }
      }
    },
    [onUpload],
  );

  const handleRemove = useCallback(() => {
    if (previewRef.current && previewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(previewRef.current);
    }
    setPreviewUrl(null); // Could reset to initialPreviewUrl or always null
    setFileName(null);
    previewRef.current = null; // Or reset to initialPreviewUrl
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    // Optionally call onUpload with null or a specific signal for removal
    // if (onUpload) {
    //   onUpload(null, null); 
    // }
  }, [previewUrl]); // previewUrl was a typo, should be previewRef.current inside the initial if

  // Cleanup on unmount
  useEffect(() => {
    const currentPreview = previewRef.current; // Capture current value for cleanup
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, []); // Empty dependency array means this runs only on unmount

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleTriggerClick,
    handleFileChange,
    handleRemove,
    setPreviewUrlDirectly: setPreviewUrl, // For form reset
  };
}
