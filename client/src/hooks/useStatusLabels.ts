import { useMemo } from "react";

/**
 * useStatusLabels - هوك لتوحيد تسميات وألوان الحالات عبر المنصة
 * الحالات الموحدة: قيد الانتظار - تم التواصل - لم يرد - مؤكد - حضر - مكتمل - ملغي
 */

// === الحالات الموحدة لجميع أنواع الحجوزات ===
export const unifiedStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  contacted: "تم التواصل",
  no_answer: "لم يرد",
  confirmed: "مؤكد",
  attended: "حضر",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const unifiedStatusColors: Record<string, string> = {
  pending: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  no_answer: "bg-gray-100 text-gray-800 border-gray-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  attended: "bg-teal-100 text-teal-800 border-teal-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const unifiedStatusOptions = [
  { value: 'pending', label: 'قيد الانتظار', color: 'bg-blue-500' },
  { value: 'contacted', label: 'تم التواصل', color: 'bg-yellow-500' },
  { value: 'no_answer', label: 'لم يرد', color: 'bg-gray-500' },
  { value: 'confirmed', label: 'مؤكد', color: 'bg-emerald-500' },
  { value: 'attended', label: 'حضر', color: 'bg-teal-500' },
  { value: 'completed', label: 'مكتمل', color: 'bg-green-600' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-500' },
];

// تنسيق وقت الحالة: h:mm ص/م, dd-MM-yyyy
export function formatStatusTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  const h = hours % 12 || 12;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${h}:${minutes} ${ampm}, ${day}-${month}-${year}`;
}

// للتوافق مع الكود القديم
export const leadStatusLabels: Record<string, string> = unifiedStatusLabels;
export const leadStatusColors: Record<string, string> = unifiedStatusColors;

export const campaignStatusLabels: Record<string, string> = {
  draft: "مسودة",
  active: "نشطة",
  paused: "متوقفة",
  completed: "مكتملة",
  cancelled: "ملغاة",
};

export const campaignStatusColors: Record<string, string> = {
  draft: "bg-muted text-foreground",
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const campaignTypeLabels: Record<string, string> = {
  digital: "رقمية",
  field: "ميدانية",
  awareness: "توعوية",
  mixed: "مختلطة",
};

export const appointmentStatusLabels: Record<string, string> = unifiedStatusLabels;
export const appointmentStatusColors: Record<string, string> = unifiedStatusColors;

export const campRegistrationStatusLabels: Record<string, string> = unifiedStatusLabels;
export const campRegistrationStatusColors: Record<string, string> = unifiedStatusColors;

// === أنواع الحالات المدعومة ===
type StatusType = "lead" | "offerLead" | "campaign" | "campaignType" | "appointment" | "campRegistration";

const statusMaps: Record<StatusType, { labels: Record<string, string>; colors: Record<string, string> }> = {
  lead: { labels: unifiedStatusLabels, colors: unifiedStatusColors },
  offerLead: { labels: unifiedStatusLabels, colors: unifiedStatusColors },
  campaign: { labels: campaignStatusLabels, colors: campaignStatusColors },
  campaignType: { labels: campaignTypeLabels, colors: {} },
  appointment: { labels: unifiedStatusLabels, colors: unifiedStatusColors },
  campRegistration: { labels: unifiedStatusLabels, colors: unifiedStatusColors },
};

export function useStatusLabels(type: StatusType) {
  return useMemo(() => {
    const { labels, colors } = statusMaps[type];

    const getLabel = (status: string): string => {
      return labels[status] || status;
    };

    const getColor = (status: string): string => {
      return colors[status] || "bg-muted text-foreground";
    };

    const getBadgeClass = (status: string): string => {
      return colors[status] || "bg-muted text-foreground";
    };

    const getAllStatuses = (): { value: string; label: string }[] => {
      return Object.entries(labels).map(([value, label]) => ({ value, label }));
    };

    return {
      getLabel,
      getColor,
      getBadgeClass,
      getAllStatuses,
      labels,
      colors,
    };
  }, [type]);
}
