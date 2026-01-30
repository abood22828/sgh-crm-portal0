import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { sendWhatsAppTemplateMessage } from "../whatsappBusinessAPI";

/**
 * WhatsApp Message Queue
 * Handles async sending of WhatsApp messages with retry mechanism
 */

export interface WhatsAppMessageJob {
  to: string;
  templateName: string;
  language: string;
  components: Array<{
    type: "header" | "body" | "footer" | "button";
    parameters?: Array<{ type: "text" | "payload"; text?: string; payload?: string }>;
    sub_type?: "quick_reply";
    index?: number;
  }>;
  category?: "marketing" | "utility" | "authentication";
  metadata?: {
    bookingId?: number;
    bookingType?: "appointment" | "offer" | "camp";
    patientName?: string;
  };
}

// Create the queue
export const whatsappQueue = new Queue<WhatsAppMessageJob>("whatsapp-messages", {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 3, // Retry up to 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with 5 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Create the worker
export const whatsappWorker = new Worker<WhatsAppMessageJob, any, string>(
  "whatsapp-messages",
  async (job: Job<WhatsAppMessageJob>) => {
    const { to, templateName, language, components, category, metadata } = job.data;

    console.log(`[WhatsApp Queue] Processing job ${job.id} for ${to}`);

    try {
      const result = await sendWhatsAppTemplateMessage(
        to,
        {
          templateName,
          languageCode: language,
          components,
        },
        category ? { category } : undefined
      );

      console.log(`[WhatsApp Queue] Job ${job.id} completed successfully`);
      
      return {
        success: true,
        messageId: result.messageId,
        metadata,
      };
    } catch (error) {
      console.error(`[WhatsApp Queue] Job ${job.id} failed:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection: getRedisConnection(),
    concurrency: 5, // Process up to 5 messages concurrently
  }
);

// Event listeners
whatsappWorker.on("completed", (job) => {
  console.log(`[WhatsApp Queue] Job ${job.id} has been completed`);
});

whatsappWorker.on("failed", (job, err) => {
  console.error(`[WhatsApp Queue] Job ${job?.id} has failed with error:`, err.message);
});

whatsappWorker.on("error", (err) => {
  console.error("[WhatsApp Queue] Worker error:", err);
});

/**
 * Add a WhatsApp message to the queue
 */
export async function queueWhatsAppMessage(data: WhatsAppMessageJob): Promise<string> {
  const job = await whatsappQueue.add("send-message", data, {
    priority: data.category === "authentication" ? 1 : data.category === "utility" ? 2 : 3,
  });
  
  console.log(`[WhatsApp Queue] Added job ${job.id} to queue`);
  return job.id || "";
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    whatsappQueue.getWaitingCount(),
    whatsappQueue.getActiveCount(),
    whatsappQueue.getCompletedCount(),
    whatsappQueue.getFailedCount(),
    whatsappQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Retry all failed jobs
 */
export async function retryFailedJobs(): Promise<number> {
  const failedJobs = await whatsappQueue.getFailed();
  let retried = 0;

  for (const job of failedJobs) {
    await job.retry();
    retried++;
  }

  console.log(`[WhatsApp Queue] Retried ${retried} failed jobs`);
  return retried;
}

/**
 * Clean old jobs
 */
export async function cleanOldJobs(): Promise<void> {
  await whatsappQueue.clean(24 * 3600 * 1000, 1000, "completed"); // Clean completed jobs older than 24h
  await whatsappQueue.clean(7 * 24 * 3600 * 1000, 0, "failed"); // Clean failed jobs older than 7 days
  console.log("[WhatsApp Queue] Old jobs cleaned");
}
