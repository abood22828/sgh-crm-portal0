import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * useImageUpload - هوك لرفع الصور إلى S3 عبر API
 * 
 * @param options - خيارات الرفع
 * @returns { uploading, uploadImage, uploadError }
 * 
 * الاستخدام:
 * const { uploading, uploadImage } = useImageUpload({
 *   folder: "offers",
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   onSuccess: (url) => setFormData(prev => ({ ...prev, imageUrl: url })),
 * });
 * 
 * // في onChange الخاص بحقل الملف:
 * <input type="file" onChange={(e) => {
 *   if (e.target.files?.[0]) uploadImage(e.target.files[0]);
 * }} />
 */

interface UseImageUploadOptions {
  /** المجلد في S3 */
  folder?: string;
  /** الحد الأقصى لحجم الملف (بالبايت) - الافتراضي 5MB */
  maxSize?: number;
  /** الأنواع المسموحة - الافتراضي image/* */
  acceptedTypes?: string[];
  /** callback عند نجاح الرفع */
  onSuccess?: (url: string) => void;
  /** callback عند فشل الرفع */
  onError?: (error: string) => void;
}

interface UploadResult {
  url: string;
  key: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    folder = "uploads",
    maxSize = 5 * 1024 * 1024, // 5MB
    acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
    onSuccess,
    onError,
  } = options;

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /**
   * التحقق من صحة الملف
   */
  const validateFile = useCallback((file: File): string | null => {
    if (!file) return "لم يتم اختيار ملف";
    
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `حجم الملف يجب أن يكون أقل من ${maxSizeMB}MB`;
    }
    
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      return "نوع الملف غير مدعوم. الأنواع المسموحة: " + acceptedTypes.map(t => t.split("/")[1]).join(", ");
    }
    
    return null;
  }, [maxSize, acceptedTypes]);

  /**
   * رفع صورة إلى S3
   */
  const uploadImage = useCallback(async (file: File): Promise<UploadResult | null> => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      toast.error(validationError);
      onError?.(validationError);
      return null;
    }

    setUploading(true);
    setUploadError(null);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "خطأ غير معروف");
        throw new Error(errorText || `فشل الرفع (${response.status})`);
      }

      const result: UploadResult = await response.json();
      
      setProgress(100);
      toast.success("تم رفع الصورة بنجاح");
      onSuccess?.(result.url);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ أثناء رفع الصورة";
      setUploadError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [folder, validateFile, onSuccess, onError]);

  /**
   * رفع عدة صور
   */
  const uploadMultipleImages = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (const file of files) {
      const result = await uploadImage(file);
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }, [uploadImage]);

  return {
    uploading,
    uploadError,
    progress,
    uploadImage,
    uploadMultipleImages,
    validateFile,
  };
}
