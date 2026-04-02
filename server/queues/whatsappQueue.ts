import { Queue, Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { sendWhatsAppTemplateMessage } from "../whatsappCloudAPI";

// Check if Redis is available
let isRedisAvailable = false;
let redisCheckPromise: Promise<boolean> | null = null;

async function checkRedisConnection(): Promise<boolean> {
  if (redisCheckPromise) return redisCheckPromise;
  
  redisCheckPromise = (async () => {
    try {
      const redis = getRedisConnection();
      await redis.ping();
      isRedisAvailable = true;
      console.log("[WhatsApp Queue] Redis connection successful");
      return true;
    } catch (error) {
      isRedisAvailable = false;
      console.warn("[WhatsApp Queue] Redis not available, will send messages directly");
      return false;
    }
  })();
  
  return redisCheckPromise;
}

/**
 * WhatsApp Message Queue
 * Handles async sending of WhatsApp messages with retry mechanism
 */

export interface WhatsAppMessageJob {
  type?: "text" | "template";
  to?: string;
  phone?: string;
  message?: string;
  templateName?: string;
  language?: string;
  components?: Array<{
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
  timestamp?: Date;
}

// Create the queue (will be initialized only if Redis is available)
let whatsappQueue: Queue<WhatsAppMessageJob> | null = null;
let whatsappWorker: Worker<WhatsAppMessageJob, any, string> | null = null;

async function initializeQueue() {
  if (whatsappQueue) return whatsappQueue;
  
  const redisAvailable = await checkRedisConnection();
  if (!redisAvailable) return null;
  
  whatsappQueue = new Queue<WhatsAppMessageJob>("whatsapp-messages", {
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
  
  return whatsappQueue;
}

export { whatsappQueue };

// Create the worker (will be initialized only if Redis is available)
async function initializeWorker() {
  if (whatsappWorker) return whatsappWorker;
  
  const redisAvailable = await checkRedisConnection();
  if (!redisAvailable) return null;
  
  whatsappWorker = new Worker<WhatsAppMessageJob, any, string>(
  "whatsapp-messages",
  async (job: Job<WhatsAppMessageJob>) => {
    const { to, phone, templateName, language, components, category, metadata } = job.data;
    const phoneNumber = to || phone || "";

    console.log(`[WhatsApp Queue] Processing job ${job.id} for ${phoneNumber}`);

    try {
      const result = await sendWhatsAppTemplateMessage(
        phoneNumber,
        {
          templateName: templateName || "",
          languageCode: language || "ar",
          components: components || [],
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
  
  return whatsappWorker;
}

export { whatsappWorker };

// Initialize worker and set up event listeners
initializeWorker().then((worker) => {
  if (worker) {
    worker.on("completed", (job) => {
      console.log(`[WhatsApp Queue] Job ${job.id} has been completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[WhatsApp Queue] Job ${job?.id} has failed with error:`, err.message);
    });

    worker.on("error", (err) => {
      console.error("[WhatsApp Queue] Worker error:", err);
    });
  }
});

/**
 * Add a WhatsApp message to the queue (or send directly if Redis unavailable)
 */
export async function queueWhatsAppMessage(data: WhatsAppMessageJob): Promise<string> {
  const queue = await initializeQueue();
  
  if (!queue) {
    // Fallback: Send directly without queue
    console.log("[WhatsApp Queue] Redis unavailable, sending message directly");
    try {
      const phoneNumber = data.to || data.phone || "";
      const result = await sendWhatsAppTemplateMessage(
        phoneNumber,
        {
          templateName: data.templateName || "",
          languageCode: data.language || "ar",
          components: data.components || [],
        },
        data.category ? { category: data.category } : undefined
      );
      console.log("[WhatsApp Queue] Message sent directly:", result.messageId);
      return result.messageId || "direct-send";
    } catch (error) {
      console.error("[WhatsApp Queue] Direct send failed:", error);
      throw error;
    }
  }
  
  const job = await queue.add("send-message", data, {
    priority: data.category === "authentication" ? 1 : data.category === "utility" ? 2 : 3,
  });
  
  console.log(`[WhatsApp Queue] Added job ${job.id} to queue`);
  return (job.id?.toString()) || "";
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  const queue = await initializeQueue();
  
  if (!queue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      total: 0,
      redisAvailable: false,
    };
  }
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
    redisAvailable: true,
  };
}

/**
 * Retry all failed jobs
 */
export async function retryFailedJobs(): Promise<number> {
  const queue = await initializeQueue();
  if (!queue) return 0;
  
  const failedJobs = await queue.getFailed();
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
  const queue = await initializeQueue();
  if (!queue) return;
  
  await queue.clean(24 * 3600 * 1000, 1000, "completed"); // Clean completed jobs older than 24h
  await queue.clean(7 * 24 * 3600 * 1000, 0, "failed"); // Clean failed jobs older than 7 days
  console.log("[WhatsApp Queue] Old jobs cleaned");
}
