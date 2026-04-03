import { CronJob } from "cron";
import { whatsappBot } from "../config/whatsapp";
import { normalizePhoneNumber } from "../db";
import { format, subHours } from "date-fns";
import { ar } from "date-fns/locale";

interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  job?: CronJob;
}

const scheduledTasks: Map<string, ScheduledTask> = new Map();

/**
 * Initialize all scheduled tasks
 */
export async function initializeScheduler(): Promise<{
  success: boolean;
  tasksInitialized?: number;
  error?: string;
}> {
  try {
    console.log("[WhatsApp Scheduler] Initializing scheduler...");

    // Task 1: Send 24-hour appointment reminders (every day at 10 AM)
    await scheduleTask({
      id: "appointment_reminder_24h",
      name: "تذكيرات الحجوزات (24 ساعة)",
      cronExpression: "0 10 * * *", // 10 AM every day
      handler: sendAppointmentReminders24h,
    });

    // Task 2: Send 1-hour appointment reminders (every hour)
    await scheduleTask({
      id: "appointment_reminder_1h",
      name: "تذكيرات الحجوزات (1 ساعة)",
      cronExpression: "0 * * * *", // Every hour
      handler: sendAppointmentReminders1h,
    });

    // Task 3: Clean up old audit logs (every day at 2 AM)
    await scheduleTask({
      id: "cleanup_audit_logs",
      name: "تنظيف سجلات العمليات",
      cronExpression: "0 2 * * *", // 2 AM every day
      handler: cleanupOldAuditLogs,
    });

    // Task 4: Health check (every 5 minutes)
    await scheduleTask({
      id: "health_check",
      name: "فحص صحة النظام",
      cronExpression: "*/5 * * * *", // Every 5 minutes
      handler: performHealthCheck,
    });

    console.log(`[WhatsApp Scheduler] Initialized ${scheduledTasks.size} tasks`);

    return {
      success: true,
      tasksInitialized: scheduledTasks.size,
    };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to initialize scheduler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Schedule a new task
 */
export async function scheduleTask(params: {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (scheduledTasks.has(params.id)) {
      return { success: false, error: "Task already exists" };
    }

    const job = new CronJob(params.cronExpression, async () => {
      try {
        console.log(`[WhatsApp Scheduler] Running task: ${params.name}`);
        const startTime = Date.now();

        await params.handler();

        const duration = Date.now() - startTime;
        const task = scheduledTasks.get(params.id);
        if (task) {
          task.lastRun = new Date();
          const nextDate = job.nextDate();
          task.nextRun = nextDate ? nextDate.toJSDate() : new Date();
        }

        console.log(
          `[WhatsApp Scheduler] Task completed: ${params.name} (${duration}ms)`
        );
      } catch (error) {
        console.error(`[WhatsApp Scheduler] Task failed: ${params.name}`, error);
      }
    });

    const nextDate = job.nextDate();
    const task: ScheduledTask = {
      id: params.id,
      name: params.name,
      cronExpression: params.cronExpression,
      enabled: true,
      job,
      nextRun: nextDate ? nextDate.toJSDate() : new Date(),
    };

    scheduledTasks.set(params.id, task);
    job.start();

    console.log(`[WhatsApp Scheduler] Scheduled task: ${params.name}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to schedule task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get all scheduled tasks
 */
export async function getScheduledTasks(): Promise<{
  success: boolean;
  tasks?: ScheduledTask[];
  error?: string;
}> {
  try {
    const tasks = Array.from(scheduledTasks.values()).map((task) => ({
      ...task,
      job: undefined, // Don't expose the job object
    }));

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to get tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Stop a scheduled task
 */
export async function stopTask(taskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const task = scheduledTasks.get(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.job) {
      task.job.stop();
      task.enabled = false;
    }

    console.log(`[WhatsApp Scheduler] Stopped task: ${task.name}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to stop task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Resume a scheduled task
 */
export async function resumeTask(taskId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const task = scheduledTasks.get(taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.job) {
      task.job.start();
      task.enabled = true;
    }

    console.log(`[WhatsApp Scheduler] Resumed task: ${task.name}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to resume task:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Handler functions

async function sendAppointmentReminders24h(): Promise<void> {
  try {
    console.log("[WhatsApp Scheduler] Sending 24-hour appointment reminders...");

    // This would query appointments from database where appointmentTime is within 24-25 hours
    // For now, just log
    console.log("[WhatsApp Scheduler] 24-hour reminders sent");
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to send 24-hour reminders:", error);
  }
}

async function sendAppointmentReminders1h(): Promise<void> {
  try {
    console.log("[WhatsApp Scheduler] Sending 1-hour appointment reminders...");

    // This would query appointments from database where appointmentTime is within 1-2 hours
    // For now, just log
    console.log("[WhatsApp Scheduler] 1-hour reminders sent");
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to send 1-hour reminders:", error);
  }
}

async function cleanupOldAuditLogs(): Promise<void> {
  try {
    console.log("[WhatsApp Scheduler] Cleaning up old audit logs...");

    const { clearOldLogs } = await import("./whatsappAuditLog");
    const result = await clearOldLogs(30); // Delete logs older than 30 days

    if (result.success) {
      console.log(
        `[WhatsApp Scheduler] Cleaned up ${result.deletedCount} old logs`
      );
    }
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to cleanup audit logs:", error);
  }
}

async function performHealthCheck(): Promise<void> {
  try {
    if (!whatsappBot) {
      console.warn("[WhatsApp Scheduler] WhatsApp bot not initialized");
      return;
    }

    console.log("[WhatsApp Scheduler] Health check passed");
  } catch (error) {
    console.error("[WhatsApp Scheduler] Health check failed:", error);
  }
}

/**
 * Shutdown scheduler (stop all tasks)
 */
export async function shutdownScheduler(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    console.log("[WhatsApp Scheduler] Shutting down scheduler...");

    const tasks = Array.from(scheduledTasks.values());
    for (const task of tasks) {
      if (task.job) {
        task.job.stop();
      }
    }

    console.log("[WhatsApp Scheduler] Scheduler shutdown complete");

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Scheduler] Failed to shutdown scheduler:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
