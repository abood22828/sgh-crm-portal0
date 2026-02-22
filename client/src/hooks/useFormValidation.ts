import { useState, useCallback, useMemo } from "react";

/**
 * useFormValidation - هوك للتحقق من صحة النماذج
 * 
 * @param rules - قواعد التحقق لكل حقل
 * @returns { errors, validate, validateField, clearErrors, isValid }
 * 
 * الاستخدام:
 * const { errors, validate, validateField, isValid } = useFormValidation({
 *   title: [
 *     { required: true, message: "العنوان مطلوب" },
 *     { minLength: 3, message: "العنوان يجب أن يكون 3 أحرف على الأقل" },
 *   ],
 *   slug: [
 *     { required: true, message: "الرابط مطلوب" },
 *     { pattern: /^[a-z0-9-]+$/, message: "الرابط يجب أن يحتوي على حروف صغيرة وأرقام و-" },
 *   ],
 *   email: [
 *     { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "البريد الإلكتروني غير صحيح" },
 *   ],
 * });
 * 
 * // عند الإرسال:
 * const handleSubmit = () => {
 *   if (validate(formData)) {
 *     // البيانات صحيحة
 *   }
 * };
 * 
 * // عرض الأخطاء:
 * {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
 */

interface ValidationRule {
  /** الحقل مطلوب */
  required?: boolean;
  /** الحد الأدنى للطول */
  minLength?: number;
  /** الحد الأقصى للطول */
  maxLength?: number;
  /** نمط regex */
  pattern?: RegExp;
  /** الحد الأدنى للقيمة الرقمية */
  min?: number;
  /** الحد الأقصى للقيمة الرقمية */
  max?: number;
  /** دالة تحقق مخصصة */
  custom?: (value: any, formData: Record<string, any>) => boolean;
  /** رسالة الخطأ */
  message: string;
}

type ValidationRules = Record<string, ValidationRule[]>;
type ValidationErrors = Record<string, string>;

export function useFormValidation(rules: ValidationRules) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * التحقق من حقل واحد
   */
  const validateField = useCallback((
    fieldName: string,
    value: any,
    formData: Record<string, any> = {}
  ): string | null => {
    const fieldRules = rules[fieldName];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      // التحقق من المطلوب
      if (rule.required) {
        if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
          return rule.message;
        }
      }

      // لا نتحقق من القواعد الأخرى إذا كانت القيمة فارغة وغير مطلوبة
      if (value === undefined || value === null || value === "") continue;

      // التحقق من الحد الأدنى للطول
      if (rule.minLength !== undefined && typeof value === "string" && value.length < rule.minLength) {
        return rule.message;
      }

      // التحقق من الحد الأقصى للطول
      if (rule.maxLength !== undefined && typeof value === "string" && value.length > rule.maxLength) {
        return rule.message;
      }

      // التحقق من النمط
      if (rule.pattern && typeof value === "string" && !rule.pattern.test(value)) {
        return rule.message;
      }

      // التحقق من الحد الأدنى
      if (rule.min !== undefined && typeof value === "number" && value < rule.min) {
        return rule.message;
      }

      // التحقق من الحد الأقصى
      if (rule.max !== undefined && typeof value === "number" && value > rule.max) {
        return rule.message;
      }

      // التحقق المخصص
      if (rule.custom && !rule.custom(value, formData)) {
        return rule.message;
      }
    }

    return null;
  }, [rules]);

  /**
   * التحقق من جميع الحقول
   */
  const validate = useCallback((formData: Record<string, any>): boolean => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    for (const fieldName of Object.keys(rules)) {
      const error = validateField(fieldName, formData[fieldName], formData);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [rules, validateField]);

  /**
   * التحقق من حقل واحد وتحديث الأخطاء
   */
  const validateSingleField = useCallback((
    fieldName: string,
    value: any,
    formData: Record<string, any> = {}
  ) => {
    const error = validateField(fieldName, value, formData);
    setErrors(prev => {
      if (error) {
        return { ...prev, [fieldName]: error };
      }
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, [validateField]);

  /**
   * مسح جميع الأخطاء
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * مسح خطأ حقل محدد
   */
  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * هل النموذج صالح (لا توجد أخطاء)
   */
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  return {
    errors,
    validate,
    validateField: validateSingleField,
    clearErrors,
    clearFieldError,
    isValid,
  };
}
