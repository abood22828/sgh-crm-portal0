/**
 * WhatsApp Service
 * خدمة مركزية لإرسال الرسائل والتعامل مع WhatsApp
 */

import { whatsappBot } from "../config/whatsapp";
import { whatsappQueue } from "../queues/whatsappQueue";
import { normalizePhoneNumber } from "../db";

/**
 * Send a simple text message
 */
export async function sendTextMessage(
  phone: string,
  message: string,
  options?: { priority?: "high" | "normal" | "low" }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!whatsappBot) {
      return {
        success: false,
        error: "WhatsApp bot not initialized",
      };
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return {
        success: false,
        error: "Invalid phone number format",
      };
    }

    // Add to queue
    if (whatsappQueue) {
      const jobData: any = {
        type: "text",
        phone: normalizedPhone,
        message,
        timestamp: new Date(),
      };
      
      const jobOptions: any = {
        priority: options?.priority === "high" ? 10 : options?.priority === "low" ? 1 : 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      };
      
      await whatsappQueue.add(jobData, jobOptions);
    } else {
      // Send directly if queue not available
      await whatsappBot.sendText(normalizedPhone, message);
    }

    return {
      success: true,
      messageId: `queued_${Date.now()}`,
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
 * Verify WhatsApp Service Health
 */
export async function verifyWhatsAppHealth(): Promise<{
  botReady: boolean;
  clientReady: boolean;
  queueReady: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  const botReady = whatsappBot !== null;
  if (!botReady) errors.push("WhatsApp bot not initialized");

  const queueReady = whatsappQueue !== null;
  if (!queueReady) errors.push("WhatsApp queue not initialized");

  return {
    botReady,
    clientReady: true,
    queueReady,
    errors,
  };
}
