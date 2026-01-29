import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { appointments, users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
  createLead, 
  getCampaignBySlug, 
  getAllLeads, 
  getLeadById, 
  updateLead,
  createLeadStatusHistory,
  getLeadStatusHistory,
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  getLeadsStats,
  getCampaignStats,
  searchLeads,
  getLeadsByCampaign,
  getAllDoctors,
  getDoctorById,
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  getAllAccessRequests,
  getPendingAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { offersRouter } from "./routers/offers";
import { campsRouter } from "./routers/camps";
import { offerLeadsRouter } from "./routers/offerLeads";
import { campRegistrationsRouter } from "./routers/campRegistrations";
import { doctorsRouter } from "./routers/doctors";
import { usersRouter } from "./routers/users";
import { reportsRouter } from "./routers/reports";
import { campaignsRouter } from "./routers/campaigns";
import { tasksRouter } from "./routers/tasks";
import { whatsappRouter } from "./routers/whatsapp";
import { messageSettingsRouter } from "./routers/messageSettings";
import { webhooksRouter } from "./routers/webhooks";

import { sendNewLeadNotification, sendNewAppointmentEmail } from "./email";
import { trackLead, trackCompleteRegistration } from "./facebookConversion";
import { sendWelcomeMessage, sendBookingConfirmation, sendCustomMessage } from "./whatsapp";
import { sendNewLeadTelegram, sendNewAppointmentTelegram } from "./telegram";
import { getCombinedSocialMediaStats } from "./metaGraphAPI";
import { runDeactivationJobs } from "./cron/deactivateExpired";

export const appRouter = router({
  campaigns: campaignsRouter,
  tasks: tasksRouter,
  system: systemRouter,
  whatsapp: whatsappRouter,
  messageSettings: messageSettingsRouter,
  webhooks: webhooksRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').optional(),
        email: z.string().email('بريد إلكتروني غير صحيح').optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error('فشل الاتصال بقاعدة البيانات');

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.email !== undefined) updateData.email = input.email;

        if (Object.keys(updateData).length === 0) {
          throw new Error('لا توجد بيانات للتحديث');
        }

        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));

        // Return updated user
        const updatedUser = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        return updatedUser[0];
      }),
  }),

  // Leads management
  leads: router({
    // Public endpoint for lead submission from landing page
    submit: publicProcedure
      .input(z.object({
        campaignSlug: z.string(),
        fullName: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer", "pending", "confirmed", "completed", "cancelled"]).optional(),
        source: z.string().optional(), // Auto-detected source from UTM
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
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

        // Create lead
        await createLead({
          campaignId: campaign.id,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          notes: input.notes,
          status: input.status || "new",
          source: input.source || "direct", // Use auto-detected source or default to direct
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          emailSent: false,
          whatsappSent: false,
          bookingConfirmationSent: false,
        });

         // Track Facebook Conversion API - Lead (DISABLED to avoid account restrictions)
        // await trackLead({
        //   email: input.email,
        //   phone: input.phone,
        //   firstName: input.fullName.split(' ')[0],
        //   contentName: campaign.name,
        // });

        // Send notification to owner
        await notifyOwner({
          title: "تسجيل جديد في المخيم الطبي الخيري",
          content: `تم تسجيل عميل جديد:
الاسم: ${input.fullName}
الهاتف: ${input.phone}
البريد: ${input.email || "غير متوفر"}`,
        });

        // Send Telegram notification
        await sendNewLeadTelegram({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          source: input.utmSource || "direct",
        });

        // Send email notification
        await sendNewLeadNotification({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          campaignName: campaign.name,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          createdAt: new Date(),
        });

        // Send WhatsApp welcome message if enabled
        if (campaign.whatsappEnabled) {
          await sendWelcomeMessage({
            phone: input.phone,
            fullName: input.fullName,
            campaignName: campaign.name,
            welcomeMessage: campaign.whatsappWelcomeMessage || undefined,
          });
        }

        // Track Facebook Conversion API - CompleteRegistration (DISABLED to avoid account restrictions)
        // await trackCompleteRegistration({
        //   email: input.email,
        //   phone: input.phone,
        //   firstName: input.fullName.split(' ')[0],
        //   contentName: campaign.name,
        // });

        return { success: true };
      }),

    // Admin endpoints
    list: protectedProcedure.query(async () => {
      return getAllLeads();
    }),

    // Unified list from all sources
    unifiedList: protectedProcedure.query(async () => {
      const { getAllUnifiedLeads } = await import('./db');
      return getAllUnifiedLeads();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getLeadById(input.id);
      }),

    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return searchLeads(input.searchTerm);
      }),

    getByCampaign: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return getLeadsByCampaign(input.campaignId);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const lead = await getLeadById(input.id);
        if (!lead) {
          throw new Error("Lead not found");
        }

        // Update lead status
        await updateLead(input.id, { status: input.status });

        // Create status history
        await createLeadStatusHistory({
          leadId: input.id,
          userId: ctx.user.id,
          oldStatus: lead.status,
          newStatus: input.status,
          notes: input.notes,
        });

        return { success: true };
      }),

    getStatusHistory: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return getLeadStatusHistory(input.leadId);
      }),

    stats: protectedProcedure.query(async () => {
      return getLeadsStats();
    }),

    sendWhatsApp: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const lead = await getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        const success = await sendCustomMessage(lead.phone, input.message);
        
        if (success) {
          await updateLead(input.leadId, {
            whatsappSent: true,
          });
        }

        return { success };
      }),

    sendBookingConfirmation: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        appointmentDate: z.string().optional(),
        appointmentTime: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const lead = await getLeadById(input.leadId);
        if (!lead) {
          throw new Error("Lead not found");
        }

        const success = await sendBookingConfirmation({
          phone: lead.phone,
          fullName: lead.fullName,
          appointmentDate: input.appointmentDate,
          appointmentTime: input.appointmentTime,
        });

        if (success) {
          await updateLead(input.leadId, {
            bookingConfirmationSent: true,
          });
        }

        return { success };
      }),
  }),

  // Doctors router
  doctors: doctorsRouter,

  // Appointments router
  appointments: router({
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
        source: z.string().optional(), // Auto-detected source from UTM
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
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
          status: "pending",
          source: input.source || "direct", // Use auto-detected source or default to direct
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
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
          const { sendBookingConfirmationInteractive } = await import("./messaging");
          await sendBookingConfirmationInteractive({
            phone: input.phone,
            name: input.fullName,
            date: input.preferredDate || "غير محدد",
            time: input.preferredTime || "غير محدد",
            doctor: doctor?.name || "غير محدد",
            service: input.procedure || "فحص عام",
            bookingId: appointment.insertId,
            bookingType: "appointment",
          });
        }

        return appointment;
      }),

    list: protectedProcedure.query(async () => {
      return getAllAppointments();
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
              const { sendPatientArrivalWelcome } = await import("./messaging");
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
        const { sendPatientArrivalWelcome, formatTimeForMessage } = await import("./messaging");
        const result = await sendPatientArrivalWelcome({
          phone: appt.phone,
          name: appt.fullName,
          doctor: doctor?.name || "غير محدد",
          time: appt.appointmentDate ? formatTimeForMessage(new Date(appt.appointmentDate)) : "غير محدد",
        });

        return result;
      }),
  }),

  // Offers management
  offers: offersRouter,

  // Camps management
  camps: campsRouter,

  // Offer leads management
  offerLeads: offerLeadsRouter,

  // Camp registrations management
  campRegistrations: campRegistrationsRouter,

  // Social Media Insights
  socialMedia: router({
    getStats: protectedProcedure.query(async () => {
      const stats = await getCombinedSocialMediaStats();
      return stats;
    }),
  }),

  accessRequests: router({
    list: protectedProcedure.query(async () => {
      return getAllAccessRequests();
    }),

    pending: protectedProcedure.query(async () => {
      return getPendingAccessRequests();
    }),

    approve: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await approveAccessRequest(input.requestId, ctx.user.id);
        
        // Notify owner
        await notifyOwner({
          title: "تم الموافقة على طلب تصريح",
          content: `تمت الموافقة على طلب التصريح رقم ${input.requestId}`,
        });
        
        return { success: true };
      }),

    reject: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await rejectAccessRequest(input.requestId, ctx.user.id);
        return { success: true };
      }),
   }),
  
  // Users management (admin only)
  users: usersRouter,

  // Reports (admin only)
  reports: reportsRouter,

  // Cron jobs (admin only)
  cron: router({
    // Run deactivation jobs manually
    runDeactivation: protectedProcedure.mutation(async () => {
      const result = await runDeactivationJobs();
      return result;
    }),
  }),
});
export type AppRouter = typeof appRouter;
