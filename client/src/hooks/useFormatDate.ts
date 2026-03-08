import { useCallback, useMemo } from "react";

/**
 * useFormatDate - هوك لتوحيد تنسيق التاريخ عبر المنصة
 * يمنع تكرار new Date().toLocaleDateString() في كل مكون
 * 
 * الاستخدام:
 * const { formatDate, formatDateTime, formatDateShort, formatRelativeTime } = useFormatDate();
 * 
 * // في الجدول:
 * <td>{formatDate(lead.createdAt)}</td>
 * <td>{formatDateTime(appointment.appointmentDate)}</td>
 */

const LOCALE = "ar-EG";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

const DATE_SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

const DATE_COMPACT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

export function useFormatDate() {
  const formatters = useMemo(() => ({
    date: new Intl.DateTimeFormat(LOCALE, DATE_OPTIONS),
    dateShort: new Intl.DateTimeFormat(LOCALE, DATE_SHORT_OPTIONS),
    dateTime: new Intl.DateTimeFormat(LOCALE, DATE_TIME_OPTIONS),
    dateCompact: new Intl.DateTimeFormat(LOCALE, DATE_COMPACT_OPTIONS),
  }), []);

  /** تنسيق التاريخ الكامل: "23 فبراير 2026" */
  const formatDate = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "-";
    try {
      return formatters.date.format(new Date(date));
    } catch {
      return "-";
    }
  }, [formatters]);

  /** تنسيق التاريخ المختصر: "23 فبر 2026" */
  const formatDateShort = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "-";
    try {
      return formatters.dateShort.format(new Date(date));
    } catch {
      return "-";
    }
  }, [formatters]);

  /** تنسيق التاريخ والوقت: "23 فبراير 2026 02:30 م" */
  const formatDateTime = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "-";
    try {
      return formatters.dateTime.format(new Date(date));
    } catch {
      return "-";
    }
  }, [formatters]);

  /** تنسيق مضغوط: "23/02/2026" */
  const formatDateCompact = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "-";
    try {
      return formatters.dateCompact.format(new Date(date));
    } catch {
      return "-";
    }
  }, [formatters]);

  /** تنسيق نطاق تاريخ: "23 فبراير - 28 فبراير 2026" */
  const formatDateRange = useCallback((from: string | Date | null | undefined, to: string | Date | null | undefined): string => {
    const fromStr = formatDate(from);
    const toStr = formatDate(to);
    if (fromStr === "-" && toStr === "-") return "-";
    if (fromStr === "-") return toStr;
    if (toStr === "-") return fromStr;
    return `${fromStr} - ${toStr}`;
  }, [formatDate]);

  /**
   * تنسيق تاريخ التسجيل: "2:30 PM 23-03-2026"
   * التنسيق المطلوب: h:mm AM/PM dd-MM-yyyy
   */
  const formatRegistrationDate = useCallback((date: string | Date | null | undefined): string => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      const mm = minutes.toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${h}:${mm} ${ampm} ${day}-${month}-${year}`;
    } catch {
      return "-";
    }
  }, []);

  return {
    formatDate,
    formatDateShort,
    formatDateTime,
    formatDateCompact,
    formatDateRange,
    formatRegistrationDate,
  };
}

// === Standalone utility functions (for non-component contexts) ===

export function formatDateUtil(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString(LOCALE, DATE_OPTIONS);
  } catch {
    return "-";
  }
}

export function formatDateTimeUtil(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString(LOCALE, DATE_TIME_OPTIONS);
  } catch {
    return "-";
  }
}

/**
 * دالة مستقلة لتنسيق تاريخ التسجيل: "2:30 PM 23-03-2026"
 * للاستخدام خارج React components
 */
export function formatRegistrationDateUtil(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const mm = minutes.toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${h}:${mm} ${ampm} ${day}-${month}-${year}`;
  } catch {
    return "-";
  }
}
