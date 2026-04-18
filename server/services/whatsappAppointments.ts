/**
 * WhatsApp Appointments & Registrations Service
 * خدمة إرسال إشعارات WhatsApp للمواعيد والتسجيلات والعروض
 *
 * ✅ يستخدم Cloud API الرسمي
 * ✅ يحفظ سجل الإشعارات في قاعدة البيانات
 * ✅ يدعم المواعيد وتسجيلات المخيمات وحجوزات العروض
 * ✅ يتحقق من الأرقام المحظورة قبل الإرسال
 */

import { eq, and } from "drizzle-orm";
import { normalizePhoneNumber } from "../db";
import { getDb } from "../db";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";
import { whatsappNotifications, whatsappBlockedNumbers } from "../../drizzle/schema";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

// ── Helper: حفظ سجل الإشعار في قاعدة البيانات ──────────────────────────────
async function saveNotification(params: {
  entityType: "appointment" | "camp_registration" | "offer_lead";
  entityId: number;
  notificationType: "booking_confirmation" | "reminder_24h" | "reminder_1h" | "post_visit_followup" | "cancellation" | "status_update" | "custom";
  phone: string;
  recipientName?: string;
  templateName?: string;
  messageContent?: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  metaMessageId?: string;
  errorMessage?: string;
  sentBy?: number;
  isAutomatic?: boolean;
}): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;
    const result = await db.insert(whatsappNotifications).values({
      entityType: params.entityType,
      entityId: params.entityId,
      notificationType: params.notificationType,
      phone: params.phone,
      recipientName: params.recipientName,
      templateName: params.templateName,
      messageContent: params.messageContent?.substring(0, 1000),
      status: params.status,
      metaMessageId: params.metaMessageId,
      errorMessage: params.errorMessage,
      sentBy: params.sentBy,
      isAutomatic: params.isAutomatic !== false,
      sentAt: params.status === "sent" ? new Date() : undefined,
    });
    return (result as any).insertId ?? null;
  } catch (err) {
    console.error("[WhatsApp Appointments] Failed to save notification:", err);
    return null;
  }
}

// ── Helper: التحقق من حظر الرقم ──────────────────────────────────────────────
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    const result = await db
      .select()
      .from(whatsappBlockedNumbers)
      .where(eq(whatsappBlockedNumbers.phone, phone))
      .limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}

// ── تأكيد الحجز: مواعيد الأطباء ──────────────────────────────────────────────
export async function sendAppointmentConfirmation(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  department: string;
  sentBy?: number;
}): Promise<{ success: boolean; messageId?: string; notificationId?: number; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "رقم الهاتف غير صحيح" };
    }

    if (await isPhoneBlocked(normalizedPhone)) {
      return { success: false, error: "الرقم محظور من استقبال الرسائل" };
    }

    const appointmentDate = format(params.appointmentTime, "EEEE d MMMM yyyy", { locale: ar });
    const appointmentTime = format(params.appointmentTime, "HH:mm");

    const message = `مرحباً ${params.patientName} 👋

✅ تم تأكيد موعدك في المستشفى السعودي الألماني

📋 *تفاصيل الموعد:*
👨‍⚕️ الطبيب: ${params.doctorName}
🏥 القسم: ${params.department}
📅 التاريخ: ${appointmentDate}
⏰ الوقت: ${appointmentTime}

⚠️ يرجى الحضور قبل 15 دقيقة من الموعد

📞 للاستفسار: 8000018
🌐 www.sgh-sanaa.com`.trim();

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);

    const notificationId = await saveNotification({
      entityType: "appointment",
      entityId: params.appointmentId,
      notificationType: "booking_confirmation",
      phone: normalizedPhone,
      recipientName: params.patientName,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      metaMessageId: result.messageId,
      errorMessage: result.error,
      sentBy: params.sentBy,
    });

    return { success: result.success, messageId: result.messageId, notificationId: notificationId ?? undefined, error: result.error };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send confirmation:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── تذكير الموعد ──────────────────────────────────────────────────────────────
