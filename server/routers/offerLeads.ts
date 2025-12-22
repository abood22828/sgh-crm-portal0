import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { offerLeads } from "../../drizzle/schema";

export const offerLeadsRouter = router({
  // Submit a new offer lead (public)
  submit: publicProcedure
    .input(
      z.object({
        offerId: z.number(),
        fullName: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [lead] = await db.insert(offerLeads).values({
        offerId: input.offerId,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        source: input.source || "website",
        status: "new",
      });

      return { success: true, id: lead.insertId };
    }),

  // List all offer leads (protected)
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const results = await db
      .select()
      .from(offerLeads)
      .orderBy(desc(offerLeads.createdAt));

    return results;
  }),

  // Get stats for offer leads (protected)
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, new: 0, contacted: 0, booked: 0, not_interested: 0, no_answer: 0 };

    const all = await db.select().from(offerLeads);

    return {
      total: all.length,
      new: all.filter((l) => l.status === "new").length,
      contacted: all.filter((l) => l.status === "contacted").length,
      booked: all.filter((l) => l.status === "booked").length,
      not_interested: all.filter((l) => l.status === "not_interested").length,
      no_answer: all.filter((l) => l.status === "no_answer").length,
    };
  }),

  // Update offer lead status (protected)
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(offerLeads)
        .set({
          status: input.status,
          statusNotes: input.notes,
          updatedAt: new Date(),
        })
        .where(eq(offerLeads.id, input.id));

      return { success: true };
    }),

  // Delete offer lead (protected)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(offerLeads).where(eq(offerLeads.id, input.id));

      return { success: true };
    }),
});
