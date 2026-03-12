/**
 * Facebook Conversions API (CAPI) Integration
 *
 * يُرسل أحداث التحويل من الخادم إلى Meta لتحسين دقة التتبع.
 * يعمل جنباً إلى جنب مع Meta Pixel في المتصفح لتقليل التكرار.
 *
 * ─── مسار المبيعات الكامل (Sales Funnel) ───────────────────────────────────
 * pending          → Lead              (عند إنشاء الطلب)
 * contacted        → WORKING           (تم التواصل مع المريض)
 * no_answer        → No_Answer         (حدث مخصص — لم يرد)
 * confirmed        → QUALIFIED         (تأكيد الموعد)
 * attended         → Purchase          (الحضور = التحويل الفعلي)
 * completed        → CONVERTED         (اكتمال الخدمة)
 * cancelled        → Canceled_Booking  (حدث مخصص — إلغاء)
 *
 * ─── متطلبات Payload ────────────────────────────────────────────────────────
 * - ph و em يُرسَلان كـ arrays (متطلب Meta)
 * - external_id مُضاف لربط أحداث المتصفح بأحداث السيرفر
 * - lead_event_source مُضاف في custom_data
 * - action_source = "website" دائماً
 * - لا تُرسَل بيانات طبية حساسة (تشخيصات، أدوية، حالات مرضية)
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from "crypto";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_PIXEL_ID = process.env.META_PIXEL_ID || "";
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "";
const CAPI_API_VERSION = "v19.0";
const CAPI_ENDPOINT = `https://graph.facebook.com/${CAPI_API_VERSION}/${META_PIXEL_ID}/events`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash a value with SHA-256 as required by Meta CAPI.
 * Normalises to lowercase and trims whitespace before hashing.
 * Returns empty string if value is falsy.
 */