export async function sendAppointmentReminder(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  appointmentTime: Date;
  hoursUntil: number;
  sentBy?: number;
}): Promise<{ success: boolean; messageId?: string; notificationId?: number; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "رقم الهاتف غير صحيح" };
    }

    if (await isPhoneBlocked(normalizedPhone)) {
      return { success: false, error: "الرقم محظور من استقبال الرسائل" };
    }

    const appointmentTime = format(params.appointmentTime, "HH:mm");
    const reminderText = params.hoursUntil === 24 ? "غداً" : params.hoursUntil === 1 ? "خلال ساعة" : `خلال ${params.hoursUntil} ساعات`;

    const message = `⏰ *تذكير بموعدك*

${params.patientName}، موعدك مع د. ${params.doctorName} ${reminderText}
🕐 الوقت: ${appointmentTime}

يرجى الحضور قبل 15 دقيقة
📞 للإلغاء أو التعديل: 8000018`.trim();

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);
    const notifType = params.hoursUntil >= 24 ? "reminder_24h" : "reminder_1h";

    const notificationId = await saveNotification({
      entityType: "appointment",
      entityId: params.appointmentId,
      notificationType: notifType,
      phone: normalizedPhone,
      recipientName: params.patientName,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      metaMessageId: result.messageId,
      errorMessage: result.error,
      sentBy: params.sentBy,
    });

    return { success: result.success, messageId: result.messageId, notificationId: notificationId ?? undefined, error: result.error };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send reminder:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── متابعة بعد الزيارة ────────────────────────────────────────────────────────
export async function sendAppointmentFollowup(params: {
  appointmentId: number;
  phone: string;
  patientName: string;
  doctorName: string;
  department: string;
  sentBy?: number;
}): Promise<{ success: boolean; messageId?: string; notificationId?: number; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "رقم الهاتف غير صحيح" };
    }

    if (await isPhoneBlocked(normalizedPhone)) {
      return { success: false, error: "الرقم محظور من استقبال الرسائل" };
    }

    const message = `شكراً لزيارتك ${params.patientName} 🙏

نأمل أن تكون قد استفدت من كشف د. ${params.doctorName} في قسم ${params.department}

نرجو تقييم تجربتك معنا:
⭐ ممتاز | 👍 جيد | 👎 يحتاج تحسين

📞 للحجز مجدداً: 8000018
🌐 www.sgh-sanaa.com`.trim();

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);

    const notificationId = await saveNotification({
      entityType: "appointment",
      entityId: params.appointmentId,
      notificationType: "post_visit_followup",
      phone: normalizedPhone,
      recipientName: params.patientName,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      metaMessageId: result.messageId,
      errorMessage: result.error,
      sentBy: params.sentBy,
    });

    return { success: result.success, messageId: result.messageId, notificationId: notificationId ?? undefined, error: result.error };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send followup:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── تأكيد تسجيل المخيم ───────────────────────────────────────────────────────
export async function sendCampRegistrationConfirmation(params: {
  registrationId: number;
  phone: string;
  patientName: string;
  campName: string;
  campDate?: Date;
  campLocation?: string;
  sentBy?: number;
}): Promise<{ success: boolean; messageId?: string; notificationId?: number; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "رقم الهاتف غير صحيح" };
    }

    if (await isPhoneBlocked(normalizedPhone)) {
      return { success: false, error: "الرقم محظور من استقبال الرسائل" };
    }

    const dateStr = params.campDate ? format(params.campDate, "EEEE d MMMM yyyy", { locale: ar }) : "سيتم الإعلان عنه لاحقاً";

    const message = `مرحباً ${params.patientName} 👋

✅ تم تسجيلك في المخيم الطبي بنجاح!

🏕️ *تفاصيل المخيم:*
📌 المخيم: ${params.campName}
📅 التاريخ: ${dateStr}
${params.campLocation ? `📍 الموقع: ${params.campLocation}` : ""}

سيتم التواصل معك قريباً لتأكيد التفاصيل.

📞 للاستفسار: 8000018`.trim();

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);

    const notificationId = await saveNotification({
      entityType: "camp_registration",
      entityId: params.registrationId,
      notificationType: "booking_confirmation",
      phone: normalizedPhone,
      recipientName: params.patientName,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      metaMessageId: result.messageId,
      errorMessage: result.error,
      sentBy: params.sentBy,
    });

    return { success: result.success, messageId: result.messageId, notificationId: notificationId ?? undefined, error: result.error };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send camp confirmation:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── تأكيد حجز العرض ──────────────────────────────────────────────────────────
