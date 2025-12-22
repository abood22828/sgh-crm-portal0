import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campRegistrations } from "../../drizzle/schema";

export const campRegistrationsRouter = router({
  // Submit a new camp registration (public)
  submit: publicProcedure
    .input(
      z.object({
        campId: z.number(),
        fullName: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        age: z.number().optional(),
        medicalCondition: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [registration] = await db.insert(campRegistrations).values({
        campId: input.campId,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        age: input.age,
        medicalCondition: input.medicalCondition,
        notes: input.notes,
        source: input.source || "website",
        status: "pending",
      });

      return { success: true, id: registration.insertId };
    }),

  // List all camp registrations (protected)
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select()
      .from(campRegistrations)
      .orderBy(desc(campRegistrations.createdAt));

    return results;
  }),

  // Get stats for camp registrations (protected)
  stats: protectedProcedure.query(async () => {
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
  }),

  // Update camp registration status (protected)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "attended", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(campRegistrations)
        .set({
          status: input.status,
          statusNotes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(campRegistrations.id, input.id));

      return { success: true };
    }),

  // Delete camp registration (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(campRegistrations).where(eq(campRegistrations.id, input.id));

      return { success: true };
    }),
});
