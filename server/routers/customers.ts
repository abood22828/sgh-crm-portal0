/**
 * Customers Router - ملف العميل الموحد
 * يجمع جميع سجلات العميل من الجداول المختلفة عبر رقم الهاتف
 */

import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { eq, desc, like, or, sql, and } from 'drizzle-orm';
import { appointments, leads, offerLeads, campRegistrations, doctors, offers, camps } from '../../drizzle/schema';

/**
 * Get unified customer profile by phone number
 * جلب ملف العميل الموحد عبر رقم الهاتف
 */
async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return null;

  // Normalize phone number (remove spaces, dashes)
  const normalizedPhone = phone.replace(/[\s\-]/g, '');

  // Fetch from all tables in parallel
  const [appointmentRecords, leadRecords, offerLeadRecords, campRegRecords] = await Promise.all([
    db.select({
      id: appointments.id,
      fullName: appointments.fullName,
      phone: appointments.phone,
      email: appointments.email,
      status: appointments.status,
      source: appointments.source,
      doctorId: appointments.doctorId,
      procedure: appointments.procedure,
      appointmentDate: appointments.appointmentDate,
      notes: appointments.notes,
      createdAt: appointments.createdAt,
      doctorName: doctors.name,
      doctorSpecialty: doctors.specialty,
    })
      .from(appointments)
      .leftJoin(doctors, eq(appointments.doctorId, doctors.id))
      .where(eq(appointments.phone, normalizedPhone))
      .orderBy(desc(appointments.createdAt)),

    db.select()
      .from(leads)
      .where(eq(leads.phone, normalizedPhone))
      .orderBy(desc(leads.createdAt)),

    db.select({
      id: offerLeads.id,
      fullName: offerLeads.fullName,
      phone: offerLeads.phone,
      email: offerLeads.email,
      status: offerLeads.status,
      source: offerLeads.source,
      notes: offerLeads.notes,
      offerId: offerLeads.offerId,
      createdAt: offerLeads.createdAt,
      offerTitle: offers.title,
    })
      .from(offerLeads)
      .leftJoin(offers, eq(offerLeads.offerId, offers.id))
      .where(eq(offerLeads.phone, normalizedPhone))
      .orderBy(desc(offerLeads.createdAt)),

    db.select({
      id: campRegistrations.id,
      fullName: campRegistrations.fullName,
      phone: campRegistrations.phone,
      email: campRegistrations.email,
      status: campRegistrations.status,
      source: campRegistrations.source,
      notes: campRegistrations.notes,
      campId: campRegistrations.campId,
      procedures: campRegistrations.procedures,
      createdAt: campRegistrations.createdAt,
      campName: camps.name,
    })
      .from(campRegistrations)
      .leftJoin(camps, eq(campRegistrations.campId, camps.id))
      .where(eq(campRegistrations.phone, normalizedPhone))
      .orderBy(desc(campRegistrations.createdAt)),
  ]);

  // Get most recent name and email
  const allRecords = [
    ...appointmentRecords.map(r => ({ name: r.fullName, email: r.email, date: r.createdAt })),
    ...leadRecords.map(r => ({ name: r.fullName, email: r.email, date: r.createdAt })),
    ...offerLeadRecords.map(r => ({ name: r.fullName, email: r.email, date: r.createdAt })),
    ...campRegRecords.map(r => ({ name: r.fullName, email: r.email, date: r.createdAt })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestName = allRecords[0]?.name || '';
  const latestEmail = allRecords.find(r => r.email)?.email || null;

  return {
    phone: normalizedPhone,
    name: latestName,
    email: latestEmail,
    totalInteractions: appointmentRecords.length + leadRecords.length + offerLeadRecords.length + campRegRecords.length,
    firstSeen: allRecords.length > 0 ? allRecords[allRecords.length - 1].date : null,
    lastSeen: allRecords.length > 0 ? allRecords[0].date : null,
    appointments: appointmentRecords,
    leads: leadRecords,
    offerLeads: offerLeadRecords,
    campRegistrations: campRegRecords,
  };
}

/**
 * Get all unique customers with pagination
 * جلب جميع العملاء الفريدين مع pagination
 */
async function getCustomersPaginated(params: {
  page: number;
  limit: number;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) return { customers: [], total: 0 };

  const { page, limit, searchTerm } = params;
  const offset = (page - 1) * limit;

  // Use UNION to get all unique phone numbers with latest info
  // We'll use a subquery approach for better performance
  let searchCondition = '';
  const searchParams: string[] = [];
  if (searchTerm && searchTerm.trim()) {
    searchCondition = `WHERE name LIKE ? OR phone LIKE ?`;
    searchParams.push(`%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`);
  }

  // Get unique customers from all tables using raw SQL for UNION
  const unionQuery = `
    SELECT phone, fullName as name, email, MAX(createdAt) as lastSeen, MIN(createdAt) as firstSeen, COUNT(*) as totalRecords
    FROM (
      SELECT phone, fullName, email, createdAt FROM appointments
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM leads
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM offerLeads
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM campRegistrations
    ) AS all_records
    GROUP BY phone
    ${searchCondition ? `HAVING name LIKE ? OR phone LIKE ?` : ''}
    ORDER BY lastSeen DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT phone
      FROM (
        SELECT phone, fullName as name FROM appointments
        UNION ALL
        SELECT phone, fullName as name FROM leads
        UNION ALL
        SELECT phone, fullName as name FROM offerLeads
        UNION ALL
        SELECT phone, fullName as name FROM campRegistrations
      ) AS all_records
      GROUP BY phone
      ${searchCondition ? `HAVING name LIKE ? OR phone LIKE ?` : ''}
    ) AS unique_customers
  `;

  const queryParams = searchTerm && searchTerm.trim()
    ? [`%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`, limit, offset]
    : [limit, offset];

  const countParams = searchTerm && searchTerm.trim()
    ? [`%${searchTerm.trim()}%`, `%${searchTerm.trim()}%`]
    : [];

  const [customersResult, countResult] = await Promise.all([
    db.execute(sql.raw(unionQuery + ';').append(sql``)),
    db.execute(sql.raw(countQuery + ';').append(sql``)),
  ]);

  // Use parameterized queries for safety
  const customersRows = await db.execute(
    sql`SELECT phone, fullName as name, email, MAX(createdAt) as lastSeen, MIN(createdAt) as firstSeen, COUNT(*) as totalRecords
    FROM (
      SELECT phone, fullName, email, createdAt FROM appointments
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM leads
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM offerLeads
      UNION ALL
      SELECT phone, fullName, email, createdAt FROM campRegistrations
    ) AS all_records
    GROUP BY phone
    ${searchTerm && searchTerm.trim() ? sql`HAVING name LIKE ${`%${searchTerm.trim()}%`} OR phone LIKE ${`%${searchTerm.trim()}%`}` : sql``}
    ORDER BY lastSeen DESC
    LIMIT ${limit} OFFSET ${offset}`
  );

  const countRows = await db.execute(
    sql`SELECT COUNT(*) as total FROM (
      SELECT phone
      FROM (
        SELECT phone, fullName as name FROM appointments
        UNION ALL
        SELECT phone, fullName as name FROM leads
        UNION ALL
        SELECT phone, fullName as name FROM offerLeads
        UNION ALL
        SELECT phone, fullName as name FROM campRegistrations
      ) AS all_records
      GROUP BY phone
      ${searchTerm && searchTerm.trim() ? sql`HAVING name LIKE ${`%${searchTerm.trim()}%`} OR phone LIKE ${`%${searchTerm.trim()}%`}` : sql``}
    ) AS unique_customers`
  );

  const customers = (customersRows as any)[0] || [];
  const total = ((countRows as any)[0] as any)?.[0]?.total || 0;

  return {
    customers: Array.isArray(customers) ? customers : [],
    total: Number(total),
  };
}

export const customersRouter = router({
  /**
   * Get paginated list of all unique customers
   * جلب قائمة العملاء الفريدين مع pagination
   */
  listPaginated: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(1000).default(100),
      searchTerm: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getCustomersPaginated(input);
    }),

  /**
   * Get customer profile by phone number
   * جلب ملف العميل الكامل عبر رقم الهاتف
   */
  getByPhone: protectedProcedure
    .input(z.object({
      phone: z.string().min(1),
    }))
    .query(async ({ input }) => {
      return getCustomerByPhone(input.phone);
    }),
});
