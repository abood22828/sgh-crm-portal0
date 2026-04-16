/**
 * WhatsApp Service
 * خدمة مركزية لإرسال الرسائل والتعامل مع WhatsApp Cloud API الرسمي
 *
 * ✅ يستخدم Cloud API الرسمي (sendWhatsAppTextMessage)
 * ✅ متوافق مع وثائق Meta الرسمية v23.0
 */

import { normalizePhoneNumber } from "../db";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";
import { ENV } from "../_core/env";

/**
 * Send a simple text message via Cloud API
 */
export async function sendTextMessage(
  phone: string,
  message: string,
  options?: { priority?: "high" | "normal" | "low" }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("[WhatsApp] Failed to send text message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a welcome message
 */
export async function sendWelcomeMessage(params: {
  phone: string;
  fullName: string;
  campaignName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `مرحباً ${params.fullName}،

شكراً لتسجيلك في ${params.campaignName} بالمستشفى السعودي الألماني - صنعاء.

سنتواصل معك قريباً لتحديد موعدك.

للاستفسارات: 8000018

نرعاكم كأهالينا 💚`;

  return sendTextMessage(params.phone, message, { priority: "high" });
}

/**
 * Send booking confirmation message
 */
export async function sendBookingConfirmation(params: {
  phone: string;
  fullName: string;
  appointmentDate?: string;
  appointmentTime?: string;
  doctorName?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = `عزيزي/عزيزتي ${params.fullName}،

تم تأكيد حجزك بنجاح! ✅

${params.doctorName ? `👨‍⚕️ الطبيب: ${params.doctorName}` : ""}
${params.appointmentDate && params.appointmentTime ? `📅 التاريخ: ${params.appointmentDate}\n🕐 الوقت: ${params.appointmentTime}` : ""}

📍 الموقع: المستشفى السعودي الألماني - صنعاء

يرجى الحضور قبل الموعد بـ 15 دقيقة.

للاستفسارات: 8000018

نرعاكم كأهالينا 💚`;

  return sendTextMessage(params.phone, message, { priority: "high" });
}

/**
 * Send custom message
 */
export async function sendCustomMessage(
  phone: string,
  message: string,
  options?: { priority?: "high" | "normal" | "low" }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendTextMessage(phone, message, options);
}

/**
 * Verify WhatsApp Cloud API Health
 */
export async function verifyWhatsAppHealth(): Promise<{
  botReady: boolean;
  clientReady: boolean;
  queueReady: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const cloudApiReady = !!(ENV.whatsappPhoneNumberId && ENV.metaAccessToken);
  if (!cloudApiReady) errors.push("WhatsApp Cloud API not configured (missing WHATSAPP_PHONE_NUMBER_ID or META_ACCESS_TOKEN)");

  return {
    botReady: cloudApiReady,
    clientReady: cloudApiReady,
    queueReady: true, // Cloud API لا يحتاج queue
    errors,
  };
}
