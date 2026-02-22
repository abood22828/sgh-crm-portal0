/**
 * Audit Logs Router - سجل التغييرات
 * يتتبع جميع التغييرات على السجلات
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { auditLogs } from '../../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

/**
 * Helper function to create an audit log entry
 * دالة مساعدة لإنشاء سجل تغيير
 */
export async function createAuditLog(params: {
  entityType: string;
  entityId: number;
  action: string;
  oldValue?: string | null;
  newValue?: string | null;
  userId?: number | null;
  userName?: string | null;
  notes?: string | null;
}) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(auditLogs).values({
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValue: params.oldValue || null,
      newValue: params.newValue || null,
      userId: params.userId || null,
      userName: params.userName || null,
      notes: params.notes || null,
    });
  } catch (error) {
    console.error('[AuditLog] Failed to create audit log:', error);
  }
}

export const auditLogsRouter = router({
  /**
   * Get audit logs for a specific entity
   * جلب سجل التغييرات لكيان محدد
   */
  getByEntity: protectedProcedure
    .input(z.object({
      entityType: z.string(),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(auditLogs)
        .where(and(
          eq(auditLogs.entityType, input.entityType),
          eq(auditLogs.entityId, input.entityId),
        ))
        .orderBy(desc(auditLogs.createdAt));
    }),

  /**
   * Get paginated audit logs with filters
   * جلب سجل التغييرات مع pagination وفلاتر
   */
  listPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(500).default(50),
      entityType: z.string().optional(),
      action: z.string().optional(),
      userId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { logs: [], total: 0 };

      const { page, limit, entityType, action, userId } = input;
      const offset = (page - 1) * limit;

      const conditions = [];
      if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
      if (action) conditions.push(eq(auditLogs.action, action));
      if (userId) conditions.push(eq(auditLogs.userId, userId));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [logs, countResult] = await Promise.all([
        db.select()
          .from(auditLogs)
          .where(whereClause)
          .orderBy(desc(auditLogs.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: sql<number>`COUNT(*)` })
          .from(auditLogs)
          .where(whereClause),
      ]);

      return {
        logs,
        total: Number(countResult[0]?.count || 0),
      };
    }),
});
