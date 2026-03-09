/**
 * MetaPixel - مكوّن Meta Pixel مع دعم Cookie Consent
 * 
 * يُحمَّل Pixel فقط عند موافقة المستخدم على الكوكيز التسويقية.
 * يستخدم VITE_META_PIXEL_ID من متغيرات البيئة.
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

/** تحقق من موافقة المستخدم على الكوكيز التسويقية */
function hasMarketingConsent(): boolean {
  try {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) return false;
    const parsed = JSON.parse(consent);
    return parsed?.marketing === true;
  } catch {
    return false;
  }
}

/** تحميل سكريبت Meta Pixel ديناميكياً */
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

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
}

/** إرسال حدث PageView */
export function trackPageView(): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "PageView");
  }
}

/** إرسال حدث Lead عند إرسال نموذج */
export function trackMetaLead(data?: { content_name?: string; content_category?: string }): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead", {
      content_category: "Healthcare",
      ...data,
    });
  }
}

/** إرسال حدث Schedule عند حجز موعد طبيب */
export function trackMetaSchedule(data?: { content_name?: string }): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Schedule", data || {});
  }
}

/** إرسال حدث CompleteRegistration عند تسجيل مخيم أو عرض */
export function trackMetaCompleteRegistration(data?: { content_name?: string; content_category?: string }): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "CompleteRegistration", data || {});
  }
}

/** إرسال حدث مخصص */
export function trackMetaEvent(eventName: string, data?: Record<string, unknown>): void {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, data);
  }
}

/**
 * مكوّن MetaPixel - يُضاف مرة واحدة في App.tsx
 * يتتبع تغييرات الصفحة ويُرسل PageView تلقائياً
 * يُحمَّل فقط عند موافقة المستخدم على الكوكيز التسويقية
 */
export default function MetaPixel() {
  const [location] = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!PIXEL_ID) return;

    const tryInit = () => {
      if (hasMarketingConsent() && !initialized.current) {
        initialized.current = true;
        loadPixelScript(PIXEL_ID);
      }
    };

    // محاولة التهيئة فوراً
    tryInit();

    // استمع لتحديثات الموافقة (يُطلَق من CookieConsentBanner)
    window.addEventListener("cookie_consent_updated", tryInit);
    return () => window.removeEventListener("cookie_consent_updated", tryInit);
  }, []);

  // إرسال PageView عند كل تنقل
  useEffect(() => {
    if (initialized.current && window.fbq) {
      window.fbq("track", "PageView");
    }
  }, [location]);

  return null;
}
