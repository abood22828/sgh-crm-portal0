import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { campRegistrations } from "../../drizzle/schema";
import { sendNewCampRegistrationTelegram } from "../telegram";

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
        procedures: z.string().optional(), // JSON string of selected procedures
        medicalCondition: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
        referrer: z.string().optional(),
        fbclid: z.string().optional(),
        gclid: z.string().optional(),
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
        procedures: input.procedures,
        medicalCondition: input.medicalCondition,
        notes: input.notes,
        source: input.source || "website",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        referrer: input.referrer,
        fbclid: input.fbclid,
        gclid: input.gclid,
        status: "pending",
      });

      // Get camp details for notification
      const { camps } = await import("../../drizzle/schema");
      const [camp] = await db.select().from(camps).where(eq(camps.id, input.campId)).limit(1);

      // Send Telegram notification
      if (camp) {
        await sendNewCampRegistrationTelegram({
          fullName: input.fullName,
          phone: input.phone,
          email: input.email,
          campTitle: camp.name,
          age: input.age,
        });
      }

      // Send automated camp registration confirmation message (Patient Journey)
      if (camp) {
        const { sendCampRegistrationConfirmationInteractive, formatDateForMessage, formatTimeForMessage } = await import("../messaging");
        await sendCampRegistrationConfirmationInteractive({
          phone: input.phone,
          name: input.fullName,
          campName: camp.name,
          date: camp.startDate ? formatDateForMessage(new Date(camp.startDate)) : "غير محدد",
          time: camp.startDate ? formatTimeForMessage(new Date(camp.startDate)) : "غير محدد",
          location: "المستشفى السعودي الألماني - صنعاء",
          bookingId: Number(registration.insertId),
        });
      }

      return { success: true, id: registration.insertId };
    }),

  // List all camp registrations (protected)
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const { camps } = await import("../../drizzle/schema");
    
    const results = await db
      .select({
        id: campRegistrations.id,
        campId: campRegistrations.campId,
        campName: camps.name,
        fullName: campRegistrations.fullName,
        phone: campRegistrations.phone,
        email: campRegistrations.email,
        age: campRegistrations.age,
        procedures: campRegistrations.procedures,
        medicalCondition: campRegistrations.medicalCondition,
        notes: campRegistrations.notes,
        source: campRegistrations.source,
        status: campRegistrations.status,
        createdAt: campRegistrations.createdAt,
        updatedAt: campRegistrations.updatedAt,
      })
      .from(campRegistrations)
      .leftJoin(camps, eq(camps.id, campRegistrations.campId))
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
        fullName: z.string().optional(),
        phone: z.string().optional(),
        attendanceDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {
        status: input.status,
        statusNotes: input.notes,
        updatedAt: new Date(),
      };

      // إضافة البيانات المعدلة إذا تم توفيرها
      if (input.fullName) updateData.fullName = input.fullName;
      if (input.phone) updateData.phone = input.phone;
      if (input.attendanceDate) updateData.attendanceDate = input.attendanceDate;

      await db
        .update(campRegistrations)
        .set(updateData)
        .where(eq(campRegistrations.id, input.id));

      // Send welcome message when status changes to "attended" (Patient Journey)
      if (input.status === "attended") {
        const [registration] = await db.select().from(campRegistrations).where(eq(campRegistrations.id, input.id)).limit(1);
        if (registration && registration.phone) {
          const { sendCampPatientArrivalWelcome } = await import("../messaging");
          const { camps } = await import("../../drizzle/schema");
          const [camp] = await db.select().from(camps).where(eq(camps.id, registration.campId)).limit(1);
          await sendCampPatientArrivalWelcome({
            phone: registration.phone,
            name: registration.fullName || "المريض",
            campName: camp?.name || "المخيم",
          });
        }
      }

      return { success: true };
    }),

  // Bulk update status for multiple registrations (protected)
  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["pending", "confirmed", "attended", "cancelled"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {
        status: input.status,
        statusNotes: input.notes,
        updatedAt: new Date(),
      };

      // Update all selected registrations
      for (const id of input.ids) {
        await db
          .update(campRegistrations)
          .set(updateData)
          .where(eq(campRegistrations.id, id));
      }

      return { success: true, count: input.ids.length };
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
