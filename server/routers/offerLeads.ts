import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { offerLeads } from "../../drizzle/schema";
import { sendNewOfferLeadTelegram } from "../telegram";

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
        status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer", "pending", "confirmed", "completed", "cancelled"]).optional(), // Manual registration status
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
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmTerm: input.utmTerm,
        utmContent: input.utmContent,
        utmPlacement: input.utmPlacement,
        referrer: input.referrer,
        fbclid: input.fbclid,
        gclid: input.gclid,
        status: input.status || "new", // Use provided status or default to new
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
        });
      }

      // Send automated offer booking confirmation message (Patient Journey)
      // Run in background - don't block the response
      if (offer) {
        const { sendOfferBookingConfirmationInteractive, formatDateForMessage, formatTimeForMessage } = await import("../messaging");
        sendOfferBookingConfirmationInteractive({
          phone: input.phone,
          name: input.fullName,
          service: offer.title,
          date: offer.startDate ? formatDateForMessage(new Date(offer.startDate)) : "غير محدد",
          time: offer.startDate ? formatTimeForMessage(new Date(offer.startDate)) : "غير محدد",
          bookingId: Number(lead.insertId),
        }).catch(error => {
          console.error("[WhatsApp] Failed to send offer booking confirmation:", error);
        });
      }

      return { success: true, id: lead.insertId };
    }),

  // List all offer leads (protected)
  list: protectedProcedure.query(async () => {
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
  }),

  // List offer leads with pagination (protected)
  listPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        searchTerm: z.string().optional(),
        offerId: z.number().optional(),
        source: z.string().optional(),
        status: z.string().optional(),
        dateFilter: z.enum(["all", "today", "week", "month"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const { getOfferLeadsPaginated } = await import('../db');
      return getOfferLeadsPaginated(
        input.page,
        input.limit,
        input.searchTerm,
        input.offerId,
        input.source,
        input.status,
        input.dateFilter
      );
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

      // Send welcome message when status changes to "booked" (Patient Journey)
      if (input.status === "booked") {
        const [lead] = await db.select().from(offerLeads).where(eq(offerLeads.id, input.id)).limit(1);
        if (lead && lead.phone) {
          const { sendOfferPatientArrivalWelcome } = await import("../messaging");
          const { offers } = await import("../../drizzle/schema");
          const [offer] = await db.select().from(offers).where(eq(offers.id, lead.offerId)).limit(1);
          await sendOfferPatientArrivalWelcome({
            phone: lead.phone,
            name: lead.fullName || "المريض",
            service: offer?.title || "العرض",
          });
        }
      }

      return { success: true };
    }),

  // Bulk update status for multiple offer leads (protected)
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update all selected offer leads
      for (const id of input.ids) {
        await db
          .update(offerLeads)
          .set({
            status: input.status,
            statusNotes: input.notes,
            updatedAt: new Date(),
          })
          .where(eq(offerLeads.id, id));
      }

      return { success: true, count: input.ids.length };
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
