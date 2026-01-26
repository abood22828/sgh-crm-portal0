/**
 * Registration sources - منصات التسجيل
 */
export const REGISTRATION_SOURCES = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TELEGRAM: "telegram",
  WHATSAPP: "whatsapp",
  WALKIN: "walkin",
  MANUAL: "manual",
  WEBSITE: "website", // للتوافق مع التسجيلات القديمة
  PHONE: "phone", // للتوافق مع التسجيلات القديمة
} as const;

export type RegistrationSource = typeof REGISTRATION_SOURCES[keyof typeof REGISTRATION_SOURCES];

export const SOURCE_LABELS: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  telegram: "تيليجرام",
  whatsapp: "واتساب",
  walkin: "Walk-in",
  manual: "يدوي",
  website: "موقع الويب", // للتوافق
  phone: "هاتف", // للتوافق
};

export const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  telegram: "#0088CC",
  whatsapp: "#25D366",
  walkin: "#9333EA",
  manual: "#FFA500",
  website: "#0066CC", // للتوافق
  phone: "#00A651", // للتوافق
};

/**
 * قائمة المصادر كـ array للاستخدام في dropdowns
 */
export const SOURCE_OPTIONS = Object.entries(SOURCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
