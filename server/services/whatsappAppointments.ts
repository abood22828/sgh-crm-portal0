import { whatsappBot } from "../config/whatsapp";
import { normalizePhoneNumber } from "../db";
import { format, addHours, differenceInHours } from "date-fns";
import { ar } from "date-fns/locale";

export interface AppointmentNotification {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  type: "confirmation" | "reminder_24h" | "reminder_1h" | "followup";
  status: "pending" | "sent" | "failed";
  sentAt?: Date;
  error?: string;
}

export async function sendAppointmentConfirmation(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  department: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!whatsappBot) {
      return { success: false, error: "WhatsApp bot not initialized" };
    }

    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    const appointmentDate = format(params.appointmentTime, "EEEE d MMMM yyyy", {
      locale: ar,
    });
    const appointmentTime = format(params.appointmentTime, "HH:mm", { locale: ar });

    const message = `
مرحباً ${params.patientName}

تم تأكيد موعدك لدى المستشفى السعودي الألماني

📋 تفاصيل الموعد:
👨‍⚕️ الطبيب: ${params.doctorName}
🏥 القسم: ${params.department}
📅 التاريخ: ${appointmentDate}
⏰ الوقت: ${appointmentTime}

⚠️ يرجى الحضور قبل 15 دقيقة من الموعد المحدد

للتواصل: 8000018

شكراً لاختيارك المستشفى السعودي الألماني
    `.trim();

    const result = await whatsappBot.sendText(normalizedPhone, message);

    console.log(
      `[WhatsApp Appointments] Sent confirmation for appointment ${params.appointmentId} to ${normalizedPhone}`
    );

    return {
      success: true,
      messageId: result.messageId || `appt_${params.appointmentId}`,
    };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAppointmentReminder(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  hoursUntil: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!whatsappBot) {
      return { success: false, error: "WhatsApp bot not initialized" };
    }

    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    const appointmentTime = format(params.appointmentTime, "HH:mm", { locale: ar });
    const reminderText =
      params.hoursUntil === 24
        ? "غداً في نفس الوقت"
        : params.hoursUntil === 1
          ? "خلال ساعة واحدة"
          : `خلال ${params.hoursUntil} ساعات`;

    const message = `
تذكير: موعدك مع د. ${params.doctorName}

${reminderText}
⏰ الوقت: ${appointmentTime}

يرجى الحضور قبل 15 دقيقة من الموعد المحدد

للتواصل: 8000018
    `.trim();

    const result = await whatsappBot.sendText(normalizedPhone, message);

    console.log(
      `[WhatsApp Appointments] Sent ${params.hoursUntil}h reminder for appointment ${params.appointmentId}`
    );

    return {
      success: true,
      messageId: result.messageId || `reminder_${params.appointmentId}`,
    };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send reminder:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAppointmentFollowup(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  department: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!whatsappBot) {
      return { success: false, error: "WhatsApp bot not initialized" };
    }

    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    const message = `
شكراً لزيارتك المستشفى السعودي الألماني

${params.patientName}

نأمل أن تكون قد استفدت من الكشف مع د. ${params.doctorName}

إذا كان لديك أي استفسارات أو تحتاج إلى موعد آخر، يرجى عدم التردد في التواصل معنا

📞 للحجز والاستفسارات: 8000018
🌐 زيارتنا على الموقع: www.sgh-sanaa.com

شكراً لثقتك بنا
    `.trim();

    const result = await whatsappBot.sendText(normalizedPhone, message);

    console.log(
      `[WhatsApp Appointments] Sent followup for appointment ${params.appointmentId}`
    );

    return {
      success: true,
      messageId: result.messageId || `followup_${params.appointmentId}`,
    };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send followup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkAndSendReminders(): Promise<{
  success: boolean;
  sent?: number;
  error?: string;
}> {
  try {
    // This would query appointments from database and send reminders
    // For now, return placeholder
    console.log("[WhatsApp Appointments] Checking for reminders to send...");

    return {
      success: true,
      sent: 0,
    };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to check reminders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAppointmentNotificationStatus(
  appointmentId: number
): Promise<{
  success: boolean;
  notifications?: AppointmentNotification[];
  error?: string;
}> {
  try {
    // This would query from database
    // For now, return placeholder
    return {
      success: true,
      notifications: [],
    };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to get notification status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
