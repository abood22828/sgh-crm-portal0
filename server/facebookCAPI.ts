/**
 * Facebook Conversions API (CAPI) Integration
 * Sends server-side conversion events to Meta for improved tracking accuracy.
 * Works alongside the client-side Meta Pixel for deduplication.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from "crypto";

const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const META_PIXEL_ID = process.env.META_PIXEL_ID || "";
const CAPI_API_VERSION = "v19.0";
const CAPI_ENDPOINT = `https://graph.facebook.com/${CAPI_API_VERSION}/${META_PIXEL_ID}/events`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash a value with SHA-256 as required by Meta CAPI.
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

export interface CAPIEventOptions {
  /** Event name: Lead | CompleteRegistration | Schedule | Purchase */
  eventName: "Lead" | "CompleteRegistration" | "Schedule" | "Purchase";
  /** ISO timestamp (defaults to now) */
  eventTime?: number;
  /** URL where the event occurred */
  eventSourceUrl?: string;
  /** Unique event ID for deduplication with client-side pixel */
  eventId?: string;
  /** User data */
  userData: CAPIUserData;
  /** Custom data */
  customData?: {
    currency?: string;
    value?: number;
    contentName?: string;
    contentCategory?: string;
    contentIds?: string[];
    numItems?: number;
    status?: string;
  };
  /** UTM / tracking params */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// ─── Core sender ─────────────────────────────────────────────────────────────

/**
 * Send a single event to Facebook Conversions API.
 * Silently logs errors so it never breaks the booking flow.
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

  // Build hashed user data object
  const hashedUserData: Record<string, string | string[]> = {};

  if (userData.phone) {
    hashedUserData.ph = hashValue(normalizePhone(userData.phone));
  }
  if (userData.email) {
    hashedUserData.em = hashValue(userData.email);
  }
  if (userData.fullName) {
    const nameParts = userData.fullName.trim().split(/\s+/);
    hashedUserData.fn = hashValue(nameParts[0]);
    if (nameParts.length > 1) {
      hashedUserData.ln = hashValue(nameParts[nameParts.length - 1]);
    }
  }
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

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_time: eventTime,
    action_source: "website",
    user_data: hashedUserData,
  };

  if (eventSourceUrl) event.event_source_url = eventSourceUrl;
  if (eventId) event.event_id = eventId;
  if (customData && Object.keys(customData).length > 0) {
    event.custom_data = customData;
  }

  const payload = {
    data: [event],
    // test_event_code: "TEST12345", // Uncomment for testing in Events Manager
  };

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
        `[CAPI] Event "${eventName}" sent successfully. Events received: ${result.events_received}`
      );
    }
  } catch (error) {
    // Never let CAPI errors break the booking flow
    console.error("[CAPI] Network error:", error);
  }
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/**
 * Fire a "Lead" event when a doctor appointment is submitted.
 */
export async function sendAppointmentLeadEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  doctorName?: string;
  procedure?: string;
  campaignName?: string;
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
      contentName: params.doctorName ? `موعد مع ${params.doctorName}` : "حجز موعد",
      contentCategory: "appointment",
      contentIds: params.procedure ? [params.procedure] : undefined,
      status: "new",
    },
  });
}

/**
 * Fire a "Lead" event when an offer lead is submitted.
 */
export async function sendOfferLeadEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  offerName?: string;
  campaignName?: string;
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
      contentName: params.offerName || "عرض طبي",
      contentCategory: "offer",
      status: "new",
    },
  });
}

/**
 * Fire a "CompleteRegistration" event when a camp registration is submitted.
 */
export async function sendCampRegistrationEvent(params: {
  fullName: string;
  phone: string;
  email?: string;
  campName?: string;
  procedures?: string;
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
      contentName: params.campName || "مخيم طبي",
      contentCategory: "camp",
      status: "registered",
    },
  });
}
