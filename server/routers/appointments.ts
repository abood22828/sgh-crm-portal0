import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte } from "drizzle-orm";
import { getDb } from "../db";
import { appointments } from "../../drizzle/schema";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  getCampaignBySlug,
  getDoctorById,
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  bulkUpdateAppointmentStatus,
  createCampaign,
  normalizePhoneNumber,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { sendNewAppointmentEmail } from "../email";
import { sendWelcomeMessage } from "../whatsapp";
import { sendNewAppointmentTelegram } from "../telegram";
import { serverCache, CacheKeys, CacheTTL } from "../cache";
import { createAuditLog } from "./auditLogs";
import { sendAppointmentLeadEvent, sendStatusChangeEvent } from "../facebookCAPI";
// sendAppointmentConfirmation moved to dispatchWhatsAppMessage flow
import { dispatchWhatsAppMessage } from "../services/whatsappMessageDispatcher";

export const appointmentsRouter = router({
  submit: publicProcedure
    .input(z.object({
      fullName: z.string().min(1),
      phone: z.string().min(9).regex(
        /^(\+?967)?7\d{8}$|^07\d{8}$|^7\d{8}$/,
        "رقم الهاتف يجب أن يبدأ بالرقم 7 ويتكون من 9 أرقام"
      ),
      email: z.string().optional(),
      doctorId: z.number(),
      age: z.number().optional(),
      gender: z.enum(["male", "female"]).optional(),
      procedure: z.string().optional(),
      preferredDate: z.string().optional(),
      preferredTime: z.string().optional(),
      additionalNotes: z.string().optional(),
      patientMessage: z.string().max(500).optional(),
      campaignSlug: z.string(),
      source: z.string().optional(),
      status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]).optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
      utmPlacement: z.string().optional(),
      referrer: z.string().optional(),
      fbclid: z.string().optional(),
      gclid: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // التحقق من عدم تكرار الحجز بنفس الرقم ونفس الطبيب خلال 3 أيام
      const normalizedPhone = normalizePhoneNumber(input.phone);
      const db = await getDb();
      if (db) {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const allAppointments = await db
          .select({ id: appointments.id, phone: appointments.phone })
          .from(appointments)
          .where(
            and(
              gte(appointments.createdAt, threeDaysAgo),
              eq(appointments.doctorId, input.doctorId)
            )
          )
          .limit(100);
        const existing = allAppointments.filter(a => normalizePhoneNumber(a.phone) === normalizedPhone);
        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "لقد تم تسجيل حجز بنفس رقم الهاتف مع هذا الطبيب خلال الأيام الثلاثة الماضية",
          });
        }
      }

      // Get or create campaign by slug
      let campaign = await getCampaignBySlug(input.campaignSlug);
      if (!campaign) {
        // Auto-create campaign for appointments
        await createCampaign({
          name: `حجز موعد - ${input.campaignSlug}`,
          slug: input.campaignSlug,
          description: `حجز موعد تلقائي`,
          isActive: true,
          whatsappEnabled: false,
        });
        campaign = await getCampaignBySlug(input.campaignSlug);
      }
      
      if (!campaign) {
        throw new Error("Failed to create or retrieve campaign");
      }

      // Build timestamp fields based on initial status
      const now = new Date();
      const statusTimestamps: Record<string, Date> = {};
      const initialStatus = input.status || "pending";
      if (initialStatus === 'contacted') statusTimestamps.contactedAt = now;
      else if (initialStatus === 'confirmed') statusTimestamps.confirmedAt = now;
      else if (initialStatus === 'attended') statusTimestamps.attendedAt = now;
      else if (initialStatus === 'completed') statusTimestamps.completedAt = now;
      else if (initialStatus === 'cancelled') statusTimestamps.cancelledAt = now;

      // Create appointment
      const result = await createAppointment({
        campaignId: campaign.id,
        doctorId: input.doctorId,
        fullName: input.fullName,
        phone: normalizedPhone,
        email: input.email,
        age: input.age,
        gender: input.gender,
        procedure: input.procedure,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        additionalNotes: input.additionalNotes,
        patientMessage: input.patientMessage,
        status: initialStatus,
        source: input.source || "direct",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmTerm: input.utmTerm,
        utmContent: input.utmContent,
        utmPlacement: input.utmPlacement,
        referrer: input.referrer,
        fbclid: input.fbclid,
        gclid: input.gclid,
        ...statusTimestamps,
      });

      // Send email notification
      const doctor = await getDoctorById(input.doctorId);
      await sendNewAppointmentEmail({
        appointment: {
          ...input,
          doctorName: doctor?.name || "غير محدد",
          doctorSpecialty: doctor?.specialty || "",
        },
        campaign: campaign.name,
      });

      // Send WhatsApp message if enabled
      if (campaign.whatsappEnabled && campaign.whatsappWelcomeMessage) {
        await sendWelcomeMessage({
          phone: input.phone,
          fullName: input.fullName,
          campaignName: campaign.name,
          welcomeMessage: campaign.whatsappWelcomeMessage,
        });
      }

      // Notify owner
      const ownerNotifyParts = [
        `تم حجز موعد جديد من ${input.fullName} مع ${doctor?.name || "غير محدد"}`,
        `الهاتف: ${input.phone}`,
      ];
      if (input.procedure) ownerNotifyParts.push(`الإجراء: ${input.procedure}`);
      if (input.patientMessage) ownerNotifyParts.push(`رسالة المريض: ${input.patientMessage}`);
      await notifyOwner({
        title: "حجز موعد جديد",
        content: ownerNotifyParts.join(" | "),
      });

      // Send Telegram notification
      await sendNewAppointmentTelegram({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        doctorName: doctor?.name || "غير محدد",
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        procedure: input.procedure,
        patientMessage: input.patientMessage,
      });

      // Send automated booking confirmation message (Patient Journey) via dispatcher
      if (result) {
        dispatchWhatsAppMessage({
          entityType: "appointment",
          triggerEvent: "on_create",
          phone: input.phone,
          recipientName: input.fullName,
          variables: {
            name: input.fullName,
            doctor: doctor?.name || "غير محدد",
            date: input.preferredDate || "غير محدد",
            time: input.preferredTime || "غير محدد",
            service: input.procedure || "فحص عام",
          },
          entityId: result.insertId,
        }).catch(error => {
          console.error("[WhatsApp Dispatcher] Failed to send appointment on_create:", error);
        });
      }

      // Send Facebook Conversions API event (fire-and-forget)
      // لا تُرسَل بيانات طبية حساسة وفق سياسة Meta لمزودي الرعاية الصحية
      sendAppointmentLeadEvent({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        clientIpAddress: ctx.req.ip || (ctx.req.socket as any)?.remoteAddress,
        clientUserAgent: ctx.req.headers["user-agent"] as string,
        fbc: ctx.req.cookies?.["_fbc"],
        fbp: ctx.req.cookies?.["_fbp"],
        eventSourceUrl: input.referrer,
        eventId: `appt_${result?.insertId || Date.now()}`,
      }).catch((err) => console.error("[CAPI] Appointment lead error:", err));

      // Invalidate appointment caches after new submission
      serverCache.invalidateByPrefix("paginated:appointments:");
      serverCache.invalidate("list:appointments");
      serverCache.invalidate(CacheKeys.appointmentStats());

      return result;
    }),

  list: protectedProcedure.query(async () => {
    return serverCache.getOrCompute(
      "list:appointments",
      CacheTTL.LIST,
      () => getAllAppointments()
    );
  }),

  listPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100000).default(20),
      searchTerm: z.string().optional(),
      doctorIds: z.array(z.number()).optional(),
      sources: z.array(z.string()).optional(),
      statuses: z.array(z.string()).optional(),
      dateFilter: z.enum(["all", "today", "week", "month"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const cacheKey = CacheKeys.appointmentsPaginated(input);
      return serverCache.getOrCompute(
        cacheKey,
        CacheTTL.PAGINATED,
        async () => {
          const { getAppointmentsPaginated } = await import('../db');
          return getAppointmentsPaginated(
            input.page,
            input.limit,
            input.searchTerm,
            input.doctorIds,
            input.sources,
            input.statuses,
            input.dateFilter,
            input.dateFrom,
            input.dateTo
          );
        }
      );
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
      staffNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get old status for audit log
      const dbForAudit = await getDb();
      let oldStatus = '';
      if (dbForAudit) {
        const [old] = await dbForAudit.select({ status: appointments.status }).from(appointments).where(eq(appointments.id, input.id)).limit(1);
        oldStatus = old?.status || '';
      }

      await updateAppointmentStatus(input.id, input.status, input.staffNotes);

      // Create audit log
      await createAuditLog({
        entityType: 'appointment',
        entityId: input.id,
        action: 'status_change',
        oldValue: oldStatus,
        newValue: input.status,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        notes: input.staffNotes,
      });
      
      // Invalidate appointment caches after status update
      serverCache.invalidateByPrefix("paginated:appointments:");
      serverCache.invalidate("list:appointments");
      serverCache.invalidate(CacheKeys.appointmentStats());

      // ── Send CAPI funnel event for status change (fire-and-forget) ────────────
      // يُرسَل الحدث المناسب لكل مرحلة في مسار المبيعات
      // لا تُرسَل بيانات طبية حساسة وفق سياسة Meta لمزودي الرعاية الصحية
      {
        const dbForCapi = await getDb();
        if (dbForCapi) {
          const [apptRow] = await dbForCapi
            .select({ fullName: appointments.fullName, phone: appointments.phone, email: appointments.email })
            .from(appointments)
            .where(eq(appointments.id, input.id))
            .limit(1);
          if (apptRow?.phone) {
            sendStatusChangeEvent({
              status: input.status,
              fullName: apptRow.fullName || "",
              phone: apptRow.phone,
              email: apptRow.email || undefined,
              serviceType: "appointment",
              bookingId: input.id,
            }).catch((err) => console.error("[CAPI] Status change error:", err));
          }
        }
      }

      // ── WhatsApp Dispatcher: إرسال رسالة تلقائية بناءً على الحالة الجديدة ──
      {
        const db = await getDb();
        if (db) {
          const [appt] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
          if (appt?.phone) {
            const doctor = await getDoctorById(appt.doctorId || 0);
            const triggerMap: Record<string, string> = {
              "confirmed": "on_confirmed",
              "مؤكد": "on_confirmed",
              "attended": "on_arrived",
              "حضر": "on_arrived",
              "completed": "on_completed",
              "مكتمل": "on_completed",
              "cancelled": "on_cancelled",
              "ملغي": "on_cancelled",
            };
            const triggerEvent = triggerMap[input.status];
            if (triggerEvent) {
              dispatchWhatsAppMessage({
                entityType: "appointment",
                triggerEvent: triggerEvent as any,
                phone: appt.phone,
                recipientName: appt.fullName || undefined,
                variables: {
                  name: appt.fullName || "المريض",
                  doctor: doctor?.name || "غير محدد",
                  date: appt.preferredDate || "غير محدد",
                  time: appt.preferredTime || "غير محدد",
                  service: appt.procedure || "فحص عام",
                },
                entityId: input.id,
                sentBy: ctx.user?.id,
              }).catch(err => console.error("[WhatsApp Dispatcher] Appointment status trigger error:", err));
            }
            // Legacy: Send welcome message when status changes to attended
            if (input.status === "حضر" || input.status === "attended") {
              const { sendPatientArrivalWelcome } = await import("../messaging");
              sendPatientArrivalWelcome({
                phone: appt.phone,
                name: appt.fullName || "المريض",
                doctor: doctor?.name || "غير محدد",
                time: appt.preferredTime || "غير محدد",
              }).catch(err => console.error("[WhatsApp] Arrival welcome error:", err));
            }
          }
        }
      }
      
      return { success: true };
    }),

  updateAppointment: protectedProcedure
    .input(z.object({
      id: z.number(),
      appointmentDate: z.string().optional(),
      status: z.string().optional(),
      staffNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.appointmentDate) {
        updateData.appointmentDate = new Date(input.appointmentDate);
      }
      if (input.status) {
        updateData.status = input.status;
      }
      if (input.staffNotes !== undefined) {
        updateData.staffNotes = input.staffNotes;
      }

      await db.update(appointments).set(updateData).where(eq(appointments.id, input.id));

      // Invalidate appointment caches after update
      serverCache.invalidateByPrefix("paginated:appointments:");
      serverCache.invalidate("list:appointments");

      return { success: true };
    }),

  // Send patient arrival welcome message
  sendArrivalWelcome: protectedProcedure
    .input(z.object({
      appointmentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get appointment details
      const appointment = await db.select().from(appointments).where(eq(appointments.id, input.appointmentId)).limit(1);
      if (appointment.length === 0) {
        throw new Error("الحجز غير موجود");
      }

      const appt = appointment[0];
      const doctor = await getDoctorById(appt.doctorId);

      // Send automated arrival welcome message
      const { sendPatientArrivalWelcome, formatTimeForMessage } = await import("../messaging");
      const result = await sendPatientArrivalWelcome({
        phone: appt.phone,
        name: appt.fullName,
        doctor: doctor?.name || "غير محدد",
        time: appt.appointmentDate ? formatTimeForMessage(new Date(appt.appointmentDate)) : "غير محدد",
      });

      return result;
    }),

  // Bulk update appointment statuses
  bulkUpdateStatus: protectedProcedure
    .input(z.object({
      ids: z.array(z.number()),
      status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]),
      staffNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await bulkUpdateAppointmentStatus(input.ids, input.status, input.staffNotes);

      // Create audit logs for bulk update
      for (const id of input.ids) {
        await createAuditLog({
          entityType: 'appointment',
          entityId: id,
          action: 'bulk_status_change',
          newValue: input.status,
          userId: ctx.user?.id,
          userName: ctx.user?.name,
          notes: input.staffNotes,
        });
      }

      // Invalidate appointment caches after bulk update
      serverCache.invalidateByPrefix("paginated:appointments:");
      serverCache.invalidate("list:appointments");
      serverCache.invalidate(CacheKeys.appointmentStats());

      return result;
    }),

  // Generate and save receipt number
  generateReceiptNumber: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if receipt number already exists
      const [appointment] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
      if (!appointment) {
        throw new Error("الحجز غير موجود");
      }

      // If already has receipt number, return it
      if (appointment.receiptNumber) {
        return { receiptNumber: appointment.receiptNumber };
      }

      // Generate new receipt number
      const year = new Date().getFullYear();
      
      // Get the count of appointments with receipt numbers this year
      const { sql } = await import("drizzle-orm");
      const [result] = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM appointments 
        WHERE receiptNumber LIKE CONCAT('SGH-', ${year}, '-%')
      `);
      
      const count = (result as any).count || 0;
      const sequenceNumber = count + 1;
      const paddedNumber = String(sequenceNumber).padStart(3, '0');
      const receiptNumber = `SGH-${year}-${paddedNumber}`;

      // Save receipt number
       await db.update(appointments).set({ receiptNumber }).where(eq(appointments.id, input.id));
      return { receiptNumber };
    }),

  // Delete appointment (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(appointments).where(eq(appointments.id, input.id));
      // Invalidate appointment caches after deletion
      serverCache.invalidateByPrefix("paginated:appointments:");
      serverCache.invalidate("list:appointments");
      serverCache.invalidate(CacheKeys.appointmentStats());
      return { success: true };
    }),
});
