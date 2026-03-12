/**
 * MetaPixel - مكوّن Meta Pixel (النسخة المحسّنة)
 *
 * سياسة التتبع (وفق توجيهات Meta لمزودي الرعاية الصحية):
 * ─────────────────────────────────────────────────────────
 * • PageView: يُرسَل لجميع زوار الواجهة العامة فور تحميل الصفحة
 * • صفحات الداشبورد (/dashboard/*): مُستثناة تماماً (زوارها موظفون)
 * • أحداث التحويل (Lead, ViewContent, ...): تُرسَل فقط عند موافقة المستخدم
 *   على الكوكيز التسويقية
 * • Advanced Matching: يُرسَل hash الهاتف/الإيميل من المتصفح لرفع EMQ
 * • Deduplication: يُمرَّر eventId موحّد من الواجهة إلى CAPI
 * • لا تُرسَل أي بيانات طبية حساسة (تشخيصات، أدوية، حالات مرضية)
 *
 * يستخدم VITE_META_PIXEL_ID من متغيرات البيئة.
 * يُضاف مرة واحدة في App.tsx ليعمل على جميع صفحات الموقع.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fbq: any;
    FB_PIXEL_LOADED?: boolean;
  }
}

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined) || "";

// مفاتيح localStorage — يجب أن تتطابق مع CookieConsentBanner.tsx
const COOKIE_CONSENT_KEY = "sgh_cookie_consent";
const COOKIE_PREFS_KEY = "sgh_cookie_preferences";

// ─── مسارات الداشبورد المُستثناة من التتبع ────────────────────────────────────
// هذه الصفحات يزورها الموظفون فقط وليس الجمهور العام
const DASHBOARD_PREFIX = "/dashboard";

/** تحقق مما إذا كان المسار الحالي صفحة داشبورد (موظفين فقط) */
function isDashboardPath(path: string): boolean {
  return path.startsWith(DASHBOARD_PREFIX);
}

/** تحقق من موافقة المستخدم على الكوكيز التسويقية */
function hasMarketingConsent(): boolean {
  try {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) !== "true") return false;
    const prefs = localStorage.getItem(COOKIE_PREFS_KEY);
    if (!prefs) return false;
    const parsed = JSON.parse(prefs);
    return parsed?.marketing === true;
  } catch {
    return false;
  }
}

// ─── SHA-256 Hashing (Advanced Matching) ─────────────────────────────────────

/** تشفير نص بـ SHA-256 (للـ Advanced Matching) */
async function sha256(text: string): Promise<string> {
  const normalized = text.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** تطبيع رقم الهاتف اليمني وتشفيره */
async function hashPhone(phone: string): Promise<string> {
  // تطبيع: إزالة المسافات والشرطات، إضافة كود الدولة إذا لم يكن موجوداً
  let normalized = phone.replace(/[\s\-()]/g, "");
  if (normalized.startsWith("0")) normalized = "967" + normalized.slice(1);
  else if (normalized.startsWith("7")) normalized = "967" + normalized;
  else if (normalized.startsWith("+")) normalized = normalized.slice(1);
  return sha256(normalized);
}

/**
 * تحميل سكريبت Meta Pixel ديناميكياً
 *
 * يستخدم fbq('consent', 'revoke') أولاً لإيقاف التتبع التفصيلي،
 * ثم يُرسل PageView لجميع الزوار (مسموح به لأغراض بناء الجمهور).
 * عند الموافقة على الكوكيز التسويقية يُستدعى fbq('consent', 'grant').
 */
function loadPixelScript(pixelId: string): void {
  if (window.FB_PIXEL_LOADED || !pixelId) return;
  window.FB_PIXEL_LOADED = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

  // تهيئة Pixel في وضع Limited Data Use (LDU) افتراضياً
  window.fbq("consent", "revoke");
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");

  // إذا وافق المستخدم مسبقاً، منح الإذن الكامل فوراً
  if (hasMarketingConsent()) {
    window.fbq("consent", "grant");
  }
}

/** منح إذن التتبع الكامل بعد موافقة المستخدم */
function grantConsent(): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("consent", "grant");
  }
}

// ─── Advanced Matching: تحديث بيانات المستخدم عند توفرها ─────────────────────

/**
 * تحديث بيانات المستخدم في Pixel للـ Advanced Matching
 * يُستدعى بعد ملء نموذج الحجز لرفع جودة المطابقة (EMQ)
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 */
export async function updatePixelUserData(data: {
  phone?: string;
  email?: string;
  externalId?: string | number;
}): Promise<void> {
  if (typeof window === "undefined" || !window.fbq || !PIXEL_ID) return;
  if (!hasMarketingConsent()) return;

  const userData: Record<string, string | string[]> = {};

  if (data.phone) {
    const hashedPhone = await hashPhone(data.phone);
    userData.ph = hashedPhone;
  }
  if (data.email) {
    const hashedEmail = await sha256(data.email);
    userData.em = hashedEmail;
  }
  if (data.externalId) {
    userData.external_id = String(data.externalId);
  }

  if (Object.keys(userData).length > 0) {
    // إعادة تهيئة Pixel مع بيانات المستخدم لتحسين المطابقة
    window.fbq("init", PIXEL_ID, userData);
  }
}

