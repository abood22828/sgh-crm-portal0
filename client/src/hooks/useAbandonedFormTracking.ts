/**
 * useAbandonedFormTracking
 * Hook مشترك لتتبع النماذج المهجورة (الفرص الضائعة)
 * يُستخدم في صفحات الحجز الثلاث: الأطباء، العروض، المخيمات
 */
import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { getCompleteTrackingData } from "@/lib/tracking";

type FormType = "appointment" | "offer" | "camp" | "general";

interface AbandonedFormOptions {
  formType: FormType;
  relatedId?: number;
  relatedName?: string;
  /** دالة تُعيد بيانات النموذج الحالية (اسم + هاتف) */
  getFormData: () => { name?: string; phone?: string };
  /** هل اكتمل الإرسال بنجاح؟ إذا true لا يُسجَّل كنموذج مهجور */
  submitted: boolean;
}

/**
 * يُسجِّل النموذج كـ "مهجور" عند:
 * 1. مغادرة الصفحة (beforeunload)
 * 2. إخفاء الصفحة (visibilitychange → hidden)
 * الشرط: يجب أن يكون الهاتف أو الاسم قد أُدخِل ولم يكتمل الإرسال
 */
export function useAbandonedFormTracking({
  formType,
  relatedId,
  relatedName,
  getFormData,
  submitted,
}: AbandonedFormOptions) {
  const saveAbandonedMutation = trpc.tracking.saveAbandonedForm.useMutation();
  const savedRef = useRef(false);
  const submittedRef = useRef(submitted);

  // تحديث submittedRef عند تغيير submitted
  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  const saveAbandoned = useCallback(() => {
    if (submittedRef.current) return; // اكتمل الإرسال - لا تسجيل
    if (savedRef.current) return; // تم التسجيل مسبقاً

    const { name, phone } = getFormData();
    if (!name && !phone) return; // لم يُدخَل شيء - لا تسجيل

    savedRef.current = true;
    const tracking = getCompleteTrackingData();

    saveAbandonedMutation.mutate({
      formType,
      phone: phone || undefined,
      name: name || undefined,
      relatedId,
      relatedName,
      source: tracking?.source,
      utmSource: tracking?.utmSource,
      utmCampaign: tracking?.utmCampaign,

    });
  }, [formType, relatedId, relatedName, getFormData, saveAbandonedMutation]);

  useEffect(() => {
    const handleBeforeUnload = () => saveAbandoned();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") saveAbandoned();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // عند إلغاء تحميل المكوّن (مثل إغلاق Dialog) نسجّل أيضاً
      saveAbandoned();
    };
  }, [saveAbandoned]);
}
