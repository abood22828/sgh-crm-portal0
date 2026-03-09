/**
 * Facebook Conversions API (CAPI) Helper
 * 
 * يُرسل أحداث التحويل إلى Meta من الـ backend لتحسين دقة الإحصائيات
 * وتجاوز قيود Ad Blockers وحماية الخصوصية على المتصفح.
 * 
 * متغيرات البيئة المطلوبة:
 * - META_PIXEL_ID: معرّف Pixel
 * - META_CAPI_ACCESS_TOKEN: توكن الوصول لـ Conversions API
 * 
 * المرجع: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID ?? "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

/**
 * تشفير البيانات الحساسة بـ SHA-256 كما تتطلب Meta
 */
function hashData(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/**
 * تشفير رقم الهاتف: إزالة المسافات والرموز الخاصة ثم التشفير
 */
function hashPhone(phone: string): string {
  // تطبيع رقم الهاتف: إزالة + والمسافات والشرطات
  const normalized = phone.replace(/[\s\-\(\)\+]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export interface MetaEventData {
  /** اسم الحدث: Lead, Schedule, CompleteRegistration, PageView */
  eventName: "Lead" | "Schedule" | "CompleteRegistration" | "PageView" | "ViewContent";
  /** الوقت بالثواني (Unix timestamp) */
  eventTime?: number;
  /** رابط الصفحة التي حدث فيها الحدث */
  eventSourceUrl?: string;
  /** بيانات المستخدم (اختيارية - تُشفَّر قبل الإرسال) */
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    /** IP Address للمستخدم */
    clientIpAddress?: string;
    /** User Agent للمتصفح */
    clientUserAgent?: string;
    /** fbp cookie value */
    fbp?: string;
    /** fbc cookie value */
    fbc?: string;
  };
  /** بيانات الحدث المخصصة */
  customData?: {
    content_name?: string;
    content_category?: string;
    content_type?: string;
    value?: number;
    currency?: string;
    [key: string]: unknown;
  };
  /** معرّف الحدث لتجنب التكرار مع Pixel */
  eventId?: string;
}

export interface MetaCapiResponse {
  success: boolean;
  eventsReceived?: number;
  error?: string;
}

/**
 * إرسال حدث تحويل إلى Facebook Conversions API
 */
export async function sendMetaConversionEvent(event: MetaEventData): Promise<MetaCapiResponse> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("[Meta CAPI] META_PIXEL_ID أو META_CAPI_ACCESS_TOKEN غير محدد - تم تخطي الإرسال");
    return { success: false, error: "Meta CAPI not configured" };
  }

  const eventTime = event.eventTime ?? Math.floor(Date.now() / 1000);
  const eventId = event.eventId ?? crypto.randomUUID();

  // بناء بيانات المستخدم المشفرة
  const userData: Record<string, string> = {};
  if (event.userData?.email) userData.em = hashData(event.userData.email);
  if (event.userData?.phone) userData.ph = hashPhone(event.userData.phone);
  if (event.userData?.firstName) userData.fn = hashData(event.userData.firstName);
  if (event.userData?.lastName) userData.ln = hashData(event.userData.lastName);
  if (event.userData?.clientIpAddress) userData.client_ip_address = event.userData.clientIpAddress;
  if (event.userData?.clientUserAgent) userData.client_user_agent = event.userData.clientUserAgent;
  if (event.userData?.fbp) userData.fbp = event.userData.fbp;
  if (event.userData?.fbc) userData.fbc = event.userData.fbc;

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        custom_data: event.customData ?? {},
      },
    ],
  };

  try {
    const response = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Meta CAPI] خطأ في الإرسال:", errorText);
      return { success: false, error: errorText };
    }

    const result = await response.json() as { events_received?: number };
    return {
      success: true,
      eventsReceived: result.events_received,
    };
  } catch (error) {
    console.error("[Meta CAPI] خطأ في الاتصال:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * إرسال حدث Lead (نموذج حجز جديد)
 */
export async function sendLeadEvent(data: {
  phone?: string;
  email?: string;
  contentName?: string;
  contentCategory?: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}): Promise<MetaCapiResponse> {
  return sendMetaConversionEvent({
    eventName: "Lead",
    eventSourceUrl: data.sourceUrl,
    userData: {
      phone: data.phone,
      email: data.email,
      clientIpAddress: data.clientIp,
      clientUserAgent: data.userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
    },
    customData: {
      content_name: data.contentName ?? "Medical Booking",
      content_category: data.contentCategory ?? "Healthcare",
      currency: "YER",
    },
  });
}

/**
 * إرسال حدث CompleteRegistration (اكتمال التسجيل)
 */
export async function sendCompleteRegistrationEvent(data: {
  phone?: string;
  email?: string;
  contentName?: string;
  contentCategory?: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}): Promise<MetaCapiResponse> {
  return sendMetaConversionEvent({
    eventName: "CompleteRegistration",
    eventSourceUrl: data.sourceUrl,
    userData: {
      phone: data.phone,
      email: data.email,
      clientIpAddress: data.clientIp,
      clientUserAgent: data.userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
    },
    customData: {
      content_name: data.contentName ?? "Medical Registration",
      content_category: data.contentCategory ?? "Healthcare",
      status: "completed",
    },
  });
}

/**
 * إرسال حدث Schedule (حجز موعد طبيب)
 */
export async function sendScheduleEvent(data: {
  phone?: string;
  email?: string;
  doctorName?: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}): Promise<MetaCapiResponse> {
  return sendMetaConversionEvent({
    eventName: "Schedule",
    eventSourceUrl: data.sourceUrl,
    userData: {
      phone: data.phone,
      email: data.email,
      clientIpAddress: data.clientIp,
      clientUserAgent: data.userAgent,
      fbp: data.fbp,
      fbc: data.fbc,
    },
    customData: {
      content_name: data.doctorName ?? "Doctor Appointment",
      content_category: "Healthcare",
    },
  });
}
