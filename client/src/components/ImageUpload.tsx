import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/hooks/useImageUpload";
import { cn } from "@/lib/utils";

/**
 * ImageUpload - مكون رفع الصور مع Drag & Drop ومعاينة
 * 
 * الاستخدام:
 * <ImageUpload
 *   value={formData.imageUrl}
 *   onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
 *   folder="offers"
 *   placeholder="اسحب الصورة هنا أو اضغط للاختيار"
 * />
 */

interface ImageUploadProps {
  /** القيمة الحالية (رابط الصورة) */
  value?: string;
  /** callback عند تغيير القيمة */
  onChange: (url: string) => void;
  /** المجلد في S3 */
  folder?: string;
  /** الحد الأقصى لحجم الملف (بالبايت) */
  maxSize?: number;
  /** نص placeholder */
  placeholder?: string;
  /** تعطيل المكون */
  disabled?: boolean;
  /** إظهار حقل الرابط اليدوي */
  showUrlInput?: boolean;
  /** ارتفاع المعاينة */
  previewHeight?: string;
  /** CSS classes إضافية */
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  maxSize = 5 * 1024 * 1024,
  placeholder = "اسحب الصورة هنا أو اضغط للاختيار",
  disabled = false,
  showUrlInput = true,
  previewHeight = "h-48",
  className,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploading, uploadImage } = useImageUpload({
    folder,
    maxSize,
    onSuccess: (url) => onChange(url),
  });

  const handleFile = useCallback(async (file: File) => {
    if (disabled || uploading) return;
    await uploadImage(file);
  }, [disabled, uploading, uploadImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setDragActive(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
    // Reset input value to allow re-selecting same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFile]);

  const handleManualUrlSubmit = useCallback(() => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl("");
      setShowManualUrl(false);
    }
  }, [manualUrl, onChange]);

  const handleRemove = useCallback(() => {
    onChange("");
  }, [onChange]);

  const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);

  return (
    <div className={cn("space-y-3", className)}>
      {value ? (
        /* معاينة الصورة */
        <div className="relative group">
          <img
            src={value}
            alt="معاينة"
            className={cn(
              "w-full object-cover rounded-lg border border-border",
              previewHeight
            )}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "";
              (e.target as HTMLImageElement).alt = "فشل تحميل الصورة";
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              <span className="mr-1">تغيير</span>
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="mr-1">إزالة</span>
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      ) : (
        /* منطقة الرفع */
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
            (disabled || uploading) && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
              </>
            ) : (
              <>
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{placeholder}</p>
                <p className="text-xs text-muted-foreground/70">
                  الحد الأقصى: {maxSizeMB}MB | الأنواع: JPG, PNG, WebP, GIF
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* خيار إدخال الرابط يدوياً */}
      {showUrlInput && !value && (
        <div className="flex items-center gap-2">
          {showManualUrl ? (
            <div className="flex gap-2 w-full">
              <Input
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                dir="ltr"
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleManualUrlSubmit()}
              />
              <Button type="button" size="sm" onClick={handleManualUrlSubmit} disabled={!manualUrl.trim()}>
                تطبيق
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowManualUrl(false); setManualUrl(""); }}>
                إلغاء
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowManualUrl(true)}
            >
              <ImageIcon className="h-3 w-3 ml-1" />
              أو أدخل رابط الصورة يدوياً
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
