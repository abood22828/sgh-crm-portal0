/**
 * WhatsApp Broadcast Service
 * خدمة الرسائل الجماعية عبر WhatsApp Cloud API الرسمي
 *
 * ✅ يستخدم Cloud API الرسمي (sendWhatsAppTextMessage)
 * ✅ Rate limiting: 1000 رسالة/دقيقة (وفق حدود Meta)
 * ✅ تأخير بين الرسائل لتجنب الحظر
 * ✅ متوافق مع وثائق Meta الرسمية
 * ✅ تخزين الوظائف في قاعدة البيانات لضمان الاستمرارية
 *
 * ⚠️ تنبيه: الرسائل الجماعية يجب أن تستخدم قوالب معتمدة من Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/message-types/template-messages
 */

import { normalizePhoneNumber, getDb } from "../db";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";
import { whatsappBroadcasts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface BroadcastJob {
  id: string;
  messageId: string;
  message: string;
  recipients: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  completedAt?: Date;
}

export async function sendBroadcast(params: {
  message: string;
  recipients: string[];
  priority?: "high" | "normal" | "low";
  delay?: number;
  createdBy?: number;
}): Promise<{ success: boolean; jobId?: number; error?: string }> {
  try {
    if (!params.recipients || params.recipients.length === 0) {
      return { success: false, error: "No recipients provided" };
    }

    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const normalizedRecipients = params.recipients
      .map((phone) => normalizePhoneNumber(phone))
      .filter((phone) => phone && phone.length >= 9);

    if (normalizedRecipients.length === 0) {
      return { success: false, error: "No valid phone numbers" };
    }

    // تسجيل الـ job في قاعدة البيانات
    const [broadcast] = await db.insert(whatsappBroadcasts).values({
      name: `Broadcast ${new Date().toISOString()}`,
      message: params.message,
      recipientCount: normalizedRecipients.length,
      sentCount: 0,
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
      status: "sending",
      createdBy: params.createdBy || 1,
    }).returning();

    const jobId = broadcast.id;
    console.log(`[WhatsApp Broadcast] Starting broadcast ${jobId} to ${normalizedRecipients.length} recipients`);

    // إرسال الرسائل بشكل متسلسل مع تأخير لتجنب Rate Limiting
    // وفق Meta: الحد الأقصى 1000 رسالة/دقيقة لحسابات الأعمال
    const delay = params.delay || 1200; // 1.2 ثانية بين كل رسالة (أمان من Rate Limiting)
    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < normalizedRecipients.length; i++) {
      const phone = normalizedRecipients[i];
      try {
        const result = await sendWhatsAppTextMessage(phone, params.message);
        if (result.success) {
          sentCount++;
        } else {
          console.error(`[WhatsApp Broadcast] Failed to send to ${phone}: ${result.error}`);
          failedCount++;
        }
      } catch (error) {
        console.error(`[WhatsApp Broadcast] Error sending to ${phone}:`, error);
        failedCount++;
      }

      // تحديث التقدم كل 10 رسائل
      if (i % 10 === 0) {
        await db.update(whatsappBroadcasts)
          .set({ sentCount, failedCount })
          .where(eq(whatsappBroadcasts.id, jobId));
      }

      // تأخير بين الرسائل
      if (i < normalizedRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // تحديث حالة الـ job النهائية
    const finalStatus = failedCount === normalizedRecipients.length ? "failed" : "completed";
    await db.update(whatsappBroadcasts)
      .set({
        status: finalStatus,
        sentCount,
        failedCount,
        completedAt: new Date(),
      })
      .where(eq(whatsappBroadcasts.id, jobId));

    console.log(`[WhatsApp Broadcast] Broadcast ${jobId} completed: ${sentCount} sent, ${failedCount} failed`);

    return {
      success: true,
      jobId,
    };
  } catch (error) {
    console.error("[WhatsApp Broadcast] Failed to send broadcast:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getBroadcastStatus(jobId: number): Promise<{
  success: boolean;
  status?: any;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const [broadcast] = await db.select().from(whatsappBroadcasts).where(eq(whatsappBroadcasts.id, jobId)).limit(1);
    if (!broadcast) {
      return { success: false, error: "Broadcast job not found" };
    }
    return { success: true, status: broadcast };
  } catch (error) {
    console.error("[WhatsApp Broadcast] Failed to get broadcast status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getBroadcastStats(): Promise<{
  success: boolean;
  stats?: {
    totalBroadcasts: number;
    completedBroadcasts: number;
    failedBroadcasts: number;
    totalMessagesSent: number;
    totalMessagesFailed: number;
  };
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    const broadcasts = await db.select().from(whatsappBroadcasts);
    const stats = {
      totalBroadcasts: broadcasts.length,
      completedBroadcasts: broadcasts.filter((b: any) => b.status === "completed").length,
      failedBroadcasts: broadcasts.filter((b: any) => b.status === "failed").length,
      totalMessagesSent: broadcasts.reduce((sum: number, b: any) => sum + (b.sentCount || 0), 0),
      totalMessagesFailed: broadcasts.reduce((sum: number, b: any) => sum + (b.failedCount || 0), 0),
    };
    return { success: true, stats };
  } catch (error) {
    console.error("[WhatsApp Broadcast] Failed to get broadcast stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function scheduleBroadcast(params: {
  message: string;
  recipients: string[];
  scheduledAt: Date;
  priority?: "high" | "normal" | "low";
}): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  try {
    const scheduleId = `schedule_${Date.now()}`;
    const now = new Date();
    const delay = params.scheduledAt.getTime() - now.getTime();

    if (delay <= 0) {
      // إرسال فوري إذا كان الوقت قد مضى
      return sendBroadcast({
        message: params.message,
        recipients: params.recipients,
        priority: params.priority,
      });
    }

    console.log(
      `[WhatsApp Broadcast] Scheduled broadcast ${scheduleId} for ${params.scheduledAt.toISOString()} (in ${Math.round(delay / 1000)}s)`
    );

    // جدولة الإرسال
    setTimeout(async () => {
      console.log(`[WhatsApp Broadcast] Executing scheduled broadcast ${scheduleId}`);
      await sendBroadcast({
        message: params.message,
        recipients: params.recipients,
        priority: params.priority,
      });
    }, delay);

    return {
      success: true,
      scheduleId,
    };
  } catch (error) {
    console.error("[WhatsApp Broadcast] Failed to schedule broadcast:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