export async function sendOfferLeadConfirmation(params: {
  offerLeadId: number;
  phone: string;
  patientName: string;
  offerName: string;
  offerPrice?: number;
  offerDiscount?: number;
  sentBy?: number;
}): Promise<{ success: boolean; messageId?: string; notificationId?: number; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "رقم الهاتف غير صحيح" };
    }

    if (await isPhoneBlocked(normalizedPhone)) {
      return { success: false, error: "الرقم محظور من استقبال الرسائل" };
    }

    const priceInfo = params.offerPrice
      ? `💰 السعر: ${params.offerPrice.toLocaleString()} ريال${params.offerDiscount ? ` (خصم ${params.offerDiscount}%)` : ""}`
      : "";

    const message = `مرحباً ${params.patientName} 👋

✅ تم استلام طلب حجزك للعرض بنجاح!

🎯 *تفاصيل العرض:*
📋 العرض: ${params.offerName}
${priceInfo}

سيتم التواصل معك قريباً لتأكيد الحجز وترتيب الموعد.

📞 للاستفسار: 8000018
🌐 www.sgh-sanaa.com`.trim();

    const result = await sendWhatsAppTextMessage(normalizedPhone, message);

    const notificationId = await saveNotification({
      entityType: "offer_lead",
      entityId: params.offerLeadId,
      notificationType: "booking_confirmation",
      phone: normalizedPhone,
      recipientName: params.patientName,
      messageContent: message,
      status: result.success ? "sent" : "failed",
      metaMessageId: result.messageId,
      errorMessage: result.error,
      sentBy: params.sentBy,
    });

    return { success: result.success, messageId: result.messageId, notificationId: notificationId ?? undefined, error: result.error };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to send offer confirmation:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── جلب إشعارات سجل معين ─────────────────────────────────────────────────────
export async function getEntityNotifications(params: {
  entityType: "appointment" | "camp_registration" | "offer_lead";
  entityId: number;
}): Promise<{ success: boolean; notifications?: any[]; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    const notifications = await db
      .select()
      .from(whatsappNotifications)
      .where(
        and(
          eq(whatsappNotifications.entityType, params.entityType),
          eq(whatsappNotifications.entityId, params.entityId)
        )
      )
      .orderBy(whatsappNotifications.createdAt);

    return { success: true, notifications };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to get notifications:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── إحصائيات الإشعارات ────────────────────────────────────────────────────────
export async function getNotificationStats(): Promise<{
  success: boolean;
  stats?: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    byType: Record<string, number>;
    byEntity: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    const all = await db.select().from(whatsappNotifications);

    const stats = {
      total: all.length,
      sent: all.filter(n => n.status === "sent" || n.status === "delivered" || n.status === "read").length,
      failed: all.filter(n => n.status === "failed").length,
      pending: all.filter(n => n.status === "pending").length,
      byType: {} as Record<string, number>,
      byEntity: {} as Record<string, number>,
    };

    for (const n of all) {
      stats.byType[n.notificationType] = (stats.byType[n.notificationType] || 0) + 1;
      stats.byEntity[n.entityType] = (stats.byEntity[n.entityType] || 0) + 1;
    }

    return { success: true, stats };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to get stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── للتوافق مع الكود القديم ───────────────────────────────────────────────────
export async function checkAndSendReminders() {
  return { success: true, sent: 0 };
}

export async function getAppointmentNotificationStatus(appointmentId: number) {
  return getEntityNotifications({ entityType: "appointment", entityId: appointmentId });
}

// ── جلب سجلات الإشعارات مع فلترة ودعم pagination ─────────────────────────────
export async function getNotificationLogs(params: {
  entityType?: "appointment" | "camp_registration" | "offer_lead";
  status?: "pending" | "sent" | "delivered" | "read" | "failed";
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; logs?: any[]; total?: number; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    // Build conditions
    const conditions = [];
    if (params.entityType) {
      conditions.push(eq(whatsappNotifications.entityType, params.entityType));
    }
    if (params.status) {
      conditions.push(eq(whatsappNotifications.status, params.status));
    }

    const query = db.select().from(whatsappNotifications);
    const whereQuery = conditions.length > 0 ? query.where(and(...conditions)) : query;
    const logs = await whereQuery
      .orderBy(whatsappNotifications.createdAt)
      .limit(limit)
      .offset(offset);

    const allQuery = db.select().from(whatsappNotifications);
    const allWithFilter = conditions.length > 0 ? allQuery.where(and(...conditions)) : allQuery;
    const allLogs = await allWithFilter;

    return { success: true, logs, total: allLogs.length };
  } catch (error) {
    console.error("[WhatsApp Appointments] Failed to get notification logs:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}
