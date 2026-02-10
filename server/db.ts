import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, campaigns, leads, leadStatusHistory, settings, doctors, appointments, accessRequests, InsertCampaign, InsertLead, InsertLeadStatusHistory, InsertSetting, InsertAppointment, InsertAccessRequest } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User management for OAuth
export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  if (!user.openId) {
    console.warn("[Database] Cannot upsert user: openId is required");
    return;
  }

  try {
    // Check if user exists
    const existing = await getUserByOpenId(user.openId);
    
    if (existing) {
      // Update existing user
      await db.update(users)
        .set({
          name: user.name ?? existing.name,
          email: user.email ?? existing.email,
          loginMethod: user.loginMethod ?? existing.loginMethod,
          lastSignedIn: user.lastSignedIn ?? new Date(),
        })
        .where(eq(users.openId, user.openId));
      console.log('[Database] User updated:', user.email);
    } else {
      // User doesn't exist - this shouldn't happen in our flow
      // because users must be approved first
      console.warn('[Database] User not found, cannot create via upsertUser:', user.email);
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function isUserAllowed(email: string): Promise<boolean> {
  const user = await getUserByEmail(email);
  return user !== undefined && user.isActive === 'yes';
}

// Access request queries
export async function createAccessRequest(request: InsertAccessRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if request already exists
  const existing = await db.select().from(accessRequests)
    .where(eq(accessRequests.email, request.email!))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const result = await db.insert(accessRequests).values(request);
  return { id: Number(result[0].insertId), ...request };
}

export async function getAllAccessRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests).orderBy(desc(accessRequests.requestedAt));
}

export async function getPendingAccessRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accessRequests)
    .where(eq(accessRequests.status, 'pending'))
    .orderBy(desc(accessRequests.requestedAt));
}

export async function approveAccessRequest(requestId: number, reviewerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get request details
  const request = await db.select().from(accessRequests)
    .where(eq(accessRequests.id, requestId))
    .limit(1);
  
  if (request.length === 0) {
    throw new Error("Request not found");
  }
  
  if (!request[0].openId) {
    throw new Error("Request missing openId");
  }
  
  // Create user account with openId from OAuth
  await db.insert(users).values({
    openId: request[0].openId,
    username: request[0].email.split('@')[0],
    password: 'temp_password',
    name: request[0].name,
    email: request[0].email,
    role: 'user',
    isActive: 'yes',
  });
  
  // Update request status
  await db.update(accessRequests)
    .set({ 
      status: 'approved', 
      reviewedAt: new Date(),
      reviewedBy: reviewerId 
    })
    .where(eq(accessRequests.id, requestId));
}

export async function rejectAccessRequest(requestId: number, reviewerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(accessRequests)
    .set({ 
      status: 'rejected', 
      reviewedAt: new Date(),
      reviewedBy: reviewerId 
    })
    .where(eq(accessRequests.id, requestId));
}

// Campaign queries
export async function getAllCampaigns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCampaign(campaign: InsertCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(campaigns).values(campaign);
  return result;
}

export async function updateCampaign(id: number, campaign: Partial<InsertCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(campaigns).set(campaign).where(eq(campaigns.id, id));
}

// Lead queries
export async function getAllLeads() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadsByStatus(status: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.status, status as any)).orderBy(desc(leads.createdAt));
}

export async function getLeadsByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.campaignId, campaignId)).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(leads).values(lead);
  return result;
}

export async function updateLead(id: number, lead: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(leads).set(lead).where(eq(leads.id, id));
}

export async function searchLeads(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(
    or(
      like(leads.fullName, `%${searchTerm}%`),
      like(leads.phone, `%${searchTerm}%`),
      like(leads.email, `%${searchTerm}%`)
    )
  ).orderBy(desc(leads.createdAt));
}

// Lead status history queries
export async function getLeadStatusHistory(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadStatusHistory).where(eq(leadStatusHistory.leadId, leadId)).orderBy(desc(leadStatusHistory.createdAt));
}

export async function createLeadStatusHistory(history: InsertLeadStatusHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(leadStatusHistory).values(history);
}

// Settings queries
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertSetting(setting: InsertSetting) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(settings).values(setting).onDuplicateKeyUpdate({
    set: { value: setting.value, updatedAt: new Date() },
  });
}

// Statistics queries
export async function getLeadsStats() {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    total: sql<number>`count(*)`,
    new: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
    contacted: sql<number>`sum(case when status = 'contacted' then 1 else 0 end)`,
    booked: sql<number>`sum(case when status = 'booked' then 1 else 0 end)`,
    notInterested: sql<number>`sum(case when status = 'not_interested' then 1 else 0 end)`,
    noAnswer: sql<number>`sum(case when status = 'no_answer' then 1 else 0 end)`,
  }).from(leads);
  
  return result[0];
}

