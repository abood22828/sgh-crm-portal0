/**
 * WhatsApp Message Dispatcher
 * الخدمة المركزية لإرسال الرسائل التلقائية بناءً على إعدادات message_settings في DB
 *
 * كيفية الاستخدام:
 *   await dispatchWhatsAppMessage({
 *     entityType: "appointment",
 *     triggerEvent: "on_create",
 *     phone: "967XXXXXXXXX",
 *     variables: { name: "أحمد", date: "2026-05-01", time: "10:00", doctor: "د. محمد", service: "عيادة عامة" },
 *     entityId: 123,
 *   });
 */

import { eq, and } from "drizzle-orm";
import { getDb, getWhatsAppConversationByPhone, createWhatsAppConversation, createWhatsAppMessage, updateWhatsAppConversation, normalizePhoneNumber } from "../db";
import { messageSettings, whatsappTemplates, whatsappNotifications } from "../../drizzle/schema";
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from "../whatsappCloudAPI";

export type EntityType = "appointment" | "camp_registration" | "offer_lead";
export type TriggerEvent =
  | "on_create"
  | "on_confirmed"
  | "on_arrived"
  | "on_completed"
  | "on_cancelled"
  | "on_reminder_24h"
  | "on_reminder_1h";

export interface DispatchOptions {
  entityType: EntityType;
  triggerEvent: TriggerEvent;
  phone: string;
  variables: Record<string, string>;
  entityId: number;
  recipientName?: string;
  sentBy?: number;
}

/** حفظ سجل الإشعار في قاعدة البيانات */
async function saveDispatchLog(params: {
  entityType: EntityType;
  entityId: number;
  phone: string;
  recipientName?: string;
  messageType: string;
  templateName?: string;
  status: "sent" | "failed";
  messageId?: string;
  errorMessage?: string;
  sentBy?: number;
}): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(whatsappNotifications).values({
      entityType: params.entityType,
      entityId: params.entityId,
      notificationType: "status_update",
      phone: params.phone,
      recipientName: params.recipientName,
      templateName: params.templateName || params.messageType,
      messageContent: params.messageType,
      status: params.status,
      metaMessageId: params.messageId,
      errorMessage: params.errorMessage,
      sentBy: params.sentBy,
      isAutomatic: true,
      sentAt: params.status === "sent" ? new Date() : undefined,
    });
  } catch (err) {
    console.error("[WhatsApp Dispatcher] Failed to save log:", err);
  }
}

/**
 * استبدال المتغيرات في نص الرسالة
 * {name} → "أحمد"، {date} → "2026-05-01"، إلخ
 */
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/**
 * الدالة الرئيسية: ترسل الرسالة المناسبة بناءً على entityType + triggerEvent
 */
