/**
 * WhatsApp Auto Reply Service — خدمة الرد التلقائي
 *
 * ✅ القواعد محفوظة في قاعدة البيانات (لا تُفقد عند إعادة التشغيل)
 * ✅ دعم أنواع متعددة: keyword, outside_hours, first_message, faq
 * ✅ الرد باستخدام Cloud API الرسمي (لا whatsappBot)
 * ✅ تتبع عدد الاستخدامات
 *
 * وفق وثائق Meta:
 * https://developers.facebook.com/documentation/business-messaging/whatsapp/guides/send-messages
 */

import { eq, and, desc } from "drizzle-orm";
import { getDb, normalizePhoneNumber, getWhatsAppConversationByPhone, createWhatsAppConversation, createWhatsAppMessage, updateWhatsAppConversation } from "../db";
import { whatsappAutoReplies, InsertWhatsAppAutoReply } from "../../drizzle/schema";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";

export interface AutoReplyRule {
  id: number;
  name: string;
  triggerType: "keyword" | "outside_hours" | "first_message" | "faq";
  triggerValue?: string | null;
  replyMessage: string;
  isActive: number;
  priority: number;
  usageCount: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── CRUD Operations ───────────────────────────────────────────────────────────

export async function addAutoReplyRule(params: {
  name: string;
  triggerType: "keyword" | "outside_hours" | "first_message" | "faq";
  triggerValue?: string;
  replyMessage: string;
  priority?: number;
  createdBy?: number;
}): Promise<{ success: boolean; ruleId?: number; error?: string }> {
  try {
    if (!params.name || !params.replyMessage) {
      return { success: false, error: "Name and reply message are required" };
    }

    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    const values: InsertWhatsAppAutoReply = {
      name: params.name,
      triggerType: params.triggerType,
      triggerValue: params.triggerValue || null,
      replyMessage: params.replyMessage,
      isActive: 1,
      priority: params.priority ?? 0,
      usageCount: 0,
      createdBy: params.createdBy ?? 1,
    };

    const [result] = await db.insert(whatsappAutoReplies).values(values);
    const ruleId = (result as any).insertId;

    console.log(`[WhatsApp AutoReply] ✅ Added rule "${params.name}" (id: ${ruleId})`);
    return { success: true, ruleId };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to add rule:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteAutoReplyRule(ruleId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    await db.delete(whatsappAutoReplies).where(eq(whatsappAutoReplies.id, ruleId));
    console.log(`[WhatsApp AutoReply] Deleted rule ${ruleId}`);
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to delete rule:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getAutoReplyRules(): Promise<{ success: boolean; rules?: AutoReplyRule[]; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    const rules = await db
      .select()
      .from(whatsappAutoReplies)
      .orderBy(desc(whatsappAutoReplies.priority), whatsappAutoReplies.createdAt);

    return { success: true, rules };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to get rules:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function toggleAutoReplyRule(ruleId: number, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    await db
      .update(whatsappAutoReplies)
      .set({ isActive: enabled ? 1 : 0, updatedAt: new Date() })
      .where(eq(whatsappAutoReplies.id, ruleId));

    console.log(`[WhatsApp AutoReply] Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to toggle rule:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// ─── Message Processing ────────────────────────────────────────────────────────

/**
 * معالجة الرسائل الواردة والرد التلقائي عليها
 * يستخدم Cloud API الرسمي للإرسال (ليس whatsappBot)
 */
export async function processIncomingMessage(params: {
  phone: string;
  message: string;
}): Promise<{ success: boolean; replied?: boolean; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // جلب القواعد النشطة مرتبة حسب الأولوية
    const rules = await db
      .select()
      .from(whatsappAutoReplies)
      .where(eq(whatsappAutoReplies.isActive, 1))
      .orderBy(desc(whatsappAutoReplies.priority));

    for (const rule of rules) {
      let matched = false;

      switch (rule.triggerType) {
        case "keyword":
          if (rule.triggerValue) {
            matched = params.message.toLowerCase().includes(rule.triggerValue.toLowerCase());
          }
          break;
        case "first_message":
          // TODO: التحقق من أن هذه أول رسالة من هذا الرقم
          matched = false;
          break;
        case "outside_hours":
          // التحقق من ساعات العمل (8 صباحاً - 8 مساءً بتوقيت صنعاء)
          const hour = new Date().getUTCHours() + 3; // UTC+3
          matched = hour < 8 || hour >= 20;
          break;
        case "faq":
          if (rule.triggerValue) {
            matched = params.message.toLowerCase().includes(rule.triggerValue.toLowerCase());
          }
          break;
      }

      if (matched) {
        try {
          // ✅ إرسال الرد باستخدام Cloud API الرسمي
          const result = await sendWhatsAppTextMessage(normalizedPhone, rule.replyMessage);

          // تحديث عداد الاستخدام
          await db
            .update(whatsappAutoReplies)
            .set({ usageCount: rule.usageCount + 1, updatedAt: new Date() })
            .where(eq(whatsappAutoReplies.id, rule.id));

          // حفظ الرد التلقائي في المحادثة
          let conversation = await getWhatsAppConversationByPhone(normalizedPhone);
          if (!conversation) {
            await createWhatsAppConversation({
              phoneNumber: normalizedPhone,
              lastMessage: rule.replyMessage.substring(0, 100),
              lastMessageAt: new Date(),
              unreadCount: 0,
            });
            conversation = await getWhatsAppConversationByPhone(normalizedPhone);
          }

          if (conversation) {
            await createWhatsAppMessage({
              conversationId: conversation.id,
              direction: "outbound",
              content: rule.replyMessage,
              messageType: "text",
              status: "sent",
              whatsappMessageId: result.messageId || null,
              sentAt: new Date(),
              isAutomated: 1,
            });

            await updateWhatsAppConversation(conversation.id, {
              lastMessage: rule.replyMessage.substring(0, 100),
              lastMessageAt: new Date(),
            });
          }

          console.log(`[WhatsApp AutoReply] ✅ Sent auto-reply to ${normalizedPhone} using rule "${rule.name}"`);
          return { success: true, replied: true };
        } catch (error) {
          console.error(`[WhatsApp AutoReply] Failed to send auto-reply:`, error);
          return { success: false, replied: false, error: "Failed to send auto-reply" };
        }
      }
    }

    return { success: true, replied: false };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to process incoming message:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
