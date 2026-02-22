/**
 * Saved Filters Router - الفلاتر المحفوظة
 * يخزن ويسترجع إعدادات الفلاتر المفضلة للمستخدمين
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { savedFilters } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const savedFiltersRouter = router({
  /**
   * Get saved filters for a specific page type
   * جلب الفلاتر المحفوظة لنوع صفحة محدد
   */
  list: protectedProcedure
    .input(z.object({
      pageType: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      return db.select()
        .from(savedFilters)
        .where(and(
          eq(savedFilters.userId, ctx.user.id),
          eq(savedFilters.pageType, input.pageType),
        ))
        .orderBy(desc(savedFilters.updatedAt));
    }),

  /**
   * Save a new filter
   * حفظ فلتر جديد
   */
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "اسم الفلتر مطلوب"),
      pageType: z.string(),
      filterConfig: z.string(), // JSON string
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // If setting as default, unset other defaults for this page
      if (input.isDefault) {
        await db.update(savedFilters)
          .set({ isDefault: false })
          .where(and(
            eq(savedFilters.userId, ctx.user.id),
            eq(savedFilters.pageType, input.pageType),
          ));
      }

      const result = await db.insert(savedFilters).values({
        name: input.name,
        pageType: input.pageType,
        filterConfig: input.filterConfig,
        userId: ctx.user.id,
        isDefault: input.isDefault,
      });

      return { success: true, id: Number(result[0].insertId) };
    }),

  /**
   * Update a saved filter
   * تحديث فلتر محفوظ
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      filterConfig: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updateData } = input;

      // If setting as default, unset other defaults
      if (updateData.isDefault) {
        // Get the filter to know its pageType
        const filter = await db.select()
          .from(savedFilters)
          .where(and(
            eq(savedFilters.id, id),
            eq(savedFilters.userId, ctx.user.id),
          ))
          .limit(1);

        if (filter.length > 0) {
          await db.update(savedFilters)
            .set({ isDefault: false })
            .where(and(
              eq(savedFilters.userId, ctx.user.id),
              eq(savedFilters.pageType, filter[0].pageType),
            ));
        }
      }

      await db.update(savedFilters)
        .set(updateData)
        .where(and(
          eq(savedFilters.id, id),
          eq(savedFilters.userId, ctx.user.id),
        ));

      return { success: true };
    }),

  /**
   * Delete a saved filter
   * حذف فلتر محفوظ
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(savedFilters)
        .where(and(
          eq(savedFilters.id, input.id),
          eq(savedFilters.userId, ctx.user.id),
        ));

      return { success: true };
    }),
});
