import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { appointments, campRegistrations, offerLeads, leads, camps, offers, doctors } from "../../drizzle/schema";
import { and, between, count, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Reports Router
 * Provides comprehensive reports for bookings, leads, conversion rates, and revenue
 */

const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const reportsRouter = router({
  /**
   * Get bookings and appointments report
   * Returns statistics for appointments, camp registrations, and offer leads
   */
  getBookingsReport: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      // Build date filter
      const dateFilter = startDate && endDate
        ? and(
            gte(sql`createdAt`, new Date(startDate)),
            lte(sql`createdAt`, new Date(endDate))
          )
        : undefined;

      // Get appointments statistics
      const appointmentsStats = await db
        .select({
          total: count(),
          status: appointments.status,
        })
        .from(appointments)
        .where(dateFilter)
        .groupBy(appointments.status);

      // Get camp registrations statistics
      const campRegistrationsStats = await db
        .select({
          total: count(),
          status: campRegistrations.status,
        })
        .from(campRegistrations)
        .where(dateFilter)
        .groupBy(campRegistrations.status);

      // Get offer leads statistics
      const offerLeadsStats = await db
        .select({
          total: count(),
          status: offerLeads.status,
        })
        .from(offerLeads)
        .where(dateFilter)
        .groupBy(offerLeads.status);

      // Calculate totals
      const totalAppointments = appointmentsStats.reduce((sum, stat) => sum + stat.total, 0);
      const totalCampRegistrations = campRegistrationsStats.reduce((sum, stat) => sum + stat.total, 0);
      const totalOfferLeads = offerLeadsStats.reduce((sum, stat) => sum + stat.total, 0);

      return {
        appointments: {
          total: totalAppointments,
          byStatus: appointmentsStats,
        },
        campRegistrations: {
          total: totalCampRegistrations,
          byStatus: campRegistrationsStats,
        },
        offerLeads: {
          total: totalOfferLeads,
          byStatus: offerLeadsStats,
        },
        grandTotal: totalAppointments + totalCampRegistrations + totalOfferLeads,
      };
    }),

  /**
   * Get new leads report
   * Returns statistics for new customer registrations
   */
  getNewLeadsReport: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      const dateFilter = startDate && endDate
        ? and(
            gte(sql`createdAt`, new Date(startDate)),
            lte(sql`createdAt`, new Date(endDate))
          )
        : undefined;

      // Get leads by source
      const leadsBySource = await db
        .select({
          total: count(),
          source: leads.source,
        })
        .from(leads)
        .where(dateFilter)
        .groupBy(leads.source);

      // Get leads by status
      const leadsByStatus = await db
        .select({
          total: count(),
          status: leads.status,
        })
        .from(leads)
        .where(dateFilter)
        .groupBy(leads.status);

      // Get appointments by source
      const appointmentsBySource = await db
        .select({
          total: count(),
          source: appointments.source,
        })
        .from(appointments)
        .where(dateFilter)
        .groupBy(appointments.source);

      // Get camp registrations by source
      const campRegistrationsBySource = await db
        .select({
          total: count(),
          source: campRegistrations.source,
        })
        .from(campRegistrations)
        .where(dateFilter)
        .groupBy(campRegistrations.source);

      // Get offer leads by source
      const offerLeadsBySource = await db
        .select({
          total: count(),
          source: offerLeads.source,
        })
        .from(offerLeads)
        .where(dateFilter)
        .groupBy(offerLeads.source);

      // Combine all sources
      const allSources = new Map<string, number>();
      
      [...leadsBySource, ...appointmentsBySource, ...campRegistrationsBySource, ...offerLeadsBySource].forEach(item => {
        const source = item.source || "direct";
        allSources.set(source, (allSources.get(source) || 0) + item.total);
      });

      const sourceStats = Array.from(allSources.entries()).map(([source, total]) => ({
        source,
        total,
      }));

      const totalLeads = leadsByStatus.reduce((sum, stat) => sum + stat.total, 0);

      return {
        totalLeads,
        bySource: sourceStats,
        byStatus: leadsByStatus,
      };
    }),

  /**
   * Get conversion rates report
   * Returns conversion statistics from leads to bookings
   */
  getConversionRatesReport: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      const dateFilter = startDate && endDate
        ? and(
            gte(sql`createdAt`, new Date(startDate)),
            lte(sql`createdAt`, new Date(endDate))
          )
        : undefined;

      // Get total leads
      const [totalLeadsResult] = await db
        .select({ count: count() })
        .from(leads)
        .where(dateFilter);

      // Get booked leads
      const [bookedLeadsResult] = await db
        .select({ count: count() })
        .from(leads)
        .where(
          dateFilter
            ? and(dateFilter, eq(leads.status, "booked"))
            : eq(leads.status, "booked")
        );

      // Get total appointments
      const [totalAppointmentsResult] = await db
        .select({ count: count() })
        .from(appointments)
        .where(dateFilter);

      // Get confirmed/completed appointments
      const [confirmedAppointmentsResult] = await db
        .select({ count: count() })
        .from(appointments)
        .where(
          dateFilter
            ? and(
                dateFilter,
                sql`${appointments.status} IN ('confirmed', 'completed')`
              )
            : sql`${appointments.status} IN ('confirmed', 'completed')`
        );

      // Get total offer leads
      const [totalOfferLeadsResult] = await db
        .select({ count: count() })
        .from(offerLeads)
        .where(dateFilter);

      // Get confirmed offer leads
      const [bookedOfferLeadsResult] = await db
        .select({ count: count() })
        .from(offerLeads)
        .where(
          dateFilter
            ? and(dateFilter, eq(offerLeads.status, "confirmed"))
            : eq(offerLeads.status, "confirmed")
        );

      // Get total camp registrations
      const [totalCampRegistrationsResult] = await db
        .select({ count: count() })
        .from(campRegistrations)
        .where(dateFilter);

      // Get confirmed/attended camp registrations
      const [confirmedCampRegistrationsResult] = await db
        .select({ count: count() })
        .from(campRegistrations)
        .where(
          dateFilter
            ? and(
                dateFilter,
                sql`${campRegistrations.status} IN ('confirmed', 'attended')`
              )
            : sql`${campRegistrations.status} IN ('confirmed', 'attended')`
        );

      const totalLeads = totalLeadsResult.count;
      const bookedLeads = bookedLeadsResult.count;
      const totalAppointments = totalAppointmentsResult.count;
      const confirmedAppointments = confirmedAppointmentsResult.count;
      const totalOfferLeads = totalOfferLeadsResult.count;
      const bookedOfferLeads = bookedOfferLeadsResult.count;
      const totalCampRegistrations = totalCampRegistrationsResult.count;
      const confirmedCampRegistrations = confirmedCampRegistrationsResult.count;

      // Calculate conversion rates
      const leadsConversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;
      const appointmentsConversionRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments) * 100 : 0;
      const offerLeadsConversionRate = totalOfferLeads > 0 ? (bookedOfferLeads / totalOfferLeads) * 100 : 0;
      const campRegistrationsConversionRate = totalCampRegistrations > 0 ? (confirmedCampRegistrations / totalCampRegistrations) * 100 : 0;

      // Overall conversion rate
      const totalRequests = totalLeads + totalAppointments + totalOfferLeads + totalCampRegistrations;
      const totalConverted = bookedLeads + confirmedAppointments + bookedOfferLeads + confirmedCampRegistrations;
      const overallConversionRate = totalRequests > 0 ? (totalConverted / totalRequests) * 100 : 0;

      return {
        overall: {
          totalRequests,
          totalConverted,
          conversionRate: overallConversionRate,
        },
        leads: {
          total: totalLeads,
          converted: bookedLeads,
          conversionRate: leadsConversionRate,
        },
        appointments: {
          total: totalAppointments,
          converted: confirmedAppointments,
          conversionRate: appointmentsConversionRate,
        },
        offerLeads: {
          total: totalOfferLeads,
          converted: bookedOfferLeads,
          conversionRate: offerLeadsConversionRate,
        },
        campRegistrations: {
          total: totalCampRegistrations,
          converted: confirmedCampRegistrations,
          conversionRate: campRegistrationsConversionRate,
        },
      };
    }),

  /**
   * Get revenue report (placeholder - will be implemented when payment integration is added)
   * Returns revenue and profit statistics
   */
  getRevenueReport: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      // This is a placeholder for future revenue tracking
      // Will be implemented when payment integration is added
      return {
        totalRevenue: 0,
        totalProfit: 0,
        byService: [],
        byMonth: [],
        note: "Revenue tracking will be available after payment integration",
      };
    }),

  /**
   * Get detailed bookings list for export
   */
  getDetailedBookingsList: protectedProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { startDate, endDate } = input;

      const dateFilter = startDate && endDate
        ? and(
            gte(sql`createdAt`, new Date(startDate)),
            lte(sql`createdAt`, new Date(endDate))
          )
        : undefined;

      // Get appointments with doctor names
      const appointmentsList = await db
        .select({
          id: appointments.id,
          type: sql<string>`'موعد طبيب'`,
          fullName: appointments.fullName,
          phone: appointments.phone,
          email: appointments.email,
          service: doctors.name,
          status: appointments.status,
          source: appointments.source,
          createdAt: appointments.createdAt,
        })
        .from(appointments)
        .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
        .where(dateFilter);

      // Get camp registrations with camp names
      const campRegistrationsList = await db
        .select({
          id: campRegistrations.id,
          type: sql<string>`'تسجيل مخيم'`,
          fullName: campRegistrations.fullName,
          phone: campRegistrations.phone,
          email: campRegistrations.email,
          service: camps.name,
          status: campRegistrations.status,
          source: campRegistrations.source,
          createdAt: campRegistrations.createdAt,
        })
        .from(campRegistrations)
        .leftJoin(camps, eq(campRegistrations.campId, camps.id))
        .where(dateFilter);

      // Get offer leads with offer titles
      const offerLeadsList = await db
        .select({
          id: offerLeads.id,
          type: sql<string>`'طلب عرض'`,
          fullName: offerLeads.fullName,
          phone: offerLeads.phone,
          email: offerLeads.email,
          service: offers.title,
          status: offerLeads.status,
          source: offerLeads.source,
          createdAt: offerLeads.createdAt,
        })
        .from(offerLeads)
        .leftJoin(offers, eq(offerLeads.offerId, offers.id))
        .where(dateFilter);

      // Combine all lists
      const allBookings = [
        ...appointmentsList,
        ...campRegistrationsList,
        ...offerLeadsList,
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return allBookings;
    }),
});
