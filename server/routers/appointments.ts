import { z } from "zod";
import { eq } from "drizzle-orm";
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
} from "../db";
import { notifyOwner } from "../_core/notification";
import { sendNewAppointmentEmail } from "../email";
import { sendWelcomeMessage } from "../whatsapp";
import { sendNewAppointmentTelegram } from "../telegram";

export const appointmentsRouter = router({
  submit: publicProcedure
    .input(z.object({
      fullName: z.string(),
      phone: z.string(),
      email: z.string().optional(),
      doctorId: z.number(),
      age: z.number().optional(),
      procedure: z.string().optional(),
      preferredDate: z.string().optional(),
      preferredTime: z.string().optional(),
      additionalNotes: z.string().optional(),
      campaignSlug: z.string(),
      source: z.string().optional(),
      status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
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
    .mutation(async ({ input }) => {
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

      // Create appointment
      const appointment = await createAppointment({
        campaignId: campaign.id,
        doctorId: input.doctorId,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        age: input.age,
        procedure: input.procedure,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        additionalNotes: input.additionalNotes,
        status: input.status || "pending",
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
      await notifyOwner({
        title: "حجز موعد جديد",
        content: `تم حجز موعد جديد من ${input.fullName} مع ${doctor?.name || "غير محدد"}`,
      });

      // Send Telegram notification
      await sendNewAppointmentTelegram({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        doctorName: doctor?.name || "غير محدد",
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
      });

      // Send automated booking confirmation message (Patient Journey)
      if (appointment) {
        const { sendBookingConfirmationInteractive } = await import("../messaging");
        sendBookingConfirmationInteractive({
          phone: input.phone,
          name: input.fullName,
          date: input.preferredDate || "غير محدد",
          time: input.preferredTime || "غير محدد",
          doctor: doctor?.name || "غير محدد",
          service: input.procedure || "فحص عام",
          bookingId: appointment.insertId,
          bookingType: "appointment",
        }).catch(error => {
          console.error("[WhatsApp] Failed to send booking confirmation:", error);
        });
      }

      return appointment;
    }),

  list: protectedProcedure.query(async () => {
    return getAllAppointments();
  }),

  listPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100000).default(20),
      searchTerm: z.string().optional(),
      doctorId: z.number().optional(),
      source: z.string().optional(),
      status: z.string().optional(),
      dateFilter: z.enum(["all", "today", "week", "month"]).optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const { getAppointmentsPaginated } = await import('../db');
      return getAppointmentsPaginated(
        input.page,
        input.limit,
        input.searchTerm,
        input.doctorId,
        input.source,
        input.status,
        input.dateFilter,
        input.dateFrom,
        input.dateTo
      );
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.string(),
      staffNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await updateAppointmentStatus(input.id, input.status, input.staffNotes);
      
      // Send welcome message when status changes to "attended" (Patient Journey)
      if (input.status === "حضر" || input.status === "attended") {
        const db = await getDb();
        if (db) {
          const [appointment] = await db.select().from(appointments).where(eq(appointments.id, input.id)).limit(1);
          if (appointment && appointment.phone) {
            const { sendPatientArrivalWelcome } = await import("../messaging");
            const doctor = await getDoctorById(appointment.doctorId || 0);
            await sendPatientArrivalWelcome({
              phone: appointment.phone,
              name: appointment.fullName || "المريض",
              doctor: doctor?.name || "غير محدد",
              time: appointment.preferredTime || "غير محدد",
            });
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
      status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      staffNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await bulkUpdateAppointmentStatus(input.ids, input.status, input.staffNotes);
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
});
