import { useMemo } from "react";

/**
 * useStatusLabels - هوك لتوحيد تسميات وألوان الحالات عبر المنصة
 * يمنع تكرار تعريف الحالات في كل مكون
 * 
 * الاستخدام:
 * const { getLabel, getColor, getBadgeClass, getIcon } = useStatusLabels("lead");
 * 
 * // في الجدول:
 * <Badge className={getBadgeClass(lead.status)}>{getLabel(lead.status)}</Badge>
 */

// === تعريفات الحالات لكل نوع ===

export const leadStatusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  booked: "تم الحجز",
  not_interested: "غير مهتم",
  no_answer: "لا يرد",
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const leadStatusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  booked: "bg-green-100 text-green-800 border-green-200",
  not_interested: "bg-red-100 text-red-800 border-red-200",
  no_answer: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

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

export const appointmentStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  cancelled: "ملغي",
  completed: "مكتمل",
};

export const appointmentStatusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

export const campRegistrationStatusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  attended: "حضر",
  cancelled: "ملغي",
};

export const campRegistrationStatusColors: Record<string, string> = {
  pending: "bg-orange-100 text-orange-800 border-orange-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  attended: "bg-blue-100 text-blue-800 border-blue-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

// === أنواع الحالات المدعومة ===
type StatusType = "lead" | "offerLead" | "campaign" | "campaignType" | "appointment" | "campRegistration";

const statusMaps: Record<StatusType, { labels: Record<string, string>; colors: Record<string, string> }> = {
  lead: { labels: leadStatusLabels, colors: leadStatusColors },
  offerLead: { labels: leadStatusLabels, colors: leadStatusColors },
  campaign: { labels: campaignStatusLabels, colors: campaignStatusColors },
  campaignType: { labels: campaignTypeLabels, colors: {} },
  appointment: { labels: appointmentStatusLabels, colors: appointmentStatusColors },
  campRegistration: { labels: campRegistrationStatusLabels, colors: campRegistrationStatusColors },
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
