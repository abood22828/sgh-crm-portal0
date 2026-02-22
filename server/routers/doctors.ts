import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { doctors } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { serverCache, CacheKeys, CacheTTL } from "../cache";

export const doctorsRouter = router({
  // List all doctors (public) - cached
  list: publicProcedure.query(async () => {
    return serverCache.getOrCompute(
      CacheKeys.doctorsList(),
      CacheTTL.LIST,
      async () => {
        const db = await getDb();
        if (!db) return [];

        const results = await db.select().from(doctors);
        return results;
      }
    );
  }),

  // Get doctor by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(doctors).where(eq(doctors.id, input.id)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),

  // Get doctor by slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(doctors).where(eq(doctors.slug, input.slug)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),

  // Create doctor (protected)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "الاسم مطلوب"),
        slug: z.string().min(1, "الرابط مطلوب"),
        specialty: z.string().min(1, "التخصص مطلوب"),
        image: z.string().optional(),
        bio: z.string().optional(),
        experience: z.string().optional(),
        languages: z.string().optional(),
        consultationFee: z.string().optional(),
        procedures: z.string().optional(),
        isVisiting: z.enum(["yes", "no"]).default("no"),
        available: z.enum(["yes", "no"]).default("yes"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const doctor = await db.insert(doctors).values(input);

      // Invalidate doctors list cache
      serverCache.invalidate(CacheKeys.doctorsList());

      return { success: true, id: Number(doctor[0].insertId) };
    }),

  // Update doctor (protected)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1, "الاسم مطلوب"),
        slug: z.string().min(1, "الرابط مطلوب"),
        specialty: z.string().min(1, "التخصص مطلوب"),
        image: z.string().optional(),
        bio: z.string().optional(),
        experience: z.string().optional(),
        languages: z.string().optional(),
        consultationFee: z.string().optional(),
        procedures: z.string().optional(),
        isVisiting: z.enum(["yes", "no"]),
        available: z.enum(["yes", "no"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;

      await db.update(doctors).set(data).where(eq(doctors.id, id));

      // Invalidate doctors list cache
      serverCache.invalidate(CacheKeys.doctorsList());

      return { success: true };
    }),

  // Delete doctor (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(doctors).where(eq(doctors.id, input.id));

      // Invalidate doctors list cache
      serverCache.invalidate(CacheKeys.doctorsList());

      return { success: true };
    }),

  // Toggle doctor availability (protected)
  toggleAvailability: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        available: z.enum(["yes", "no"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.update(doctors).set({ available: input.available }).where(eq(doctors.id, input.id));

      // Invalidate doctors list cache
      serverCache.invalidate(CacheKeys.doctorsList());

      return { success: true };
    }),
});