export async function getCampaignStats(campaignId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select({
    total: sql<number>`count(*)`,
    new: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
    contacted: sql<number>`sum(case when status = 'contacted' then 1 else 0 end)`,
    booked: sql<number>`sum(case when status = 'booked' then 1 else 0 end)`,
    notInterested: sql<number>`sum(case when status = 'not_interested' then 1 else 0 end)`,
    noAnswer: sql<number>`sum(case when status = 'no_answer' then 1 else 0 end)`,
  }).from(leads).where(eq(leads.campaignId, campaignId));
  
  return result[0];
}

// Doctors queries
export async function getAllDoctors() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(doctors).where(eq(doctors.available, "yes"));
  return result;
}

export async function getDoctorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Appointments queries
export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create appointment: database not available");
    return null;
  }

  try {
    const result = await db.insert(appointments).values(appointment);
    return { success: true, insertId: Number(result[0].insertId) };
  } catch (error) {
    console.error("[Database] Failed to create appointment:", error);
    throw error;
  }
}

export async function getAllAppointments() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: appointments.id,
      campaignId: appointments.campaignId,
      doctorId: appointments.doctorId,
      fullName: appointments.fullName,
      phone: appointments.phone,
      email: appointments.email,
      age: appointments.age,
      procedure: appointments.procedure,
      preferredDate: appointments.preferredDate,
      preferredTime: appointments.preferredTime,
      additionalNotes: appointments.additionalNotes,
      staffNotes: appointments.staffNotes,
      status: appointments.status,
      utmSource: appointments.utmSource,
      utmMedium: appointments.utmMedium,
      utmCampaign: appointments.utmCampaign,
      utmContent: appointments.utmContent,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      doctorName: doctors.name,
      doctorSpecialty: doctors.specialty,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id));
  
  return result;
}

export async function getAppointmentsPaginated(page: number = 1, limit: number = 20, searchTerm?: string) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, limit, totalPages: 0 };
  
  // Support limit=-1 for "all" records
  const isShowAll = limit === -1;
  const offset = isShowAll ? 0 : (page - 1) * limit;
  
  // Build WHERE conditions for search
  const whereConditions = [];
  if (searchTerm && searchTerm.trim()) {
    const searchPattern = `%${searchTerm.trim()}%`;
    whereConditions.push(
      or(
        like(appointments.fullName, searchPattern),
        like(appointments.phone, searchPattern),
        like(appointments.email, searchPattern)
      )
    );
  }
  
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  
  // Get total count with search filter
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(appointments);
  if (whereClause) {
    countQuery.where(whereClause);
  }
  const [countResult] = await countQuery;
  const total = Number(countResult?.count || 0);
  
  // Get paginated data with search filter
  const dataQuery = db
    .select({
      id: appointments.id,
      campaignId: appointments.campaignId,
      doctorId: appointments.doctorId,
      fullName: appointments.fullName,
      phone: appointments.phone,
      email: appointments.email,
      age: appointments.age,
      procedure: appointments.procedure,
      preferredDate: appointments.preferredDate,
      preferredTime: appointments.preferredTime,
      additionalNotes: appointments.additionalNotes,
      staffNotes: appointments.staffNotes,
      status: appointments.status,
      utmSource: appointments.utmSource,
      utmMedium: appointments.utmMedium,
      utmCampaign: appointments.utmCampaign,
      utmContent: appointments.utmContent,
      createdAt: appointments.createdAt,
      updatedAt: appointments.updatedAt,
      doctorName: doctors.name,
      doctorSpecialty: doctors.specialty,
    })
    .from(appointments)
    .leftJoin(doctors, eq(appointments.doctorId, doctors.id));
  
  if (whereClause) {
    dataQuery.where(whereClause);
  }
  
  let result;
  if (isShowAll) {
    result = await dataQuery;
  } else {
    result = await dataQuery.limit(limit).offset(offset);
  }
  
  return {
    data: result,
    total,
    page,
    limit,
    totalPages: isShowAll ? 1 : Math.ceil(total / limit),
  };
}

export async function updateAppointmentStatus(id: number, status: string, staffNotes?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update appointment: database not available");
    return;
  }

  try {
    const updateData: any = { status: status as any };
    if (staffNotes !== undefined) {
      updateData.staffNotes = staffNotes;
    }
    await db.update(appointments).set(updateData).where(eq(appointments.id, id));
  } catch (error) {
    console.error("[Database] Failed to update appointment:", error);
    throw error;
  }
}