// ─── Exported tracking helpers ────────────────────────────────────────────────

/** إرسال حدث PageView يدوياً */
export function trackPageView(): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
}

/**
 * إرسال حدث ViewContent عند مشاهدة صفحة محتوى
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 * لا تُدرج تشخيصات أو حالات مرضية في content_name
 */
export function trackViewContent(data: {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  eventId?: string;
}): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    const { eventId, ...eventData } = data;
    window.fbq("track", "ViewContent", {
      content_category: "Healthcare",
      content_type: "product",
      ...eventData,
    }, eventId ? { eventID: eventId } : undefined);
  }
}

/**
 * إرسال حدث Lead عند إرسال نموذج حجز
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 * @param eventId معرّف الحدث لتجنب التكرار مع CAPI
 */
export function trackMetaLead(data?: {
  content_name?: string;
  content_category?: string;
  eventId?: string;
}): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    const { eventId, ...eventData } = data || {};
    window.fbq(
      "track",
      "Lead",
      { content_category: "Healthcare", ...eventData },
      eventId ? { eventID: eventId } : undefined
    );
  }
}

/**
 * إرسال حدث Schedule عند حجز موعد طبيب
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 */
export function trackMetaSchedule(data?: { content_name?: string; eventId?: string }): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    const { eventId, ...eventData } = data || {};
    window.fbq("track", "Schedule", eventData, eventId ? { eventID: eventId } : undefined);
  }
}

/**
 * إرسال حدث CompleteRegistration عند تسجيل مخيم أو عرض
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 */
export function trackMetaCompleteRegistration(data?: {
  content_name?: string;
  content_category?: string;
  eventId?: string;
}): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    const { eventId, ...eventData } = data || {};
    window.fbq(
      "track",
      "CompleteRegistration",
      eventData,
      eventId ? { eventID: eventId } : undefined
    );
  }
}

/**
 * إرسال حدث InitiateCheckout عند بدء ملء نموذج الحجز
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 * يُستدعى عند أول تفاعل مع النموذج (focus على أي حقل)
 */
export function trackInitiateCheckout(data?: {
  content_name?: string;
  content_category?: string;
  eventId?: string;
}): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    const { eventId, ...eventData } = data || {};
    window.fbq(
      "track",
      "InitiateCheckout",
      { content_category: "Healthcare", ...eventData },
      eventId ? { eventID: eventId } : undefined
    );
  }
}

/**
 * إرسال حدث مخصص
 * يُرسَل فقط عند موافقة المستخدم على الكوكيز التسويقية
 */
export function trackMetaCustomEvent(
  eventName: string,
  data?: Record<string, unknown>,
  eventId?: string
): void {
  if (typeof window !== "undefined" && window.fbq && hasMarketingConsent()) {
    window.fbq(
      "trackCustom",
      eventName,
      data,
      eventId ? { eventID: eventId } : undefined
    );
  }
}

/** للتوافق مع الاستدعاءات القديمة */
export const trackMetaEvent = trackMetaCustomEvent;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * مكوّن MetaPixel — يُضاف مرة واحدة في App.tsx
 *
 * • يُحمَّل Pixel فور تحميل الصفحة لجميع زوار الواجهة العامة
 * • صفحات الداشبورد (/dashboard/*) مُستثناة تماماً
 * • يُرسَل PageView عند كل تنقل بين صفحات الواجهة العامة
 * • يستمع لموافقة الكوكيز لمنح إذن التتبع الكامل
 */
export default function MetaPixel() {
  const [location] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!PIXEL_ID) return;
    // لا تُحمَّل Pixel في صفحات الداشبورد (موظفون فقط)
    if (isDashboardPath(window.location.pathname)) return;

    // تحميل Pixel لجميع الزوار فور تحميل الصفحة
    if (!initialized.current) {
      initialized.current = true;
      loadPixelScript(PIXEL_ID);
    }

    // استمع لموافقة الكوكيز لمنح إذن التتبع الكامل
    const handleConsent = () => grantConsent();
    window.addEventListener("cookieConsentUpdated", handleConsent);
    return () => window.removeEventListener("cookieConsentUpdated", handleConsent);
  }, []);

  // إرسال PageView عند كل تنقل — مع استثناء صفحات الداشبورد
  useEffect(() => {
    if (!initialized.current || !window.fbq) return;
    if (isDashboardPath(location)) return;
    window.fbq("track", "PageView");
  }, [location]);

  return null;
}
