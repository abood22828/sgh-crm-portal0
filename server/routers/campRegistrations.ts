import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, gte } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campRegistrations } from "../../drizzle/schema";
import { sendNewCampRegistrationTelegram } from "../telegram";
import { serverCache, CacheKeys, CacheTTL } from "../cache";
import { createAuditLog } from "./auditLogs";
import { sendCampRegistrationEvent, sendStatusChangeEvent } from "../facebookCAPI";
import { normalizePhoneNumber } from "../db";
// sendCampRegistrationConfirmation moved to dispatchWhatsAppMessage flow
import { dispatchWhatsAppMessage } from "../services/whatsappMessageDispatcher";

export const campRegistrationsRouter = router({
  // Submit a new camp registration (public)
  submit: publicProcedure
    .input(
      z.object({
        campId: z.number(),
        fullName: z.string().min(1),
        phone: z.string().min(9).regex(
          /^(\+?967)?7\d{8}$|^07\d{8}$|^7\d{8}$/,
          "رقم الهاتف يجب أن يبدأ بالرقم 7 ويتكون من 9 أرقام"
        ),
        email: z.string().email().optional(),
        age: z.number().optional(),
        gender: z.enum(["male", "female"]).optional(),
        procedures: z.string().optional(), // JSON string of selected procedures
        medicalCondition: z.string().optional(),
        patientMessage: z.string().max(500).optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
        status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]).optional(), // Manual registration status
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmTerm: z.string().optional(),
        utmContent: z.string().optional(),
        utmPlacement: z.string().optional(),
        referrer: z.string().optional(),
        fbclid: z.string().optional(),
        gclid: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedPhone = normalizePhoneNumber(input.phone);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // التحقق من عدم تكرار التسجيل بنفس الرقم ونفس المخيم خلال 3 أيام - معطل
      // const threeDaysAgo = new Date();
      // threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      // const allRegs = await db
      //   .select({ id: campRegistrations.id, phone: campRegistrations.phone })
      //   .from(campRegistrations)
      //   .where(
      //     and(
      //       eq(campRegistrations.campId, input.campId),
      //       gte(campRegistrations.createdAt, threeDaysAgo)
      //     )
      //   )
      //   .limit(100);
      // const existingReg = allRegs.filter(r => normalizePhoneNumber(r.phone) === normalizedPhone);
      // if (existingReg.length > 0) {
      //   throw new TRPCError({
      //     code: "CONFLICT",
      //     message: "لقد تم تسجيل طلب بنفس رقم الهاتف لهذا المخيم خلال الأيام الثلاثة الماضية",
      //   });
      // }

      // Build timestamp fields based on initial status
      const nowCamp = new Date();
      const campStatusTimestamps: Record<string, Date> = {};
      const campInitialStatus = input.status || "pending";
      if (campInitialStatus === 'contacted') campStatusTimestamps.contactedAt = nowCamp;
      else if (campInitialStatus === 'confirmed') campStatusTimestamps.confirmedAt = nowCamp;
      else if (campInitialStatus === 'attended') campStatusTimestamps.attendedAt = nowCamp;
      else if (campInitialStatus === 'completed') campStatusTimestamps.completedAt = nowCamp;
      else if (campInitialStatus === 'cancelled') campStatusTimestamps.cancelledAt = nowCamp;

      const [registration] = await db.insert(campRegistrations).values({
        campId: input.campId,
        fullName: input.fullName,
        phone: normalizedPhone,
        email: input.email,
        age: input.age,
        gender: input.gender,
        procedures: input.procedures,
        medicalCondition: input.medicalCondition,
        patientMessage: input.patientMessage,
        notes: input.notes,
        source: input.source || "website",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmTerm: input.utmTerm,
        utmContent: input.utmContent,
        utmPlacement: input.utmPlacement,
        referrer: input.referrer,
        fbclid: input.fbclid,
        gclid: input.gclid,
        status: campInitialStatus,
        ...campStatusTimestamps,
      });

      // Get camp details for notification
      const { camps } = await import("../../drizzle/schema");
      const [camp] = await db.select().from(camps).where(eq(camps.id, input.campId)).limit(1);

      // Send Telegram notification
      if (camp) {
        await sendNewCampRegistrationTelegram({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          campTitle: camp.name,
          age: input.age,
          procedures: input.procedures,
          patientMessage: input.patientMessage,
        });
      }

      // Send automated camp registration confirmation message (Patient Journey) via dispatcher
      // Run in background - don't block the response
      if (camp) {
        dispatchWhatsAppMessage({
          entityType: "camp_registration",
          triggerEvent: "on_create",
          phone: input.phone,
          recipientName: input.fullName,
          variables: {
            name: input.fullName,
            campName: camp.name,
            date: camp.startDate ? new Date(camp.startDate).toLocaleDateString("ar-YE") : "غير محدد",
            location: "المستشفى السعودي الألماني - صنعاء",
          },
          entityId: Number(registration.insertId),
        }).catch(error => {
          console.error("[WhatsApp Dispatcher] Failed to send camp registration on_create:", error);
        });
      }

      // Send Facebook Conversions API event (fire-and-forget)
      // لا تُرسَل بيانات طبية حساسة وفق سياسة Meta لمزودي الرعاية الصحية
      sendCampRegistrationEvent({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        clientIpAddress: ctx.req.ip || (ctx.req.socket as any)?.remoteAddress,
        clientUserAgent: ctx.req.headers["user-agent"] as string,
        fbc: ctx.req.cookies?.["_fbc"],
        fbp: ctx.req.cookies?.["_fbp"],
        eventSourceUrl: input.referrer,
        eventId: `camp_${registration?.insertId || Date.now()}`,
      }).catch((err) => console.error("[CAPI] Camp registration error:", err));

      // Invalidate camp registration caches after new submission
      serverCache.invalidateByPrefix("paginated:campRegistrations:");
      serverCache.invalidate("list:campRegistrations");
      serverCache.invalidate(CacheKeys.campRegistrationStats());

      return { success: true, id: registration.insertId };
    }),

  // List all camp registrations (protected)
  list: protectedProcedure.query(async () => {
    return serverCache.getOrCompute(
      "list:campRegistrations",
      CacheTTL.LIST,
      async () => {
        const db = await getDb();
        if (!db) return [];

        const { camps } = await import("../../drizzle/schema");
        
        const results = await db
          .select({
            id: campRegistrations.id,
            campId: campRegistrations.campId,
            campName: camps.name,
            fullName: campRegistrations.fullName,
            phone: campRegistrations.phone,
            email: campRegistrations.email,
            age: campRegistrations.age,
            procedures: campRegistrations.procedures,
            medicalCondition: campRegistrations.medicalCondition,
            notes: campRegistrations.notes,
            source: campRegistrations.source,
            status: campRegistrations.status,
            createdAt: campRegistrations.createdAt,
            updatedAt: campRegistrations.updatedAt,
          })
          .from(campRegistrations)
          .leftJoin(camps, eq(camps.id, campRegistrations.campId))
          .orderBy(desc(campRegistrations.createdAt));

        return results;
      }
    );
  }),

  // List camp registrations with pagination (protected)
  listPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100000).default(20),
        searchTerm: z.string().optional(),
        campIds: z.array(z.number()).optional(),
        sources: z.array(z.string()).optional(),
        statuses: z.array(z.string()).optional(),
        dateFilter: z.enum(["all", "today", "week", "month"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = CacheKeys.campRegistrationsPaginated(input);
      return serverCache.getOrCompute(
        cacheKey,
        CacheTTL.PAGINATED,
        async () => {
          const { getCampRegistrationsPaginated } = await import('../db');
          return getCampRegistrationsPaginated(
            input.page,
            input.limit,
            input.searchTerm,
            input.campIds,
            input.sources,
            input.statuses,
            input.dateFilter,
            input.dateFrom,
            input.dateTo
          );
        }
      );
    }),

  // Get stats for camp registrations (protected)
  stats: protectedProcedure.query(async () => {
    return serverCache.getOrCompute(
      CacheKeys.campRegistrationStats(),
      CacheTTL.STATS,
      async () => {
        const db = await getDb();
        if (!db) return { total: 0, pending: 0, confirmed: 0, attended: 0, cancelled: 0 };

        const all = await db.select().from(campRegistrations);

        return {
          total: all.length,
          pending: all.filter((r) => r.status === "pending").length,
          confirmed: all.filter((r) => r.status === "confirmed").length,
          attended: all.filter((r) => r.status === "attended").length,
          cancelled: all.filter((r) => r.status === "cancelled").length,
        };
      }
    );
  }),

  // Update camp registration status (protected)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]),
        notes: z.string().optional(),
        fullName: z.string().optional(),
        phone: z.string().optional(),
        attendanceDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get old status for audit log
      const [old] = await db.select({ status: campRegistrations.status }).from(campRegistrations).where(eq(campRegistrations.id, input.id)).limit(1);
      const oldStatus = old?.status || '';

      const now = new Date();
      const updateData: any = {
        status: input.status,
        statusNotes: input.notes,
        updatedAt: now,
      };

      // حفظ وقت كل حالة عند التغيير
      if (input.status === 'contacted') updateData.contactedAt = now;
      else if (input.status === 'confirmed') updateData.confirmedAt = now;
      else if (input.status === 'attended') updateData.attendedAt = now;
      else if (input.status === 'completed') updateData.completedAt = now;
      else if (input.status === 'cancelled') updateData.cancelledAt = now;

      // إضافة البيانات المعدلة إذا تم توفيرها
      if (input.fullName) updateData.fullName = input.fullName;
      if (input.phone) updateData.phone = input.phone;
      if (input.attendanceDate) updateData.attendanceDate = input.attendanceDate;

      await db
        .update(campRegistrations)
        .set(updateData)
        .where(eq(campRegistrations.id, input.id));

      // Create audit log
      await createAuditLog({
        entityType: 'campRegistration',
        entityId: input.id,
        action: 'status_change',
        oldValue: oldStatus,
        newValue: input.status,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        notes: input.notes,
      });

      // ── Send CAPI funnel event for status change (fire-and-forget) ────────────
      {
        const [regRow] = await db
          .select({ fullName: campRegistrations.fullName, phone: campRegistrations.phone, email: campRegistrations.email })
          .from(campRegistrations)
          .where(eq(campRegistrations.id, input.id))
          .limit(1);
        if (regRow?.phone) {
          sendStatusChangeEvent({
            status: input.status,
            fullName: regRow.fullName || "",
            phone: regRow.phone,
            email: regRow.email || undefined,
            serviceType: "camp",
            bookingId: input.id,
          }).catch((err) => console.error("[CAPI] Camp status change error:", err));
        }
      }

      // ── WhatsApp Dispatcher: إرسال رسالة تلقائية بناءً على الحالة ──
      {
        const [reg] = await db.select().from(campRegistrations).where(eq(campRegistrations.id, input.id)).limit(1);
        if (reg?.phone) {
          const { camps } = await import("../../drizzle/schema");
          const [camp] = await db.select().from(camps).where(eq(camps.id, reg.campId)).limit(1);
          const triggerMap: Record<string, string> = {
            "confirmed": "on_confirmed",
            "attended": "on_arrived",
            "completed": "on_completed",
            "cancelled": "on_cancelled",
          };
          const triggerEvent = triggerMap[input.status];
          if (triggerEvent) {
            dispatchWhatsAppMessage({
              entityType: "camp_registration",
              triggerEvent: triggerEvent as any,
              phone: reg.phone,
              recipientName: reg.fullName || undefined,
              variables: {
                name: reg.fullName || "المسجل",
                campName: camp?.name || "المخيم",
                date: camp?.startDate ? new Date(camp.startDate).toLocaleDateString("ar-YE") : "غير محدد",
                location: "المستشفى السعودي الألماني - صنعاء",
              },
              entityId: input.id,
              sentBy: ctx.user?.id,
            }).catch(err => console.error("[WhatsApp Dispatcher] Camp status trigger error:", err));
          }
          // ملاحظة: تم إزالة sendCampPatientArrivalWelcome القديمة - dispatchWhatsAppMessage يتولى الإرسال عبر إعدادات الرسائل
        }
      }

      // Invalidate camp registration caches after status update
      serverCache.invalidateByPrefix("paginated:campRegistrations:");
      serverCache.invalidate("list:campRegistrations");
      serverCache.invalidate(CacheKeys.campRegistrationStats());

      return { success: true };
    }),

  // Bulk update status for multiple registrations (protected)
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const now = new Date();
      const updateData: any = {
        status: input.status,
        statusNotes: input.notes,
        updatedAt: now,
      };

      // حفظ وقت كل حالة عند التغيير
      if (input.status === 'contacted') updateData.contactedAt = now;
      else if (input.status === 'confirmed') updateData.confirmedAt = now;
      else if (input.status === 'attended') updateData.attendedAt = now;
      else if (input.status === 'completed') updateData.completedAt = now;
      else if (input.status === 'cancelled') updateData.cancelledAt = now;

      // Update all selected registrations
      for (const id of input.ids) {
        await db
          .update(campRegistrations)
          .set(updateData)
          .where(eq(campRegistrations.id, id));
      }

      // Create audit logs for bulk update
      for (const id of input.ids) {
        await createAuditLog({
          entityType: 'campRegistration',
          entityId: id,
          action: 'bulk_status_change',
          newValue: input.status,
          userId: ctx.user?.id,
          userName: ctx.user?.name,
          notes: input.notes,
        });
      }

      // Invalidate camp registration caches after bulk update
      serverCache.invalidateByPrefix("paginated:campRegistrations:");
      serverCache.invalidate("list:campRegistrations");
      serverCache.invalidate(CacheKeys.campRegistrationStats());

      return { success: true, count: input.ids.length };
    }),

  // Delete camp registration (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(campRegistrations).where(eq(campRegistrations.id, input.id));

      // Invalidate camp registration caches after deletion
      serverCache.invalidateByPrefix("paginated:campRegistrations:");
      serverCache.invalidate("list:campRegistrations");
      serverCache.invalidate(CacheKeys.campRegistrationStats());

      return { success: true };
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
      const [registration] = await db.select().from(campRegistrations).where(eq(campRegistrations.id, input.id)).limit(1);
      if (!registration) {
        throw new Error("التسجيل غير موجود");
      }

      // If already has receipt number, return it
      if (registration.receiptNumber) {
        return { receiptNumber: registration.receiptNumber };
      }

      // Generate new receipt number
      const year = new Date().getFullYear();
      
      // Get the count of camp registrations with receipt numbers this year
      const { sql } = await import("drizzle-orm");
      const [result] = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM campRegistrations 
        WHERE receiptNumber LIKE CONCAT('SGH-', ${year}, '-%')
      `);
      
      const count = (result as any).count || 0;
      const sequenceNumber = count + 1;
      const paddedNumber = String(sequenceNumber).padStart(3, '0');
      const receiptNumber = `SGH-${year}-${paddedNumber}`;

      // Save receipt number
      await db.update(campRegistrations).set({ receiptNumber }).where(eq(campRegistrations.id, input.id));

      return { receiptNumber };
    }),

  // Schedule camp stats report
  scheduleReport: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      frequency: z.enum(["daily", "weekly", "monthly"]),
      campId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement actual report scheduling
      // This would typically:
      // 1. Store the schedule configuration in a database table
      // 2. Set up a cron job to generate and send reports
      // 3. Use an email service to send the reports
      
      // For now, return success as a placeholder
      return {
        success: true,
        message: `تم جدولة التقرير للإرسال إلى ${input.email} (${input.frequency === "daily" ? "يومياً" : input.frequency === "weekly" ? "أسبوعياً" : "شهرياً"})`,
        schedule: {
          email: input.email,
          frequency: input.frequency,
          campId: input.campId,
        },
      };
    }),
});