export async function bulkUpdateAppointmentStatus(ids: number[], status: string, staffNotes?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot bulk update appointments: database not available");
    return { success: false, count: 0 };
  }

  try {
    const updateData: any = { status: status as any };
    if (staffNotes !== undefined) {
      updateData.staffNotes = staffNotes;
    }
    
    // Update all selected appointments
    for (const id of ids) {
      await db.update(appointments).set(updateData).where(eq(appointments.id, id));
    }
    
    return { success: true, count: ids.length };
  } catch (error) {
    console.error("[Database] Failed to bulk update appointments:", error);
    throw error;
  }
}

/**
 * Get all unified leads from all sources
 * Combines: appointments, offer leads, camp registrations, visiting doctor appointments
 */
export async function getAllUnifiedLeads() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Get appointments
    const appointmentsData = await db
      .select({
        id: appointments.id,
        fullName: appointments.fullName,
        phone: appointments.phone,
        email: appointments.email,
        notes: appointments.notes,
        status: appointments.status,
        createdAt: appointments.createdAt,
        utmSource: appointments.utmSource,
        utmMedium: appointments.utmMedium,
        utmCampaign: appointments.utmCampaign,
        doctorId: appointments.doctorId,
      })
      .from(appointments)
      .orderBy(desc(appointments.createdAt));

    // Get offer leads
    const { offerLeads } = await import('../drizzle/schema');
    const offerLeadsData = await db
      .select({
        id: offerLeads.id,
        fullName: offerLeads.fullName,
        phone: offerLeads.phone,
        email: offerLeads.email,
        notes: offerLeads.notes,
        status: offerLeads.status,
        createdAt: offerLeads.createdAt,
        source: offerLeads.source,
        offerId: offerLeads.offerId,
      })
      .from(offerLeads)
      .orderBy(desc(offerLeads.createdAt));

    // Get camp registrations
    const { campRegistrations } = await import('../drizzle/schema');
    const campRegistrationsData = await db
      .select({
        id: campRegistrations.id,
        fullName: campRegistrations.fullName,
        phone: campRegistrations.phone,
        email: campRegistrations.email,
        notes: campRegistrations.notes,
        status: campRegistrations.status,
        createdAt: campRegistrations.createdAt,
        source: campRegistrations.source,
        campId: campRegistrations.campId,
      })
      .from(campRegistrations)
      .orderBy(desc(campRegistrations.createdAt));

    // Note: visitingDoctorAppointments table doesn't exist yet in schema

    // Combine all leads with type indicator
    const unifiedLeads = [
      ...appointmentsData.map((a: any) => ({
        ...a,
        type: 'appointment' as const,
        typeLabel: 'موعد طبيب',
        relatedId: a.doctorId,
      })),
      ...offerLeadsData.map((o: any) => ({
        ...o,
        type: 'offer' as const,
        typeLabel: 'حجز عرض',
        relatedId: o.offerId,
        utmSource: o.source || '',
        utmMedium: '',
        utmCampaign: '',
      })),
      ...campRegistrationsData.map((c: any) => ({
        ...c,
        type: 'camp' as const,
        typeLabel: 'تسجيل مخيم',
        relatedId: c.campId,
        utmSource: c.source || '',
        utmMedium: '',
        utmCampaign: '',
      })),
      // visitingDoctorAppointments will be added here when table is created
    ];

    // Sort by createdAt descending
    unifiedLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return unifiedLeads;
  } catch (error) {
    console.error('[Database] Error getting unified leads:', error);
    return [];
  }
}

// WhatsApp queries
export async function getAllWhatsAppConversations() {
  const db = await getDb();
  if (!db) return [];
  
  const { whatsappConversations } = await import('../drizzle/schema');
  return db.select().from(whatsappConversations).orderBy(desc(whatsappConversations.lastMessageAt));
}

export async function getWhatsAppConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { whatsappConversations } = await import('../drizzle/schema');
  const result = await db.select().from(whatsappConversations).where(eq(whatsappConversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getWhatsAppConversationByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { whatsappConversations } = await import('../drizzle/schema');
  const result = await db.select().from(whatsappConversations).where(eq(whatsappConversations.phoneNumber, phone)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWhatsAppConversation(conversation: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappConversations } = await import('../drizzle/schema');
  const result = await db.insert(whatsappConversations).values(conversation);
  return result;
}

export async function updateWhatsAppConversation(id: number, conversation: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappConversations } = await import('../drizzle/schema');
  return db.update(whatsappConversations).set(conversation).where(eq(whatsappConversations.id, id));
}

export async function getWhatsAppMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { whatsappMessages } = await import('../drizzle/schema');
  return db.select().from(whatsappMessages).where(eq(whatsappMessages.conversationId, conversationId)).orderBy(whatsappMessages.createdAt);
}

