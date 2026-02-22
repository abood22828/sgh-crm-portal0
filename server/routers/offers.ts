/**
 * Offers Router
 * جهاز التوجيه الخاص بالعروض
 * 
 * Handles all tRPC procedures related to medical offers management
 * يتعامل مع جميع إجراءات tRPC المتعلقة بإدارة العروض الطبية
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { offers } from '../../drizzle/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { generateSlug, isValidSlug } from '../../shared/_core/utils/slug';
import { serverCache, CacheKeys, CacheTTL } from '../cache';

/**
 * Validation schema for creating/updating offers
 * مخطط التحقق من صحة البيانات لإنشاء/تحديث العروض
 */
const offerInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const offersRouter = router({
  /**
   * Get all active offers
   * الحصول على جميع العروض النشطة
   */
  getAll: publicProcedure.query(async () => {
    return serverCache.getOrCompute(
      CacheKeys.offersList(),
      CacheTTL.LIST,
      async () => {
        try {
          const dbInstance = await getDb();
          if (!dbInstance) throw new Error('Database not available');
          
          const allOffers = await dbInstance
            .select()
            .from(offers)
            .where(eq(offers.isActive, true))
            .orderBy(offers.createdAt);

          return allOffers;
        } catch (error) {
          console.error('Error fetching offers:', error);
          throw new Error('Failed to fetch offers');
        }
      }
    );
  }),

  /**
   * Get all offers for admin (includes inactive)
   * الحصول على جميع العروض للإدارة (يشمل غير النشطة)
   */
  getAllAdmin: protectedProcedure.query(async ({ ctx }) => {
    // Verify user is admin
    if (ctx.user?.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can view all offers');
    }

    try {
      const dbInstance = await getDb();
      if (!dbInstance) throw new Error('Database not available');
      
      const allOffers = await dbInstance
        .select()
        .from(offers)
        .orderBy(offers.createdAt);

      return allOffers;
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw new Error('Failed to fetch offers');
    }
  }),

  /**
   * Get a specific offer by slug
   * الحصول على عرض معين حسب الرابط
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        const offer = await dbInstance
          .select()
          .from(offers)
          .where(and(eq(offers.slug, input.slug), eq(offers.isActive, true)))
          .limit(1);

        if (offer.length === 0) {
          throw new Error('Offer not found');
        }

        return offer[0];
      } catch (error) {
        console.error('Error fetching offer:', error);
        throw new Error('Failed to fetch offer');
      }
    }),

  /**
   * Create a new offer (admin only)
   * إنشاء عرض جديد (مسؤول فقط)
   */
  create: protectedProcedure
    .input(offerInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can create offers');
      }

      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        // Generate slug from title
        const slug = generateSlug(input.title);

        // Validate slug
        if (!isValidSlug(slug)) {
          throw new Error('Invalid slug format');
        }

        // Check if slug already exists
        const existingOffer = await dbInstance
          .select()
          .from(offers)
          .where(eq(offers.slug, slug))
          .limit(1);

        if (existingOffer.length > 0) {
          throw new Error('An offer with this title already exists');
        }

        // Create the offer
        const newOffer = await dbInstance.insert(offers).values({
          title: input.title,
          slug,
          description: input.description,
          imageUrl: input.imageUrl,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
        });

        // Invalidate offers cache
        serverCache.invalidate(CacheKeys.offersList());

        return { success: true, slug };
      } catch (error) {
        console.error('Error creating offer:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create offer');
      }
    }),

  /**
   * Update an existing offer (admin only)
   * تحديث عرض موجود (مسؤول فقط)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        ...offerInputSchema.shape,
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can update offers');
      }

      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        // Generate new slug if title changed
        const slug = generateSlug(input.title);

        // Validate slug
        if (!isValidSlug(slug)) {
          throw new Error('Invalid slug format');
        }

        // Update the offer
        await dbInstance
          .update(offers)
          .set({
            title: input.title,
            slug,
            description: input.description,
            imageUrl: input.imageUrl,
            startDate: input.startDate,
            endDate: input.endDate,
          })
          .where(eq(offers.id, input.id));

        // Invalidate offers cache
        serverCache.invalidate(CacheKeys.offersList());

        return { success: true };
      } catch (error) {
        console.error('Error updating offer:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update offer');
      }
    }),

  /**
   * Deactivate an offer (admin only)
   * إلغاء تفعيل عرض (مسؤول فقط)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can deactivate offers');
      }

      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        await dbInstance
          .update(offers)
          .set({ isActive: false })
          .where(eq(offers.id, input.id));

        // Invalidate offers cache
        serverCache.invalidate(CacheKeys.offersList());

        return { success: true };
      } catch (error) {
        console.error('Error deactivating offer:', error);
        throw new Error('Failed to deactivate offer');
      }
    }),

  /**
   * Delete an offer (admin only)
   * حذف عرض (مسؤول فقط)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can delete offers');
      }

      try {
        const dbInstance = await getDb();
        if (!dbInstance) throw new Error('Database not available');
        
        await dbInstance.delete(offers).where(eq(offers.id, input.id));

        // Invalidate offers cache
        serverCache.invalidate(CacheKeys.offersList());

        return { success: true };
      } catch (error) {
        console.error('Error deleting offer:', error);
        throw new Error('Failed to delete offer');
      }
    }),
});
