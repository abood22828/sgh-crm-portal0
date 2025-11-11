import { z } from "zod";
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
import { sendNewLeadNotification, sendNewAppointmentEmail } from "./email";
import { trackLead, trackCompleteRegistration } from "./facebookConversion";
import { sendWelcomeMessage, sendBookingConfirmation, sendCustomMessage } from "./whatsapp";
import { offersRouter } from "./routers/offers";

export const appRouter = router({
  system: systemRouter,
  offers: offersRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get campaign by slug
        const campaign = await getCampaignBySlug(input.campaignSlug);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        // Create lead
        await createLead({
          campaignId: campaign.id,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          status: "new",
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          emailSent: false,
          whatsappSent: false,
          bookingConfirmationSent: false,
        });

         // Track Facebook Conversion API - Lead
        await trackLead({
          email: input.email,
          phone: input.phone,
          firstName: input.fullName.split(' ')[0],
          contentName: campaign.name,
        });

        // Send notification to owner
        await notifyOwner({
          title: "تسجيل جديد في المخيم الطبي الخيري",
          content: `تم تسجيل عميل جديد:
الاسم: ${input.fullName}
الهاتف: ${input.phone}
البريد: ${input.email || "غير متوفر"}`,
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

        // Track Facebook Conversion API - CompleteRegistration
        await trackCompleteRegistration({
          email: input.email,
          phone: input.phone,
          firstName: input.fullName.split(' ')[0],
          contentName: campaign.name,
        });

        return { success: true };
      }),

    // Admin endpoints
    list: protectedProcedure.query(async () => {
      return getAllLeads();
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

  // Campaigns management
  campaigns: router({
    list: protectedProcedure.query(async () => {
      return getAllCampaigns();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCampaignById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        metaPixelId: z.string().optional(),
        whatsappEnabled: z.boolean().optional(),
        whatsappWelcomeMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createCampaign(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
        metaPixelId: z.string().optional(),
        whatsappEnabled: z.boolean().optional(),
        whatsappWelcomeMessage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateCampaign(id, data);
      }),

    stats: protectedProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        return getCampaignStats(input.campaignId);
      }),
  }),

  // Doctors router
  doctors: router({
    list: publicProcedure.query(async () => {
      return getAllDoctors();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getDoctorById(input.id);
      }),
  }),

  // Appointments router
  appointments: router({
    submit: publicProcedure
      .input(z.object({
        fullName: z.string(),
        phone: z.string(),
        email: z.string().optional(),
        doctorId: z.number(),
        preferredDate: z.string().optional(),
        preferredTime: z.string().optional(),
        notes: z.string().optional(),
        campaignSlug: z.string(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get campaign by slug
        const campaign = await getCampaignBySlug(input.campaignSlug);
        if (!campaign) {
          throw new Error("Campaign not found");
        }

        // Create appointment
        const appointment = await createAppointment({
          campaignId: campaign.id,
          doctorId: input.doctorId,
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          preferredDate: input.preferredDate,
          preferredTime: input.preferredTime,
          notes: input.notes,
          status: "pending",
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
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

        return appointment;
      }),

    list: protectedProcedure.query(async () => {
      return getAllAppointments();
    }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.string(),
      }))
      .mutation(async ({ input }) => {
        await updateAppointmentStatus(input.id, input.status);
        return { success: true };
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
});

export type AppRouter = typeof appRouter;