export async function createWhatsAppMessage(message: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappMessages } = await import('../drizzle/schema');
  const result = await db.insert(whatsappMessages).values(message);
  return result;
}

export async function updateWhatsAppMessage(id: number, message: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappMessages } = await import('../drizzle/schema');
  return db.update(whatsappMessages).set(message).where(eq(whatsappMessages.id, id));
}

export async function getAllWhatsAppTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  const { whatsappTemplates } = await import('../drizzle/schema');
  return db.select().from(whatsappTemplates).where(eq(whatsappTemplates.isActive, 1)).orderBy(whatsappTemplates.name);
}

export async function getWhatsAppTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { whatsappTemplates } = await import('../drizzle/schema');
  const result = await db.select().from(whatsappTemplates).where(eq(whatsappTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createWhatsAppTemplate(template: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappTemplates } = await import('../drizzle/schema');
  const result = await db.insert(whatsappTemplates).values(template);
  return result;
}

export async function updateWhatsAppTemplate(id: number, template: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappTemplates } = await import('../drizzle/schema');
  return db.update(whatsappTemplates).set(template).where(eq(whatsappTemplates.id, id));
}

export async function deleteWhatsAppTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { whatsappTemplates } = await import('../drizzle/schema');
  return db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, id));
}

export async function searchWhatsAppConversations(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { whatsappConversations } = await import('../drizzle/schema');
  return db.select().from(whatsappConversations).where(
    or(
      like(whatsappConversations.customerName, `%${searchTerm}%`),
      like(whatsappConversations.phoneNumber, `%${searchTerm}%`)
    )
  ).orderBy(desc(whatsappConversations.lastMessageAt));
}

export async function getUnreadWhatsAppConversationsCount() {
  const db = await getDb();
  if (!db) return 0;
  
  const { whatsappConversations } = await import('../drizzle/schema');
  const result = await db.select({
    count: sql<number>`count(*)`
  }).from(whatsappConversations).where(eq(whatsappConversations.unreadCount, 0));
  
  return result[0]?.count || 0;
}

// ==================== Message Settings Functions ====================

export async function getAllMessageSettings() {
  const db = await getDb();
  if (!db) return [];
  
  const { messageSettings } = await import('../drizzle/schema');
  return db.select().from(messageSettings).orderBy(messageSettings.category, messageSettings.id);
}

export async function getMessageSettingsByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  const { messageSettings } = await import('../drizzle/schema');
  const { sql } = await import('drizzle-orm');
  return db.select().from(messageSettings).where(sql`${messageSettings.category} = ${category}`).orderBy(messageSettings.id);
}

