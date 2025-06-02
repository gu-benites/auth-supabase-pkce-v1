
import { useCallback, useEffect, useRef, useState } from "react";

interface UseImageUploadOptions {
  onUpload?: (file: File | null, dataUrl: string | null) => void; // Allow null for removal
  initialPreviewUrl?: string | null;
}

export function useImageUpload({ onUpload, initialPreviewUrl = null }: UseImageUploadOptions = {}) {
  const previewRef = useRef<string | null>(initialPreviewUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    // Sync with initialPreviewUrl if it changes after mount or if current preview is a blob and initial is not
    if (initialPreviewUrl !== previewRef.current && !(previewUrl && previewUrl.startsWith('blob:'))) {
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
          URL.revokeObjectURL(previewRef.current); 
        }
        setPreviewUrl(initialPreviewUrl);
        previewRef.current = initialPreviewUrl;
        setFileName(null); 
    }
  }, [initialPreviewUrl, previewUrl]);


  const handleTriggerClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        setFileName(file.name);
        if (previewRef.current && previewRef.current.startsWith('blob:')) {
            URL.revokeObjectURL(previewRef.current);
        }
        const dataUrl = URL.createObjectURL(file);
        setPreviewUrl(dataUrl);
        previewRef.current = dataUrl; 
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
    setPreviewUrl(null); 
    setFileName(null);
    previewRef.current = null; 
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; 
    }
    if (onUpload) {
        onUpload(null, null); // Signal removal
    }
  }, [onUpload]); 

  useEffect(() => {
    const currentPreview = previewRef.current; 
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, []); 

  return {
    previewUrl,
    fileName,
    fileInputRef,
    handleTriggerClick,
    handleFileChange,
    handleRemove,
    setPreviewUrlDirectly: setPreviewUrl, // Expose for external updates if needed
  };
}

    