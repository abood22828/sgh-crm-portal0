/**
 * Registration sources - منصات التسجيل
 */
export const REGISTRATION_SOURCES = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TELEGRAM: "telegram",
  MANUAL: "manual",
  WEBSITE: "website", // للتوافق مع التسجيلات القديمة
  PHONE: "phone", // للتوافق مع التسجيلات القديمة
} as const;

export type RegistrationSource = typeof REGISTRATION_SOURCES[keyof typeof REGISTRATION_SOURCES];

export const SOURCE_LABELS: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستغرام",
  telegram: "تيليجرام",
  manual: "يدوي",
  website: "موقع الويب", // للتوافق
  phone: "هاتف", // للتوافق
};

export const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  telegram: "#0088CC",
  manual: "#FFA500",
  website: "#0066CC", // للتوافق
  phone: "#00A651", // للتوافق
};
