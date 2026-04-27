import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, gte } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { offerLeads } from "../../drizzle/schema";
import { sendNewOfferLeadTelegram } from "../telegram";
import { serverCache, CacheKeys, CacheTTL } from "../cache";
import { createAuditLog } from "./auditLogs";
import { sendOfferLeadEvent, sendStatusChangeEvent } from "../facebookCAPI";
import { normalizePhoneNumber } from "../db";
// sendOfferLeadConfirmation moved to dispatchWhatsAppMessage flow
import { dispatchWhatsAppMessage } from "../services/whatsappMessageDispatcher";

export const offerLeadsRouter = router({
  // Submit a new offer lead (public)
  submit: publicProcedure
    .input(
      z.object({
        offerId: z.number(),
        fullName: z.string().min(1),
        phone: z.string().min(9).regex(
          /^(\+?967)?7\d{8}$|^07\d{8}$|^7\d{8}$/,
          "رقم الهاتف يجب أن يبدأ بالرقم 7 ويتكون من 9 أرقام"
        ),
        email: z.string().email().optional(),
        age: z.number().int().min(1).max(120).optional(),
        gender: z.enum(["male", "female"]),
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

      // التحقق من عدم تكرار الطلب بنفس الرقم ونفس العرض خلال 3 أيام - معطل
      // const threeDaysAgo = new Date();
      // threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      // const allLeads = await db
      //   .select({ id: offerLeads.id, phone: offerLeads.phone })
      //   .from(offerLeads)
      //   .where(
      //     and(
      //       eq(offerLeads.offerId, input.offerId),
      //       gte(offerLeads.createdAt, threeDaysAgo)
      //     )
      //   )
      //   .limit(100);
      // const existingLead = allLeads.filter(l => normalizePhoneNumber(l.phone) === normalizedPhone);
      // if (existingLead.length > 0) {
      //   throw new TRPCError({
      //     code: "CONFLICT",
      //     message: "لقد تم تسجيل طلب بنفس رقم الهاتف لهذا العرض خلال الأيام الثلاثة الماضية",
      //   });
      // }

      // Build timestamp fields based on initial status
      const nowOffer = new Date();
      const offerStatusTimestamps: Record<string, Date> = {};
      const offerInitialStatus = input.status || "pending";
      if (offerInitialStatus === 'contacted') offerStatusTimestamps.contactedAt = nowOffer;
      else if (offerInitialStatus === 'confirmed') offerStatusTimestamps.confirmedAt = nowOffer;
      else if (offerInitialStatus === 'attended') offerStatusTimestamps.attendedAt = nowOffer;
      else if (offerInitialStatus === 'completed') offerStatusTimestamps.completedAt = nowOffer;
      else if (offerInitialStatus === 'cancelled') offerStatusTimestamps.cancelledAt = nowOffer;

      const [lead] = await db.insert(offerLeads).values({
        offerId: input.offerId,
        fullName: input.fullName,
        phone: normalizedPhone,
        email: input.email,
        age: input.age,
        gender: input.gender,
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
        status: offerInitialStatus,
        ...offerStatusTimestamps,
      });

      // Get offer details for notification
      const { offers } = await import("../../drizzle/schema");
      const [offer] = await db.select().from(offers).where(eq(offers.id, input.offerId)).limit(1);

      // Send Telegram notification
      if (offer) {
        await sendNewOfferLeadTelegram({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          offerTitle: offer.title,
          age: input.age,
          patientMessage: input.patientMessage,
        });
      }

      // Send automated offer booking confirmation message (Patient Journey) via dispatcher
      // Run in background - don't block the response
      if (offer) {
        dispatchWhatsAppMessage({
          entityType: "offer_lead",
          triggerEvent: "on_create",
          phone: input.phone,
          recipientName: input.fullName,
          variables: {
            name: input.fullName,
            service: offer.title,
            date: offer.startDate ? new Date(offer.startDate).toLocaleDateString("ar-YE") : "غير محدد",
          },
          entityId: Number(lead.insertId),
        }).catch(error => {
          console.error("[WhatsApp Dispatcher] Failed to send offer lead on_create:", error);
        });
      }

      // Send Facebook Conversions API event (fire-and-forget)
      // لا تُرسَل بيانات طبية حساسة وفق سياسة Meta لمزودي الرعاية الصحية
      sendOfferLeadEvent({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        clientIpAddress: ctx.req.ip || (ctx.req.socket as any)?.remoteAddress,
        clientUserAgent: ctx.req.headers["user-agent"] as string,
        fbc: ctx.req.cookies?.["_fbc"],
        fbp: ctx.req.cookies?.["_fbp"],
        eventSourceUrl: input.referrer,
        eventId: `offer_${lead?.insertId || Date.now()}`,
      }).catch((err) => console.error("[CAPI] Offer lead error:", err));

      // Invalidate offer leads caches after new submission
      serverCache.invalidateByPrefix("paginated:offerLeads:");
      serverCache.invalidate("list:offerLeads");
      serverCache.invalidate(CacheKeys.offerLeadStats());

      return { success: true, id: lead.insertId };
    }),

  // List all offer leads (protected)
  list: protectedProcedure.query(async () => {
    return serverCache.getOrCompute(
      "list:offerLeads",
      CacheTTL.LIST,
      async () => {
        const db = await getDb();
        if (!db) return [];

        const { offers } = await import("../../drizzle/schema");
        
        const results = await db
          .select({
            id: offerLeads.id,
            offerId: offerLeads.offerId,
            offerTitle: offers.title,
            fullName: offerLeads.fullName,
            phone: offerLeads.phone,
            email: offerLeads.email,
            notes: offerLeads.notes,
            source: offerLeads.source,
            status: offerLeads.status,
            createdAt: offerLeads.createdAt,
            updatedAt: offerLeads.updatedAt,
          })
          .from(offerLeads)
          .leftJoin(offers, eq(offers.id, offerLeads.offerId))
          .orderBy(desc(offerLeads.createdAt));

        return results;
      }
    );
  }),

  // List offer leads with pagination (protected)
  listPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100000).default(20),
        searchTerm: z.string().optional(),
        offerIds: z.array(z.number()).optional(),
        sources: z.array(z.string()).optional(),
        statuses: z.array(z.string()).optional(),
        dateFilter: z.enum(["all", "today", "week", "month"]).optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const cacheKey = CacheKeys.offerLeadsPaginated(input);
      return serverCache.getOrCompute(
        cacheKey,
        CacheTTL.PAGINATED,
        async () => {
          const { getOfferLeadsPaginated } = await import('../db');
          return getOfferLeadsPaginated(
            input.page,
            input.limit,
            input.searchTerm,
            input.offerIds,
            input.sources,
            input.statuses,
            input.dateFilter,
            input.dateFrom,
            input.dateTo
          );
        }
      );
    }),

  // Get stats for offer leads (protected)
  stats: protectedProcedure.query(async () => {
    return serverCache.getOrCompute(
      CacheKeys.offerLeadStats(),
      CacheTTL.STATS,
      async () => {
        const db = await getDb();
        if (!db) return { total: 0, pending: 0, contacted: 0, no_answer: 0, confirmed: 0, attended: 0, completed: 0, cancelled: 0 };

        const all = await db.select().from(offerLeads);

        return {
          total: all.length,
          pending: all.filter((l) => l.status === "pending").length,
          contacted: all.filter((l) => l.status === "contacted").length,
          no_answer: all.filter((l) => l.status === "no_answer").length,
          confirmed: all.filter((l) => l.status === "confirmed").length,
          attended: all.filter((l) => l.status === "attended").length,
          completed: all.filter((l) => l.status === "completed").length,
          cancelled: all.filter((l) => l.status === "cancelled").length,
        };
      }
    );
  }),

  // Update offer lead status (protected)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "contacted", "no_answer", "confirmed", "attended", "completed", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get old status for audit log
      const [old] = await db.select({ status: offerLeads.status }).from(offerLeads).where(eq(offerLeads.id, input.id)).limit(1);
      const oldStatus = old?.status || '';

      // حفظ وقت كل حالة
      const now = new Date();
      const timestampUpdate: Record<string, Date | null> = {};
      if (input.status === 'contacted') timestampUpdate.contactedAt = now;
      else if (input.status === 'confirmed') timestampUpdate.confirmedAt = now;
      else if (input.status === 'attended') timestampUpdate.attendedAt = now;
      else if (input.status === 'completed') timestampUpdate.completedAt = now;
      else if (input.status === 'cancelled') timestampUpdate.cancelledAt = now;

      await db
        .update(offerLeads)
        .set({
          status: input.status,
          statusNotes: input.notes,
          updatedAt: new Date(),
          ...timestampUpdate,
        })
        .where(eq(offerLeads.id, input.id));

      // Create audit log
      await createAuditLog({
        entityType: 'offerLead',
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
        const [leadRow] = await db
          .select({ fullName: offerLeads.fullName, phone: offerLeads.phone, email: offerLeads.email })
          .from(offerLeads)
          .where(eq(offerLeads.id, input.id))
          .limit(1);
        if (leadRow?.phone) {
          sendStatusChangeEvent({
            status: input.status,
            fullName: leadRow.fullName || "",
            phone: leadRow.phone,
            email: leadRow.email || undefined,
            serviceType: "offer",
            bookingId: input.id,
          }).catch((err) => console.error("[CAPI] Offer status change error:", err));
        }
      }

      // ── WhatsApp Dispatcher: إرسال رسالة تلقائية بناءً على الحالة ──
      {
        const [lead] = await db.select().from(offerLeads).where(eq(offerLeads.id, input.id)).limit(1);
        if (lead?.phone) {
          const { offers } = await import("../../drizzle/schema");
          const [offer] = await db.select().from(offers).where(eq(offers.id, lead.offerId)).limit(1);
          const triggerMap: Record<string, string> = {
            "confirmed": "on_confirmed",
            "attended": "on_arrived",
            "completed": "on_completed",
            "cancelled": "on_cancelled",
          };
          const triggerEvent = triggerMap[input.status];
          if (triggerEvent) {
            dispatchWhatsAppMessage({
              entityType: "offer_lead",
              triggerEvent: triggerEvent as any,
              phone: lead.phone,
              recipientName: lead.fullName || undefined,
              variables: {
                name: lead.fullName || "العميل",
                service: offer?.title || "العرض",
              },
              entityId: input.id,
              sentBy: ctx.user?.id,
            }).catch(err => console.error("[WhatsApp Dispatcher] Offer status trigger error:", err));
          }
          // ملاحظة: تم إزالة sendOfferPatientArrivalWelcome القديمة - dispatchWhatsAppMessage يتولى الإرسال عبر إعدادات الرسائل
        }
      }

      // Invalidate offer leads caches after status update
      serverCache.invalidateByPrefix("paginated:offerLeads:");
      serverCache.invalidate("list:offerLeads");
      serverCache.invalidate(CacheKeys.offerLeadStats());

      return { success: true };
    }),

  // Bulk update status for multiple offer leads (protected)
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

      // حفظ وقت كل حالة
      const now = new Date();
      const timestampUpdate: Record<string, Date | null> = {};
      if (input.status === 'contacted') timestampUpdate.contactedAt = now;
      else if (input.status === 'confirmed') timestampUpdate.confirmedAt = now;
      else if (input.status === 'attended') timestampUpdate.attendedAt = now;
      else if (input.status === 'completed') timestampUpdate.completedAt = now;
      else if (input.status === 'cancelled') timestampUpdate.cancelledAt = now;

      // Update all selected offer leads
      for (const id of input.ids) {
        await db
          .update(offerLeads)
          .set({
            status: input.status,
            statusNotes: input.notes,
            updatedAt: new Date(),
            ...timestampUpdate,
          })
          .where(eq(offerLeads.id, id));
      }

      // Create audit logs for bulk update
      for (const id of input.ids) {
        await createAuditLog({
          entityType: 'offerLead',
          entityId: id,
          action: 'bulk_status_change',
          newValue: input.status,
          userId: ctx.user?.id,
          userName: ctx.user?.name,
          notes: input.notes,
        });
      }

      // Invalidate offer leads caches after bulk update
      serverCache.invalidateByPrefix("paginated:offerLeads:");
      serverCache.invalidate("list:offerLeads");
      serverCache.invalidate(CacheKeys.offerLeadStats());

      return { success: true, count: input.ids.length };
    }),

  // Delete offer lead (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(offerLeads).where(eq(offerLeads.id, input.id));

      // Invalidate offer leads caches after deletion
      serverCache.invalidateByPrefix("paginated:offerLeads:");
      serverCache.invalidate("list:offerLeads");
      serverCache.invalidate(CacheKeys.offerLeadStats());

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
      const [lead] = await db.select().from(offerLeads).where(eq(offerLeads.id, input.id)).limit(1);
      if (!lead) {
        throw new Error("الحجز غير موجود");
      }

      // If already has receipt number, return it
      if (lead.receiptNumber) {
        return { receiptNumber: lead.receiptNumber };
      }

      // Generate new receipt number
      const year = new Date().getFullYear();
      
      // Get the count of offer leads with receipt numbers this year
      const { sql } = await import("drizzle-orm");
      const [result] = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM offerLeads 
        WHERE receiptNumber LIKE CONCAT('SGH-', ${year}, '-%')
      `);
      
      const count = (result as any).count || 0;
      const sequenceNumber = count + 1;
      const paddedNumber = String(sequenceNumber).padStart(3, '0');
      const receiptNumber = `SGH-${year}-${paddedNumber}`;

      // Save receipt number
      await db.update(offerLeads).set({ receiptNumber }).where(eq(offerLeads.id, input.id));

      return { receiptNumber };
    }),
});
