import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { 
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
import { leadsRouter } from "./routers/leads";


import { getCombinedSocialMediaStats } from "./metaGraphAPI";
import { runDeactivationJobs } from "./cron/deactivateExpired";
import { queueRouter } from "./routers/queue";
import { customersRouter } from "./routers/customers";
import { auditLogsRouter } from "./routers/auditLogs";
import { savedFiltersRouter } from "./routers/savedFilters";
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
  leads: leadsRouter,

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

  // Customer profiles (unified)
  customers: customersRouter,

  // Audit logs
  auditLogs: auditLogsRouter,

  // Saved filters
  savedFilters: savedFiltersRouter,

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