export async function dispatchWhatsAppMessage(opts: DispatchOptions): Promise<{
  success: boolean;
  messageType?: string;
  channel?: string;
  error?: string;
}> {
  const { entityType, triggerEvent, phone, variables, entityId } = opts;

  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    // 1. جلب إعداد الرسالة المناسب من DB
    const [setting] = await db
      .select()
      .from(messageSettings)
      .where(
        and(
          eq(messageSettings.entityType, entityType as any),
          eq(messageSettings.triggerEvent, triggerEvent as any),
          eq(messageSettings.isEnabled, 1)
        )
      )
      .limit(1);

    if (!setting) {
      console.log(`[WhatsApp Dispatcher] No active setting found for ${entityType}:${triggerEvent}`);
      return { success: false, error: `No active message setting for ${entityType}:${triggerEvent}` };
    }

    const channel = setting.deliveryChannel;
    const messageType = setting.messageType;

    // 2. إرسال الرسالة بناءً على القناة المختارة
    let result: { success: boolean; messageId?: string; error?: string };

    if (channel === "whatsapp_api" && setting.whatsappTemplateId) {
      // إرسال عبر قالب Meta
      const [template] = await db
        .select()
        .from(whatsappTemplates)
        .where(eq(whatsappTemplates.id, setting.whatsappTemplateId))
        .limit(1);

      if (template && template.metaStatus === "APPROVED") {
        // بناء مكونات القالب - استخدام المتغيرات كـ parameters
        const bodyParams = Object.values(variables).map((v) => ({ type: "text" as const, text: v }));

        result = await sendWhatsAppTemplateMessage(phone, {
          templateName: template.name,
          languageCode: (template.languageCode ?? "ar"),
          components: [
            {
              type: "body",
              parameters: bodyParams,
            },
          ],
        });

        if (result.success) {
          await saveDispatchLog({
            entityType,
            entityId,
            phone,
            recipientName: opts.recipientName,
            messageType,
            templateName: template.name,
            status: "sent",
            messageId: result.messageId,
            sentBy: opts.sentBy,
          });
          // حفظ المحادثة والرسالة في قاعدة البيانات
          await ensureConversationAndSaveMessage({
            phone,
            customerName: opts.recipientName,
            messageContent: `[قالب: ${template.name}] ${interpolate(setting.messageContent, variables)}`,
            messageId: result.messageId,
          });
          return { success: true, messageType, channel: "whatsapp_api" };
        }
        // Fallback إلى نص عادي إذا فشل القالب
        console.warn(`[WhatsApp Dispatcher] Template send failed, falling back to text: ${result.error}`);
      }
    }

    // إرسال كنص عادي (whatsapp_integration أو fallback)
    if (channel === "whatsapp_api" || channel === "whatsapp_integration" || channel === "both") {
      const content = interpolate(setting.messageContent, variables);
      result = await sendWhatsAppTextMessage(phone, content);

      const status = result.success ? "sent" : "failed";
      await saveDispatchLog({
        entityType,
        entityId,
        phone,
        recipientName: opts.recipientName,
        messageType,
        templateName: messageType,
        status,
        messageId: result.messageId,
        errorMessage: result.error,
        sentBy: opts.sentBy,
      });

      // حفظ المحادثة والرسالة في قاعدة البيانات عند النجاح
      if (result.success) {
        const content = interpolate(setting.messageContent, variables);
        await ensureConversationAndSaveMessage({
          phone,
          customerName: opts.recipientName,
          messageContent: content,
          messageId: result.messageId,
        });
      }

      return {
        success: result.success,
        messageType,
        channel,
        error: result.error,
      };
    }

    return { success: false, error: "No valid channel configured" };
  } catch (error: any) {
    console.error(`[WhatsApp Dispatcher] Error dispatching ${entityType}:${triggerEvent}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * إنشاء أو تحديث المحادثة في قاعدة البيانات بعد إرسال رسالة تلقائية
 * يضمن ظهور الرسائل التلقائية في صفحة إدارة المحادثات
 */
export async function ensureConversationAndSaveMessage(params: {
  phone: string;
  customerName?: string;
  messageContent: string;
  messageId?: string;
  entityType?: string;
  entityId?: number;
}): Promise<void> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone) return;

    // 1. البحث عن محادثة موجودة أو إنشاء محادثة جديدة
    let conversation = await getWhatsAppConversationByPhone(normalizedPhone);
    const now = new Date();

    if (!conversation) {
      // إنشاء محادثة جديدة
      await createWhatsAppConversation({
        phoneNumber: normalizedPhone,
        customerName: params.customerName || null,
        lastMessage: params.messageContent.substring(0, 200),
        lastMessageAt: now,
        unreadCount: 0,
        isImportant: 0,
        isArchived: 0,
      });
      // جلب المحادثة المُنشأة
      conversation = await getWhatsAppConversationByPhone(normalizedPhone);
    } else {
      // تحديث المحادثة الموجودة
      await updateWhatsAppConversation(conversation.id, {
        lastMessage: params.messageContent.substring(0, 200),
        lastMessageAt: now,
        customerName: params.customerName || conversation.customerName || null,
      });
    }

    if (!conversation) return;

    // 2. حفظ الرسالة في جدول whatsapp_messages
    await createWhatsAppMessage({
      conversationId: conversation.id,
      direction: "outbound",
      content: params.messageContent,
      messageType: "text",
      status: "sent",
      whatsappMessageId: params.messageId || null,
      sentAt: now,
    });
  } catch (err) {
    console.error("[WhatsApp Dispatcher] Failed to ensure conversation/message:", err);
  }
}
