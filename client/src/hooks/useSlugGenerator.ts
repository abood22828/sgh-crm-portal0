import { useCallback, useEffect, useRef } from "react";

/**
 * useSlugGenerator - هوك لتوليد slug تلقائي من النص
 * يدعم العربية والإنجليزية مع تحويل الأحرف العربية إلى transliteration
 * 
 * @param onSlugChange - callback يتم استدعاؤه عند تغيير الـ slug
 * @param options - خيارات إضافية
 * @returns { generateSlug, autoGenerateSlug }
 * 
 * الاستخدام:
 * const { generateSlug, autoGenerateSlug } = useSlugGenerator(
 *   (slug) => setFormData(prev => ({ ...prev, slug })),
 *   { isEditing: !!editingItem }
 * );
 * 
 * // في onChange الخاص بحقل العنوان:
 * onChange={(e) => {
 *   setFormData({ ...formData, title: e.target.value });
 *   autoGenerateSlug(e.target.value);
 * }}
 */

// خريطة الحروف العربية إلى اللاتينية
const arabicToLatinMap: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "aa",
  "ب": "b", "ت": "t", "ث": "th", "ج": "j",
  "ح": "h", "خ": "kh", "د": "d", "ذ": "dh",
  "ر": "r", "ز": "z", "س": "s", "ش": "sh",
  "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "q",
  "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ى": "a",
  "ة": "h", "ء": "", "ئ": "y", "ؤ": "w",
};

/**
 * تحويل النص العربي إلى حروف لاتينية
 */
function transliterateArabic(text: string): string {
  let result = "";
  for (const char of text) {
    if (arabicToLatinMap[char] !== undefined) {
      result += arabicToLatinMap[char];
    } else {
      result += char;
    }
  }
  return result;
}

/**
 * توليد slug من نص (يدعم العربية والإنجليزية)
 */
export function generateSlugFromText(text: string): string {
  if (!text) return "";
  
  // تحويل الحروف العربية إلى لاتينية
  let slug = transliterateArabic(text);
  
  return slug
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")        // استبدال المسافات والـ underscores بـ hyphens
    .replace(/[^a-z0-9-]/g, "")     // إزالة كل شيء ما عدا الحروف والأرقام والـ hyphens
    .replace(/-+/g, "-")            // استبدال الـ hyphens المتعددة بواحد
    .replace(/^-|-$/g, "");         // إزالة الـ hyphens من البداية والنهاية
}

interface UseSlugGeneratorOptions {
  /** هل نحن في وضع التعديل (لا يتم توليد slug تلقائياً) */
  isEditing?: boolean;
  /** هل تم تعديل الـ slug يدوياً (لا يتم الكتابة فوقه) */
  manuallyEdited?: boolean;
}

export function useSlugGenerator(
  onSlugChange: (slug: string) => void,
  options: UseSlugGeneratorOptions = {}
) {
  const { isEditing = false, manuallyEdited = false } = options;
  const manuallyEditedRef = useRef(manuallyEdited);
  
  useEffect(() => {
    manuallyEditedRef.current = manuallyEdited;
  }, [manuallyEdited]);

  /**
   * توليد slug من نص
   */
  const generateSlug = useCallback((text: string): string => {
    return generateSlugFromText(text);
  }, []);

  /**
   * توليد slug تلقائياً وتحديث القيمة
   * لا يعمل في وضع التعديل أو إذا تم تعديل الـ slug يدوياً
   */
  const autoGenerateSlug = useCallback((text: string) => {
    if (isEditing || manuallyEditedRef.current) return;
    const slug = generateSlugFromText(text);
    onSlugChange(slug);
  }, [isEditing, onSlugChange]);

  /**
   * تعيين أن الـ slug تم تعديله يدوياً
   */
  const markAsManuallyEdited = useCallback(() => {
    manuallyEditedRef.current = true;
  }, []);

  /**
   * إعادة تعيين حالة التعديل اليدوي
   */
  const resetManualEdit = useCallback(() => {
    manuallyEditedRef.current = false;
  }, []);

  return {
    generateSlug,
    autoGenerateSlug,
    markAsManuallyEdited,
    resetManualEdit,
  };
}