export async function getMessageSettingByType(messageType: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const { messageSettings } = await import('../drizzle/schema');
  const result = await db.select().from(messageSettings).where(eq(messageSettings.messageType, messageType)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateMessageSetting(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { messageSettings } = await import('../drizzle/schema');
  const { id, ...updateData } = data;
  return db.update(messageSettings).set(updateData).where(eq(messageSettings.id, id));
}

export async function toggleMessageSettingEnabled(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { messageSettings } = await import('../drizzle/schema');
  
  // Get current value
  const current = await db.select().from(messageSettings).where(eq(messageSettings.id, id)).limit(1);
  if (current.length === 0) throw new Error("Message setting not found");
  
  const newValue = current[0].isEnabled === 1 ? 0 : 1;
  return db.update(messageSettings).set({ isEnabled: newValue }).where(eq(messageSettings.id, id));
}

export async function getOfferLeadsPaginated(page: number = 1, limit: number = 20, searchTerm?: string) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, limit, totalPages: 0 };
  
  // Support limit=-1 for "all" records
  const isShowAll = limit === -1;
  const offset = isShowAll ? 0 : (page - 1) * limit;
  
  // Import offerLeads and offers
  const { offerLeads, offers } = await import('../drizzle/schema');
  
  // Build WHERE conditions for search
  const whereConditions = [];
  if (searchTerm && searchTerm.trim()) {
    const searchPattern = `%${searchTerm.trim()}%`;
    whereConditions.push(
      or(
        like(offerLeads.fullName, searchPattern),
        like(offerLeads.phone, searchPattern),
        like(offerLeads.email, searchPattern)
      )
    );
  }
  
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  
  // Get total count with search filter
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(offerLeads);
  if (whereClause) {
    countQuery.where(whereClause);
  }
  const [countResult] = await countQuery;
  const total = Number(countResult?.count || 0);
  
  // Get paginated data with offer details and search filter
  const dataQuery = db
    .select({
      id: offerLeads.id,
      offerId: offerLeads.offerId,
      offerTitle: offers.title,
      fullName: offerLeads.fullName,
      phone: offerLeads.phone,
      email: offerLeads.email,
      notes: offerLeads.notes,
      status: offerLeads.status,
      statusNotes: offerLeads.statusNotes,
      source: offerLeads.source,
      utmSource: offerLeads.utmSource,
      utmMedium: offerLeads.utmMedium,
      utmCampaign: offerLeads.utmCampaign,
      utmContent: offerLeads.utmContent,
      referrer: offerLeads.referrer,
      fbclid: offerLeads.fbclid,
      gclid: offerLeads.gclid,
      createdAt: offerLeads.createdAt,
      updatedAt: offerLeads.updatedAt,
    })
    .from(offerLeads)
    .leftJoin(offers, eq(offerLeads.offerId, offers.id));
  
  if (whereClause) {
    dataQuery.where(whereClause);
  }
  
  let result;
  if (isShowAll) {
    result = await dataQuery.orderBy(desc(offerLeads.createdAt));
  } else {
    result = await dataQuery
      .orderBy(desc(offerLeads.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  return {
    data: result,
    total,
    page,
    limit,
    totalPages: isShowAll ? 1 : Math.ceil(total / limit),
  };
}

export async function getCampRegistrationsPaginated(page: number = 1, limit: number = 20, searchTerm?: string) {
  const db = await getDb();
  if (!db) return { data: [], total: 0, page, limit, totalPages: 0 };
  
  // Support limit=-1 for "all" records
  const isShowAll = limit === -1;
  const offset = isShowAll ? 0 : (page - 1) * limit;
  
  // Import campRegistrations and camps
  const { campRegistrations, camps } = await import('../drizzle/schema');
  
  // Build WHERE conditions for search
  const whereConditions = [];
  if (searchTerm && searchTerm.trim()) {
    const searchPattern = `%${searchTerm.trim()}%`;
    whereConditions.push(
      or(
        like(campRegistrations.fullName, searchPattern),
        like(campRegistrations.phone, searchPattern),
        like(campRegistrations.email, searchPattern)
      )
    );
  }
  
  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
  
  // Get total count with search filter
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(campRegistrations);
  if (whereClause) {
    countQuery.where(whereClause);
  }
  const [countResult] = await countQuery;
  const total = Number(countResult?.count || 0);
  
  // Get paginated data with camp details and search filter
  const dataQuery = db
    .select({
      id: campRegistrations.id,
      campId: campRegistrations.campId,
      campName: camps.name,
      fullName: campRegistrations.fullName,
      phone: campRegistrations.phone,
      email: campRegistrations.email,
      age: campRegistrations.age,
      gender: campRegistrations.gender,
      procedures: campRegistrations.procedures,
      medicalCondition: campRegistrations.medicalCondition,
      notes: campRegistrations.notes,
      status: campRegistrations.status,
      statusNotes: campRegistrations.statusNotes,
      attendanceDate: campRegistrations.attendanceDate,
      source: campRegistrations.source,
      utmSource: campRegistrations.utmSource,
      utmMedium: campRegistrations.utmMedium,
      utmCampaign: campRegistrations.utmCampaign,
      utmContent: campRegistrations.utmContent,
      referrer: campRegistrations.referrer,
      fbclid: campRegistrations.fbclid,
      gclid: campRegistrations.gclid,
      createdAt: campRegistrations.createdAt,
      updatedAt: campRegistrations.updatedAt,
    })
    .from(campRegistrations)
    .leftJoin(camps, eq(campRegistrations.campId, camps.id));
  
  if (whereClause) {
    dataQuery.where(whereClause);
  }
  
  let result;
  if (isShowAll) {
    result = await dataQuery.orderBy(desc(campRegistrations.createdAt));
  } else {
    result = await dataQuery
      .orderBy(desc(campRegistrations.createdAt))
      .limit(limit)
      .offset(offset);
  }
  
  return {
    data: result,
    total,
    page,
    limit,
    totalPages: isShowAll ? 1 : Math.ceil(total / limit),
  };
}
