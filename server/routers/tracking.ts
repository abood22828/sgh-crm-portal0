import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { visitSessions, abandonedForms, trackingEvents } from "../../drizzle/schema";
import { eq, desc, and, gte, lte, isNull, sql, count, asc } from "drizzle-orm";

/**
 * Tracking Router - نظام تتبع الزوار والفرص الضائعة
 * Public procedures for client-side tracking (no auth required)
 * Protected procedures for admin analytics
 */
export const trackingRouter = router({
  /**
   * تسجيل جلسة زيارة جديدة أو تحديث موجودة
   */
  upsertSession: publicProcedure
    .input(z.object({
      sessionId: z.string().max(64),
      source: z.string().max(64).optional(),
      utmSource: z.string().max(128).optional(),
      utmMedium: z.string().max(128).optional(),
      utmCampaign: z.string().max(256).optional(),
      utmContent: z.string().max(256).optional(),
      utmTerm: z.string().max(256).optional(),
      fbclid: z.string().max(256).optional(),
      gclid: z.string().max(256).optional(),
      landingPage: z.string().max(512).optional(),
      referrer: z.string().max(512).optional(),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.insert(visitSessions).values({
          sessionId: input.sessionId,
          source: input.source,
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
          utmContent: input.utmContent,
          utmTerm: input.utmTerm,
          fbclid: input.fbclid,
          gclid: input.gclid,
          landingPage: input.landingPage,
          referrer: input.referrer,
          userAgent: input.userAgent,
        }).onDuplicateKeyUpdate({
          set: { updatedAt: new Date() },
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  /**
   * تسجيل حدث تتبع (فتح نموذج، بدء ملء، إلخ)
   */
  trackEvent: publicProcedure
    .input(z.object({
      sessionId: z.string().max(64).optional(),
      eventType: z.string().max(64),
      page: z.string().max(512).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      source: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.insert(trackingEvents).values({
          sessionId: input.sessionId,
          eventType: input.eventType,
          page: input.page,
          metadata: input.metadata ? JSON.stringify(input.metadata) : null,
          source: input.source,
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  /**
   * حفظ نموذج مهجور (فرصة ضائعة)
   */
  saveAbandonedForm: publicProcedure
    .input(z.object({
      formType: z.enum(["appointment", "offer", "camp", "general"]),
      phone: z.string().max(32).optional(),
      name: z.string().max(256).optional(),
      relatedId: z.number().optional(),
      relatedName: z.string().max(256).optional(),
      formData: z.record(z.string(), z.unknown()).optional(),
      source: z.string().max(64).optional(),
      utmSource: z.string().max(128).optional(),
      utmCampaign: z.string().max(256).optional(),
      sessionId: z.string().max(64).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.insert(abandonedForms).values({
          formType: input.formType,
          phone: input.phone,
          name: input.name,
          relatedId: input.relatedId,
          relatedName: input.relatedName,
          formData: input.formData ? JSON.stringify(input.formData) : null,
          source: input.source,
          utmSource: input.utmSource,
          utmCampaign: input.utmCampaign,
          sessionId: input.sessionId,
        });
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  /**
   * تحديث حالة التحويل لجلسة (عند اكتمال الحجز)
   */
  markConverted: publicProcedure
    .input(z.object({
      sessionId: z.string().max(64),
      conversionType: z.string().max(64),
      conversionId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      try {
        await db.update(visitSessions)
          .set({
            converted: true,
            conversionType: input.conversionType,
            conversionId: input.conversionId,
            updatedAt: new Date(),
          })
          .where(eq(visitSessions.sessionId, input.sessionId));
        return { success: true };
      } catch {
        return { success: false };
      }
    }),

  // ===== Admin Analytics Procedures =====

  /**
   * إحصائيات قمع التحويل (Conversion Funnel)
   */
  conversionFunnel: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      // Total sessions
      const [totalSessions] = await db.select({ count: count() })
        .from(visitSessions)
        .where(and(gte(visitSessions.createdAt, start), lte(visitSessions.createdAt, end)));

      // Sessions that started a form (form_open event)
      const [formOpens] = await db.select({ count: count() })
        .from(trackingEvents)
        .where(and(
          eq(trackingEvents.eventType, "form_open"),
          gte(trackingEvents.createdAt, start),
          lte(trackingEvents.createdAt, end)
        ));

      // Sessions that started filling (form_start event)
      const [formStarts] = await db.select({ count: count() })
        .from(trackingEvents)
        .where(and(
          eq(trackingEvents.eventType, "form_start"),
          gte(trackingEvents.createdAt, start),
          lte(trackingEvents.createdAt, end)
        ));

      // Abandoned forms
      const [abandoned] = await db.select({ count: count() })
        .from(abandonedForms)
        .where(and(
          gte(abandonedForms.createdAt, start),
          lte(abandonedForms.createdAt, end)
        ));

      // Converted sessions
      const [converted] = await db.select({ count: count() })
        .from(visitSessions)
        .where(and(
          eq(visitSessions.converted, true),
          gte(visitSessions.createdAt, start),
          lte(visitSessions.createdAt, end)
        ));

      return {
        totalSessions: Number(totalSessions?.count ?? 0),
        formOpens: Number(formOpens?.count ?? 0),
        formStarts: Number(formStarts?.count ?? 0),
        abandoned: Number(abandoned?.count ?? 0),
        converted: Number(converted?.count ?? 0),
      };
    }),

  /**
   * توزيع المصادر (Source Attribution)
   */
  sourceBreakdown: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      const results = await db.execute(sql`
        SELECT 
          COALESCE(source, 'direct') as source,
          COUNT(*) as total,
          SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions
        FROM visitSessions
        WHERE createdAt >= ${start} AND createdAt <= ${end}
        GROUP BY source
        ORDER BY total DESC
        LIMIT 20
      `);

      return (results[0] as unknown as Array<{ source: string; total: number; conversions: number }>).map(r => ({
        source: r.source,
        total: Number(r.total),
        conversions: Number(r.conversions),
        rate: r.total > 0 ? Math.round((Number(r.conversions) / Number(r.total)) * 100) : 0,
      }));
    }),

  /**
   * قائمة الفرص الضائعة (Abandoned Forms)
   */
  abandonedFormsList: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(50),
      contacted: z.boolean().optional(),
      formType: z.enum(["appointment", "offer", "camp", "general"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.limit;
      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      const conditions = [
        gte(abandonedForms.createdAt, start),
        lte(abandonedForms.createdAt, end),
      ];
      if (input.contacted !== undefined) {
        conditions.push(eq(abandonedForms.contacted, input.contacted));
      }
      if (input.formType) {
        conditions.push(eq(abandonedForms.formType, input.formType));
      }

      const [items, [{ total }]] = await Promise.all([
        db.select().from(abandonedForms)
          .where(and(...conditions))
          .orderBy(desc(abandonedForms.createdAt))
          .limit(input.limit)
          .offset(offset),
        db.select({ total: count() }).from(abandonedForms).where(and(...conditions)),
      ]);

      return { items, total: Number(total), page: input.page, limit: input.limit };
    }),

  /**
   * تحديث حالة التواصل مع فرصة ضائعة
   */
  markAbandonedContacted: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(abandonedForms)
        .set({ contacted: true, contactedAt: new Date() })
        .where(eq(abandonedForms.id, input.id));
      return { success: true };
    }),

  /**
   * إحصائيات UTM Campaigns (ROI Analysis)
   */
  campaignPerformance: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      const results = await db.execute(sql`
        SELECT 
          COALESCE(utmCampaign, 'غير محدد') as campaign,
          COALESCE(utmSource, source, 'direct') as source,
          COUNT(*) as sessions,
          SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
          ROUND(SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as conversionRate
        FROM visitSessions
        WHERE createdAt >= ${start} AND createdAt <= ${end}
        GROUP BY campaign, source
        ORDER BY conversions DESC
        LIMIT 20
      `);

      return (results[0] as unknown as Array<{ campaign: string; source: string; sessions: number; conversions: number; conversionRate: number }>).map(r => ({
        campaign: r.campaign,
        source: r.source,
        sessions: Number(r.sessions),
        conversions: Number(r.conversions),
        conversionRate: Number(r.conversionRate),
      }));
    }),

  /**
   * إحصائيات يومية للتحويلات
   */
  dailyStats: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const start = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = input.endDate ? new Date(input.endDate) : new Date();

      const results = await db
        .select({
          date: sql<string>`DATE(${visitSessions.createdAt})`,
          sessions: count(),
          conversions: sql<number>`SUM(CASE WHEN ${visitSessions.converted} = 1 THEN 1 ELSE 0 END)`,
        })
        .from(visitSessions)
        .where(and(gte(visitSessions.createdAt, start), lte(visitSessions.createdAt, end)))
        .groupBy(sql`DATE(${visitSessions.createdAt})`)
        .orderBy(asc(sql`DATE(${visitSessions.createdAt})`));

      return results.map(r => ({
        date: r.date,
        sessions: Number(r.sessions),
        conversions: Number(r.conversions),
        conversionRate: r.sessions > 0 ? Math.round((Number(r.conversions) / Number(r.sessions)) * 100) : 0,
      }));
    }),
});
