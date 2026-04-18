/**
 * Appointment Reminders Cron Job
 * مهمة جدولة تذكيرات المواعيد عبر WhatsApp
 *
 * تُرسل تذكيراً:
 *  - قبل 24 ساعة من الموعد
 *  - قبل ساعة واحدة من الموعد
 *
 * تعمل كل 30 دقيقة للتحقق من المواعيد القادمة
 */

import { getDb } from "../db";
import { appointments, whatsappNotifications } from "../../drizzle/schema";
import { and, between, eq, isNull, sql } from "drizzle-orm";
import { sendAppointmentReminder } from "../services/whatsappAppointments";

const LOG_PREFIX = "[AppointmentReminders]";

/**
 * جلب المواعيد التي تحتاج إلى تذكير خلال نافذة زمنية محددة
 */
async function getAppointmentsNeedingReminder(
  windowStart: Date,
  windowEnd: Date,
  notifType: "reminder_24h" | "reminder_1h"
) {
  const db = await getDb();
  if (!db) return [];

  // جلب المواعيد في النافذة الزمنية المحددة
  const upcomingAppointments = await db
    .select()
    .from(appointments)
    .where(
      and(
        between(appointments.appointmentDate, windowStart, windowEnd),
        // فقط المواعيد المؤكدة أو المعلقة
        sql`${appointments.status} IN ('pending', 'confirmed', 'contacted')`
      )
    );

  if (upcomingAppointments.length === 0) return [];

  // التحقق من أنه لم يُرسل تذكير من هذا النوع مسبقاً
  const appointmentIds = upcomingAppointments.map((a) => a.id);
  const alreadySent = await db
    .select({ entityId: whatsappNotifications.entityId })
    .from(whatsappNotifications)
    .where(
      and(
        eq(whatsappNotifications.entityType, "appointment"),
        eq(whatsappNotifications.notificationType, notifType),
        sql`${whatsappNotifications.entityId} IN (${sql.join(
          appointmentIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      )
    );

  const alreadySentIds = new Set(alreadySent.map((r) => r.entityId));
  return upcomingAppointments.filter((a) => !alreadySentIds.has(a.id));
}

/**
 * إرسال تذكيرات 24 ساعة
 */
async function send24HourReminders() {
  const now = new Date();
  // نافذة: من 23:30 إلى 24:30 ساعة من الآن
  const windowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  const toRemind = await getAppointmentsNeedingReminder(
    windowStart,
    windowEnd,
    "reminder_24h"
  );

  if (toRemind.length === 0) {
    console.log(`${LOG_PREFIX} No 24h reminders needed`);
    return { sent: 0, failed: 0 };
  }

  console.log(`${LOG_PREFIX} Sending 24h reminders for ${toRemind.length} appointments`);

  let sent = 0;
  let failed = 0;

  for (const appt of toRemind) {
    if (!appt.phone) {
      failed++;
      continue;
    }
    try {
      const result = await sendAppointmentReminder({
        appointmentId: appt.id,
        phone: appt.phone,
        patientName: appt.fullName || "المريض",
        doctorName: "",
        appointmentTime:
          appt.appointmentDate instanceof Date
            ? appt.appointmentDate
            : new Date(appt.appointmentDate || appt.createdAt),
        hoursUntil: 24,
      });

      if (result.success) {
        sent++;
        console.log(`${LOG_PREFIX} 24h reminder sent for appointment #${appt.id}`);
      } else {
        failed++;
        console.warn(
          `${LOG_PREFIX} Failed to send 24h reminder for appointment #${appt.id}: ${result.error}`
        );
      }
    } catch (err) {
      failed++;
      console.error(
        `${LOG_PREFIX} Error sending 24h reminder for appointment #${appt.id}:`,
        err
      );
    }
  }

  return { sent, failed };
}

/**
 * إرسال تذكيرات ساعة واحدة
 */
async function send1HourReminders() {
  const now = new Date();
  // نافذة: من 45 دقيقة إلى 75 دقيقة من الآن
  const windowStart = new Date(now.getTime() + 45 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

  const toRemind = await getAppointmentsNeedingReminder(
    windowStart,
    windowEnd,
    "reminder_1h"
  );

  if (toRemind.length === 0) {
    console.log(`${LOG_PREFIX} No 1h reminders needed`);
    return { sent: 0, failed: 0 };
  }

  console.log(`${LOG_PREFIX} Sending 1h reminders for ${toRemind.length} appointments`);

  let sent = 0;
  let failed = 0;

  for (const appt of toRemind) {
    if (!appt.phone) {
      failed++;
      continue;
    }
    try {
      const result = await sendAppointmentReminder({
        appointmentId: appt.id,
        phone: appt.phone,
        patientName: appt.fullName || "المريض",
        doctorName: "",
        appointmentTime:
          appt.appointmentDate instanceof Date
            ? appt.appointmentDate
            : new Date(appt.appointmentDate || appt.createdAt),
        hoursUntil: 1,
      });

      if (result.success) {
        sent++;
        console.log(`${LOG_PREFIX} 1h reminder sent for appointment #${appt.id}`);
      } else {
        failed++;
        console.warn(
          `${LOG_PREFIX} Failed to send 1h reminder for appointment #${appt.id}: ${result.error}`
        );
      }
    } catch (err) {
      failed++;
      console.error(
        `${LOG_PREFIX} Error sending 1h reminder for appointment #${appt.id}:`,
        err
      );
    }
  }

  return { sent, failed };
}

/**
 * تشغيل جميع مهام التذكير
 */
export async function runAppointmentReminderJobs() {
  console.log(`${LOG_PREFIX} Running appointment reminder jobs...`);

  try {
    const [result24h, result1h] = await Promise.all([
      send24HourReminders(),
      send1HourReminders(),
    ]);

    console.log(
      `${LOG_PREFIX} Done. 24h: ${result24h.sent} sent, ${result24h.failed} failed. 1h: ${result1h.sent} sent, ${result1h.failed} failed.`
    );

    return {
      success: true,
      reminders24h: result24h,
      reminders1h: result1h,
    };
  } catch (err) {
    console.error(`${LOG_PREFIX} Unexpected error:`, err);
    return { success: false, error: String(err) };
  }
}

/**
 * تهيئة جدولة تذكيرات المواعيد (كل 30 دقيقة)
 */
export function initAppointmentRemindersScheduler() {
  const INTERVAL_MS = 30 * 60 * 1000; // 30 دقيقة

  console.log(
    `${LOG_PREFIX} Initializing appointment reminders scheduler (every 30 minutes)...`
  );

  // تشغيل فوري عند بدء التشغيل (بعد 10 ثوانٍ للسماح للسيرفر بالاستقرار)
  setTimeout(() => {
    runAppointmentReminderJobs().catch(console.error);
  }, 10_000);

  // تشغيل كل 30 دقيقة
  setInterval(() => {
    runAppointmentReminderJobs().catch(console.error);
  }, INTERVAL_MS);

  console.log(`${LOG_PREFIX} Scheduler initialized. Running every 30 minutes.`);
}
