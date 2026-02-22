import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
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
import { commentsRouter } from "./routers/comments";
import { followUpTasksRouter } from "./routers/followUpTasks";
import { appointmentsRouter } from "./routers/appointments";

import { sendNewLeadNotification } from "./email";
import { trackLead, trackCompleteRegistration } from "./facebookConversion";
import { sendWelcomeMessage, sendBookingConfirmation, sendCustomMessage } from "./whatsapp";
import { sendNewLeadTelegram } from "./telegram";
import { getCombinedSocialMediaStats } from "./metaGraphAPI";
import { runDeactivationJobs } from "./cron/deactivateExpired";
import { queueRouter } from "./routers/queue";
import { generatePDF, type ExportMetadata } from "./pdfService";

export const appRouter = router({
  campaigns: campaignsRouter,
  tasks: tasksRouter,
  system: systemRouter,
  whatsapp: whatsappRouter,
  messageSettings: messageSettingsRouter,
  webhooks: webhooksRouter,
  queue: queueRouter,
  
  // User Preferences
  preferences: router({
    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ ctx, input }) => {
        const { getUserPreference } = await import("./db");
        const pref = await getUserPreference(ctx.user.id, input.key);
        return pref ? JSON.parse(pref.preferenceValue) : null;
      }),
    
    set: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.any(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { setUserPreference } = await import("./db");
        await setUserPreference(
          ctx.user.id,
          input.key,
          JSON.stringify(input.value)
        );
        return { success: true };
      }),
    
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        const { getAllUserPreferences } = await import("./db");
        const prefs = await getAllUserPreferences(ctx.user.id);
        return prefs.reduce((acc, pref) => {
          acc[pref.preferenceKey] = JSON.parse(pref.preferenceValue);
          return acc;
        }, {} as Record<string, any>);
      }),
  }),

  // Shared Column Templates (admin-managed, visible to all)
  sharedTemplates: router({
    list: protectedProcedure
      .input(z.object({ tableKey: z.string() }))
      .query(async ({ input }) => {
        const { getSharedTemplates } = await import("./db");
        const templates = await getSharedTemplates(input.tableKey);
        return templates.map(t => ({
          ...t,
          columns: JSON.parse(t.columns),
        }));
      }),

    listAll: protectedProcedure
      .query(async () => {
        const { getAllSharedTemplates } = await import("./db");
        const templates = await getAllSharedTemplates();
        return templates.map(t => ({
          ...t,
          columns: JSON.parse(t.columns),
        }));
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        tableKey: z.string(),
        columns: z.record(z.string(), z.boolean()),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can create shared templates
        if (ctx.user.role !== 'admin') {
          throw new Error('غير مصرح لك بإنشاء قوالب مشتركة');
        }
        const { createSharedTemplate } = await import("./db");
        await createSharedTemplate({
          name: input.name,
          tableKey: input.tableKey,
          columns: JSON.stringify(input.columns),
          createdBy: ctx.user.id,
          createdByName: ctx.user.name || null,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can delete shared templates
        if (ctx.user.role !== 'admin') {
          throw new Error('غير مصرح لك بحذف قوالب مشتركة');
        }
        const { deleteSharedTemplate } = await import("./db");
        await deleteSharedTemplate(input.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        columns: z.record(z.string(), z.boolean()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can update shared templates
        if (ctx.user.role !== 'admin') {
          throw new Error('غير مصرح لك بتعديل قوالب مشتركة');
        }
        const { updateSharedTemplate } = await import("./db");
        await updateSharedTemplate(input.id, {
          name: input.name,
          columns: input.columns ? JSON.stringify(input.columns) : undefined,
        });
        return { success: true };
      }),
  }),
  
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
  appointments: appointmentsRouter,

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

  // Comments system
  comments: commentsRouter,
  followUpTasks: followUpTasksRouter,

  // Export to PDF
  export: router({
    generatePDF: protectedProcedure
      .input(z.object({
        metadata: z.object({
          tableName: z.string(),
          dateRange: z.string().optional(),
          filters: z.record(z.string(), z.unknown()).optional(),
          totalRecords: z.number(),
          exportedRecords: z.number(),
          exportDate: z.string(),
          exportedBy: z.string(),
        }),
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
        })),
        data: z.array(z.record(z.string(), z.any())),
      }))
      .mutation(async ({ input }) => {
        try {
          const pdfBuffer = await generatePDF({
            metadata: input.metadata,
            columns: input.columns,
            data: input.data,
          });

          // تحويل Buffer إلى base64 للإرسال عبر tRPC
          const base64 = pdfBuffer.toString('base64');
          return { success: true, pdf: base64 };
        } catch (error) {
          console.error('PDF generation error:', error);
          throw new Error('فشل إنشاء ملف PDF');
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
