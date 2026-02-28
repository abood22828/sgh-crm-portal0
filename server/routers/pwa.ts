/**
 * PWA Router
 * يتعامل مع تتبع تثبيت التطبيق وإحصائيات PWA
 */

import { z } from 'zod';
import { getDb } from '../db';
import { pwaInstalls } from '../../drizzle/schema';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { desc, eq, count, sql } from 'drizzle-orm';

export const pwaRouter = router({
  /**
   * تسجيل عملية تثبيت ناجحة
   * يُستدعى من usePWAInstall hook عند قبول المستخدم للتثبيت
   */
  trackInstall: publicProcedure
    .input(z.object({
      appType: z.enum(['public', 'admin']),
      userAgent: z.string().optional(),
      platform: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const ipAddress = ctx.req.headers['x-forwarded-for'] as string ||
        ctx.req.socket?.remoteAddress || null;

      await db.insert(pwaInstalls).values({
        appType: input.appType,
        userId: (ctx.user as any)?.id || null,
        userAgent: input.userAgent || null,
        platform: input.platform || null,
        ipAddress: ipAddress ? ipAddress.split(',')[0].trim() : null,
      });

      return { success: true };
    }),

  /**
   * جلب إحصائيات التثبيت (للمشرفين فقط)
   */
  getStats: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return { total: 0, public: 0, admin: 0, recentInstalls: [] };

      const [totalResult, publicResult, adminResult, recentInstalls] = await Promise.all([
        db.select({ count: count() }).from(pwaInstalls),
        db.select({ count: count() }).from(pwaInstalls).where(eq(pwaInstalls.appType, 'public')),
        db.select({ count: count() }).from(pwaInstalls).where(eq(pwaInstalls.appType, 'admin')),
        db.select({
          id: pwaInstalls.id,
          appType: pwaInstalls.appType,
          platform: pwaInstalls.platform,
          installedAt: pwaInstalls.installedAt,
        })
          .from(pwaInstalls)
          .orderBy(desc(pwaInstalls.installedAt))
          .limit(10),
      ]);

      // إحصائيات يومية (آخر 30 يوم)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const dailyStats = await db
        .select({
          date: sql<string>`DATE(${pwaInstalls.installedAt})`,
          appType: pwaInstalls.appType,
          count: count(),
        })
        .from(pwaInstalls)
        .where(sql`${pwaInstalls.installedAt} >= ${thirtyDaysAgo}`)
        .groupBy(sql`DATE(${pwaInstalls.installedAt})`, pwaInstalls.appType)
        .orderBy(sql`DATE(${pwaInstalls.installedAt}) ASC`);

      return {
        total: totalResult[0]?.count || 0,
        public: publicResult[0]?.count || 0,
        admin: adminResult[0]?.count || 0,
        recentInstalls,
        dailyStats,
      };
    }),
});