function hashValue(value: string | undefined | null): string {
  if (!value) return "";
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

/**
 * Normalise a Yemeni phone number to E.164 format (+967XXXXXXXXX).
 * Accepts: 7XXXXXXXX, 07XXXXXXXX, +9677XXXXXXXX, 9677XXXXXXXX
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("967") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+967${digits.slice(1)}`;
  if (digits.length === 9) return `+967${digits}`;
  return `+${digits}`;
}

/**
 * Generate a stable external_id from phone number.
 * Used to link browser Pixel events with server CAPI events.
 * Hashed so no PII is exposed.
 */
function generateExternalId(phone: string): string {
  return hashValue(`sgh-${normalizePhone(phone)}`);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CAPIUserData {
  /** Patient full name (will be hashed) */
  fullName?: string;
  /** Phone number (will be normalised then hashed) */
  phone?: string;
  /** Email address (will be hashed) */
  email?: string;
  /** Client IP address from request */
  clientIpAddress?: string;
  /** User-Agent from request */
  clientUserAgent?: string;
  /** Facebook Browser ID (_fbc cookie) */
  fbc?: string;
  /** Facebook Browser ID (_fbp cookie) */
  fbp?: string;
}

/**
 * Standard Meta event names + custom funnel events.
 * Standard: Lead | CompleteRegistration | Schedule | Purchase
 * Custom funnel: WORKING | QUALIFIED | CONVERTED | No_Answer | Canceled_Booking
 */
export type CAPIEventName =
  | "Lead"
  | "CompleteRegistration"
  | "Schedule"
  | "Purchase"
  | "WORKING"
  | "QUALIFIED"
  | "CONVERTED"
  | "No_Answer"
  | "Canceled_Booking";

/** Standard Meta event names (use fbq("track", ...)) */
const STANDARD_META_EVENTS = new Set([
  "Lead",
  "CompleteRegistration",
  "Schedule",
  "Purchase",
  "PageView",
  "ViewContent",
  "InitiateCheckout",
  "AddToCart",
  "Search",
  "Contact",
  "FindLocation",
]);

export interface CAPIEventOptions {
  /** Event name — standard or custom funnel event */
  eventName: CAPIEventName;
  /** Unix timestamp in seconds (defaults to now) */
  eventTime?: number;
  /** URL where the event occurred */
  eventSourceUrl?: string;
  /** Unique event ID for deduplication with client-side pixel */
  eventId?: string;
  /** User data */
  userData: CAPIUserData;
  /**
   * Custom data — IMPORTANT: لا تُدرج تشخيصات أو حالات مرضية أو أدوية
   * وفق سياسة Meta لمزودي الرعاية الصحية
   */
  customData?: {
    currency?: string;
    value?: number;
    /** اسم الخدمة العام (مثل: "حجز موعد" أو "مخيم طبي") — لا تشخيصات */
    contentName?: string;
    /** فئة عامة: appointment | offer | camp */
    contentCategory?: string;
    contentIds?: string[];
    numItems?: number;
    status?: string;
  };
}

// ─── Core sender ─────────────────────────────────────────────────────────────

/**
 * Send a single event to Facebook Conversions API.
 * Silently logs errors so it never breaks the booking flow.
 * Supports both standard Meta events and custom funnel events.
 *
 * Payload structure follows Meta's required format:
 * - ph/em as arrays of hashed values
 * - external_id for cross-device matching
 * - lead_event_source in custom_data
 * - action_source = "website"
 */
export async function sendCAPIEvent(options: CAPIEventOptions): Promise<void> {
  if (!META_ACCESS_TOKEN || !META_PIXEL_ID) {
    console.warn("[CAPI] Skipping – META_ACCESS_TOKEN or META_PIXEL_ID not configured");
    return;
  }

  const {
    eventName,
    eventTime = Math.floor(Date.now() / 1000),
    eventSourceUrl,
    eventId,
    userData,
    customData,
  } = options;

  // ── Build hashed user_data object ──────────────────────────────────────────
  // Meta requires ph and em as arrays of hashed values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hashedUserData: Record<string, any> = {};

  if (userData.phone) {
    const normalizedPhone = normalizePhone(userData.phone);
    const hashedPhone = hashValue(normalizedPhone);
    if (hashedPhone) {
      // Meta requires array format for ph
      hashedUserData.ph = [hashedPhone];
      // Generate stable external_id from phone for cross-device matching
      hashedUserData.external_id = generateExternalId(userData.phone);
    }
  }

  if (userData.email) {
    const hashedEmail = hashValue(userData.email);
    if (hashedEmail) {
      // Meta requires array format for em
      hashedUserData.em = [hashedEmail];
    }
  }

  if (userData.fullName) {
    const nameParts = userData.fullName.trim().split(/\s+/);
    const fn = hashValue(nameParts[0]);
    if (fn) hashedUserData.fn = fn;
    if (nameParts.length > 1) {
      const ln = hashValue(nameParts[nameParts.length - 1]);
      if (ln) hashedUserData.ln = ln;
    }
  }

  // Non-hashed fields (passed as-is per Meta spec)
  if (userData.clientIpAddress) {
    hashedUserData.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    hashedUserData.client_user_agent = userData.clientUserAgent;
  }
  if (userData.fbc) {
    hashedUserData.fbc = userData.fbc;
  }
  if (userData.fbp) {
    hashedUserData.fbp = userData.fbp;
  }

  // ── Build custom_data object ───────────────────────────────────────────────
  // Include lead_event_source as required by Meta for CRM events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builtCustomData: Record<string, any> = {
    lead_event_source: "SGH CRM Portal",
    event_source: "crm",
  };

  if (customData) {
    if (customData.contentName) builtCustomData.content_name = customData.contentName;
    if (customData.contentCategory) builtCustomData.content_category = customData.contentCategory;
    if (customData.contentIds?.length) builtCustomData.content_ids = customData.contentIds;
    if (customData.currency) builtCustomData.currency = customData.currency;
    if (customData.value !== undefined) builtCustomData.value = customData.value;
    if (customData.numItems !== undefined) builtCustomData.num_items = customData.numItems;
    if (customData.status) builtCustomData.status = customData.status;
  }

  // ── Determine if standard or custom event ─────────────────────────────────
  const isStandardEvent = STANDARD_META_EVENTS.has(eventName);

  // ── Build event object ─────────────────────────────────────────────────────
  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime,
    // action_source must be "website" for web-based events
    action_source: "website",
    user_data: hashedUserData,
    custom_data: builtCustomData,
  };

  if (eventSourceUrl) event.event_source_url = eventSourceUrl;
  // event_id enables deduplication with client-side Pixel events
  if (eventId) event.event_id = eventId;

  // ── Build final payload ────────────────────────────────────────────────────
  const payload: Record<string, unknown> = { data: [event] };

  // Include test_event_code when set (for Events Manager Test Events tab)
  if (META_TEST_EVENT_CODE) {
    payload.test_event_code = META_TEST_EVENT_CODE;
  }

  // ── Send to Meta ───────────────────────────────────────────────────────────
  try {
    const response = await fetch(
      `${CAPI_ENDPOINT}?access_token=${META_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] API error:", JSON.stringify(result));
    } else {
      console.log(
        `[CAPI] ${isStandardEvent ? "Standard" : "Custom"} event "${eventName}" sent. Events received: ${result.events_received}`
      );
    }
  } catch (error) {
    // Never let CAPI errors break the booking flow
    console.error("[CAPI] Network error:", error);
  }
}

// ─── Sales Funnel Status Mapper ───────────────────────────────────────────────

/**
 * Maps CRM status to the appropriate Meta CAPI event.
 *
 * مسار المبيعات:
 * pending    → لا حدث (Lead أُرسل عند الإنشاء)
 * contacted  → WORKING   (تم التواصل)
 * no_answer  → No_Answer (حدث مخصص)
 * confirmed  → QUALIFIED (تأكيد الموعد)
 * attended   → Purchase  (الحضور = التحويل الفعلي)
 * completed  → CONVERTED (اكتمال الخدمة)
 * cancelled  → Canceled_Booking (حدث مخصص)
 */
function mapStatusToEvent(status: string): CAPIEventName | null {
  switch (status) {
    case "contacted":   return "WORKING";
    case "no_answer":   return "No_Answer";
    case "confirmed":   return "QUALIFIED";
    case "attended":    return "Purchase";
    case "completed":   return "CONVERTED";
    case "cancelled":   return "Canceled_Booking";
    case "pending":     return null; // Lead already sent at creation
    default:            return null;
  }
}

// ─── Shared params type for status change events ──────────────────────────────

export interface CAPIStatusChangeParams {
  /** New status */
  status: string;
  /** Patient full name */
  fullName: string;
  /** Patient phone */
  phone: string;
  /** Patient email (optional) */
  email?: string;
  /** Service type: appointment | offer | camp */
  serviceType: "appointment" | "offer" | "camp";
  /** Unique booking ID for deduplication */
  bookingId: number | string;
}

/**
 * Central function to send a CAPI event when a booking status changes.
 * Automatically maps the status to the appropriate Meta event.
 * Returns false if no event should be sent for this status.
 *
 * استدعِ هذه الدالة من updateStatus في الروترات الثلاثة.
 */
export async function sendStatusChangeEvent(params: CAPIStatusChangeParams): Promise<boolean> {
  const eventName = mapStatusToEvent(params.status);
  if (!eventName) return false; // لا حدث لهذه الحالة

  const serviceLabels: Record<string, string> = {
    appointment: "حجز موعد طبيب",
    offer: "طلب عرض طبي",
    camp: "تسجيل مخيم طبي",
  };

  const eventId = `${params.serviceType}_${params.bookingId}_${params.status}`;

  await sendCAPIEvent({
    eventName,
    eventId,
    userData: {
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
    },
    customData: {
      contentName: serviceLabels[params.serviceType] || "خدمة طبية",
      contentCategory: params.serviceType,
      status: params.status,
    },
  });

  return true;
}

// ─── Convenience wrappers (Initial submission events) ─────────────────────────

/**
 * Fire a "Lead" event when a doctor appointment is submitted.
 * لا تُدرج اسم الإجراء الطبي أو التشخيص في contentName
 */
export async function sendAppointmentLeadEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
  eventId?: string;
}): Promise<void> {
  return sendCAPIEvent({
    eventName: "Lead",
    eventId: params.eventId,
    eventSourceUrl: params.eventSourceUrl,
    userData: {
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
      clientIpAddress: params.clientIpAddress,
      clientUserAgent: params.clientUserAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    },
    customData: {
      // اسم عام فقط — لا تشخيصات أو إجراءات طبية حساسة
      contentName: "حجز موعد طبيب",
      contentCategory: "appointment",
      status: "new",
    },
  });
}

/**
 * Fire a "Lead" event when an offer lead is submitted.
 * لا تُدرج تفاصيل العرض الطبي الحساسة
 */
export async function sendOfferLeadEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
  eventId?: string;
}): Promise<void> {
  return sendCAPIEvent({
    eventName: "Lead",
    eventId: params.eventId,
    eventSourceUrl: params.eventSourceUrl,
    userData: {
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
      clientIpAddress: params.clientIpAddress,
      clientUserAgent: params.clientUserAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    },
    customData: {
      // اسم عام فقط — لا تفاصيل طبية حساسة
      contentName: "طلب عرض طبي",
      contentCategory: "offer",
      status: "new",
    },
  });
}

/**
 * Fire a "CompleteRegistration" event when a camp registration is submitted.
 * لا تُدرج تفاصيل التخصص الطبي للمخيم
 */
export async function sendCampRegistrationEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
  eventSourceUrl?: string;
  eventId?: string;
}): Promise<void> {
  return sendCAPIEvent({
    eventName: "CompleteRegistration",
    eventId: params.eventId,
    eventSourceUrl: params.eventSourceUrl,
    userData: {
      fullName: params.fullName,
      phone: params.phone,
      email: params.email,
      clientIpAddress: params.clientIpAddress,
      clientUserAgent: params.clientUserAgent,
      fbc: params.fbc,
      fbp: params.fbp,
    },
    customData: {
      // اسم عام فقط — لا تخصصات طبية حساسة
      contentName: "تسجيل مخيم طبي",
      contentCategory: "camp",
      status: "registered",
    },
  });
}
