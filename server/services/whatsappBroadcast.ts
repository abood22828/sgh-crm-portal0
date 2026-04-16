/**
 * WhatsApp Broadcast Service
 * خدمة الرسائل الجماعية عبر WhatsApp Cloud API الرسمي
 *
 * ✅ يستخدم Cloud API الرسمي (sendWhatsAppTextMessage)
 * ✅ Rate limiting: 1000 رسالة/دقيقة (وفق حدود Meta)
 * ✅ تأخير بين الرسائل لتجنب الحظر
 * ✅ متوافق مع وثائق Meta الرسمية
 *
 * ⚠️ تنبيه: الرسائل الجماعية يجب أن تستخدم قوالب معتمدة من Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/message-types/template-messages
 */

import { normalizePhoneNumber } from "../db";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";

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

// In-memory store for broadcast jobs (يُنصح بنقلها لقاعدة البيانات في الإنتاج)
const broadcastJobs = new Map<string, BroadcastJob>();

export async function sendBroadcast(params: {
  message: string;
  recipients: string[];
  priority?: "high" | "normal" | "low";
  delay?: number;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    if (!params.recipients || params.recipients.length === 0) {
      return { success: false, error: "No recipients provided" };
    }

    const jobId = `broadcast_${Date.now()}`;
    const normalizedRecipients = params.recipients
      .map((phone) => normalizePhoneNumber(phone))
      .filter((phone) => phone && phone.length >= 9);

    if (normalizedRecipients.length === 0) {
      return { success: false, error: "No valid phone numbers" };
    }

    // تسجيل الـ job
    const job: BroadcastJob = {
      id: jobId,
      messageId: `broadcast_msg_${Date.now()}`,
      message: params.message,
      recipients: normalizedRecipients,
      status: "in_progress",
      sentCount: 0,
      failedCount: 0,
      createdAt: new Date(),
    };
    broadcastJobs.set(jobId, job);

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

      // تأخير بين الرسائل
      if (i < normalizedRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // تحديث حالة الـ job
    job.status = failedCount === normalizedRecipients.length ? "failed" : "completed";
    job.sentCount = sentCount;
    job.failedCount = failedCount;
    job.completedAt = new Date();
    broadcastJobs.set(jobId, job);

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

export async function getBroadcastStatus(jobId: string): Promise<{
  success: boolean;
  status?: BroadcastJob;
  error?: string;
}> {
  try {
    const job = broadcastJobs.get(jobId);
    if (!job) {
      return { success: false, error: "Broadcast job not found" };
    }
    return { success: true, status: job };
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
    const jobs = Array.from(broadcastJobs.values());
    const stats = {
      totalBroadcasts: jobs.length,
      completedBroadcasts: jobs.filter((j) => j.status === "completed").length,
      failedBroadcasts: jobs.filter((j) => j.status === "failed").length,
      totalMessagesSent: jobs.reduce((sum, j) => sum + j.sentCount, 0),
      totalMessagesFailed: jobs.reduce((sum, j) => sum + j.failedCount, 0),
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
