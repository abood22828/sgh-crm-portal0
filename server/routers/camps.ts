/**
 * Camps Router
 * جهاز التوجيه الخاص بالمخيمات الطبية
 * 
 * Handles all tRPC procedures related to medical camps management
 * يتعامل مع جميع إجراءات tRPC المتعلقة بإدارة المخيمات الطبية
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { camps } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateSlug, isValidSlug } from '../../shared/_core/utils/slug';
import { serverCache, CacheKeys, CacheTTL } from '../cache';

/**
 * Validation schema for creating/updating camps
 * مخطط التحقق من صحة البيانات لإنشاء/تحديث المخيمات
 */
const campInputSchema = z.object({
  name: z.string().min(1, "اسم المخيم مطلوب"),
  slug: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().default(true),
  // New fields for advanced camp management
  freeOffers: z.string().optional(), // Free offers (one per line)
  discountedOffers: z.string().optional(), // Discounted offers (one per line)
  availableProcedures: z.string().optional(), // JSON string
  galleryImages: z.string().optional(), // JSON string
});

export const campsRouter = router({
  /**
   * Get all camps (public)
   * الحصول على جميع المخيمات (عام)
   */
  getAll: publicProcedure.query(async () => {
    return serverCache.getOrCompute(
      "camps:active",
      CacheTTL.LIST,
      async () => {
        const db = await getDb();
        if (!db) return [];
        
        const result = await db
          .select()
          .from(camps)
          .where(eq(camps.isActive, true))
          .orderBy(desc(camps.createdAt));
        
        return result;
      }
    );
  }),

  /**
   * Get all camps for admin (includes inactive)
   * الحصول على جميع المخيمات للإدارة (يشمل غير النشطة)
   */
  getAllAdmin: publicProcedure.query(async () => {
    return serverCache.getOrCompute(
      CacheKeys.campsList(),
      CacheTTL.LIST,
      async () => {
        const db = await getDb();
        if (!db) return [];
        
        const result = await db
          .select()
          .from(camps)
          .orderBy(desc(camps.createdAt));
        
        return result;
      }
    );
  }),

  /**
   * Get camp by ID
   * الحصول على مخيم بواسطة المعرف
   */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(camps)
        .where(eq(camps.id, input.id))
        .limit(1);
      
      return result[0] || null;
    }),

  /**
   * Get camp by slug
   * الحصول على مخيم بواسطة الرابط
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const result = await db
        .select()
        .from(camps)
        .where(and(
          eq(camps.slug, input.slug),
          eq(camps.isActive, true)
        ))
        .limit(1);
      
      return result[0] || null;
    }),

  /**
   * Create new camp (admin only)
   * إنشاء مخيم جديد (للإدارة فقط)
   */
  create: protectedProcedure
    .input(campInputSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Generate slug if not provided
      const slug = input.slug || generateSlug(input.name);
      
      // Validate slug format
      if (!isValidSlug(slug)) {
        throw new Error("صيغة الرابط غير صالحة");
      }
      
      // Check for duplicate slug
      const existing = await db
        .select()
        .from(camps)
        .where(eq(camps.slug, slug))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error("هذا الرابط مستخدم بالفعل");
      }
      
      await db.insert(camps).values({
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        isActive: input.isActive,
        freeOffers: input.freeOffers,
        discountedOffers: input.discountedOffers,
        availableProcedures: input.availableProcedures,
        galleryImages: input.galleryImages,
      });
      
      // Invalidate camps cache
      serverCache.invalidate(CacheKeys.campsList());
      serverCache.invalidate("camps:active");

      return { success: true, slug };
    }),

  /**
   * Update camp (admin only)
   * تحديث مخيم (للإدارة فقط)
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      ...campInputSchema.shape,
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...data } = input;
      
      // If slug is being changed, validate and check for duplicates
      if (data.slug) {
        if (!isValidSlug(data.slug)) {
          throw new Error("صيغة الرابط غير صالحة");
        }
        
        const existing = await db
          .select()
          .from(camps)
          .where(and(
            eq(camps.slug, data.slug),
            // Exclude current camp from duplicate check
          ))
          .limit(1);
        
        if (existing.length > 0 && existing[0].id !== id) {
          throw new Error("هذا الرابط مستخدم بالفعل");
        }
      }
      
      await db
        .update(camps)
        .set({
          name: data.name,
          slug: data.slug,
          description: data.description,
          imageUrl: data.imageUrl,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: data.isActive,
          freeOffers: data.freeOffers,
          discountedOffers: data.discountedOffers,
          availableProcedures: data.availableProcedures,
          galleryImages: data.galleryImages,
        })
        .where(eq(camps.id, id));
      
      // Invalidate camps cache
      serverCache.invalidate(CacheKeys.campsList());
      serverCache.invalidate("camps:active");

      return { success: true };
    }),
  /**
   * Delete camp (admin only))
   * حذف مخيم (للإدارة فقط)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(camps).where(eq(camps.id, input.id));
      
      // Invalidate camps cache
      serverCache.invalidate(CacheKeys.campsList());
      serverCache.invalidate("camps:active");

      return { success: true };
    }),

  /**
   * Toggle camp active status (admin only)
   * تبديل حالة نشاط المخيم (للإدارة فقط)
   */
  toggleActive: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get current status
      const current = await db
        .select()
        .from(camps)
        .where(eq(camps.id, input.id))
        .limit(1);
      
      if (current.length === 0) {
        throw new Error("المخيم غير موجود");
      }
      
      // Toggle status
      await db
        .update(camps)
        .set({ isActive: !current[0].isActive })
        .where(eq(camps.id, input.id));
      
      // Invalidate camps cache
      serverCache.invalidate(CacheKeys.campsList());
      serverCache.invalidate("camps:active");

      return { success: true, isActive: !current[0].isActive };
    }),
});
