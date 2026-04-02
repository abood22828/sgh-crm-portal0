import { whatsappBot } from "../config/whatsapp";
import { normalizePhoneNumber } from "../db";
import * as db from "../db";

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
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    if (!whatsappBot) {
      return { success: false, error: "WhatsApp bot not initialized" };
    }

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

    console.log(`[WhatsApp Broadcast] Starting broadcast ${jobId} to ${normalizedRecipients.length} recipients`);

    // Send messages sequentially with delay
    const delay = params.delay || 1000;
    let sentCount = 0;
    let failedCount = 0;

    for (const phone of normalizedRecipients) {
      try {
        await whatsappBot.sendText(phone, params.message);
        sentCount++;
      } catch (error) {
        console.error(`[WhatsApp Broadcast] Failed to send to ${phone}:`, error);
        failedCount++;
      }

      // Add delay between messages to avoid rate limiting
      if (normalizedRecipients.indexOf(phone) < normalizedRecipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

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
    // This would query from database
    // For now, return placeholder
    return {
      success: true,
      status: {
        id: jobId,
        messageId: "msg_123",
        message: "Sample message",
        recipients: ["967777165305"],
        status: "completed",
        sentCount: 1,
        failedCount: 0,
        createdAt: new Date(),
        completedAt: new Date(),
      },
    };
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
    // This would query from database
    // For now, return placeholder
    return {
      success: true,
      stats: {
        totalBroadcasts: 10,
        completedBroadcasts: 8,
        failedBroadcasts: 2,
        totalMessagesSent: 500,
        totalMessagesFailed: 25,
      },
    };
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

    console.log(
      `[WhatsApp Broadcast] Scheduled broadcast ${scheduleId} for ${params.scheduledAt.toISOString()}`
    );

    // This would save to database and use a job scheduler
    // For now, just return success
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
