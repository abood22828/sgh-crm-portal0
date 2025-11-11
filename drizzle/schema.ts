import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isActive: mysqlEnum("isActive", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Campaigns table - stores marketing campaign information
 */
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  isActive: boolean("isActive").default(true).notNull(),
  metaPixelId: varchar("metaPixelId", { length: 100 }),
  metaAccessToken: text("metaAccessToken"),
  whatsappEnabled: boolean("whatsappEnabled").default(false).notNull(),
  whatsappWelcomeMessage: text("whatsappWelcomeMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = typeof campaigns.$inferInsert;

/**
 * Leads table - stores customer registration data
 */
/**
 * Leads table - stores customer registration data from various sources
 * يخزن بيانات تسجيل العملاء من مصادر مختلفة (عروض، أطباء، مخيمات)
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["new", "contacted", "booked", "not_interested", "no_answer"]).default("new").notNull(),
  source: varchar("source", { length: 100 }),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  utmContent: varchar("utmContent", { length: 100 }),
  sourceType: mysqlEnum("sourceType", ["offer", "doctor", "camp", "campaign"]).default("campaign").notNull(), // Track the source type
  sourceId: int("sourceId"), // ID of the offer, doctor, or camp
  notes: text("notes"),
  emailSent: boolean("emailSent").default(false).notNull(),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  bookingConfirmationSent: boolean("bookingConfirmationSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Lead status history - tracks all status changes
 */
export const leadStatusHistory = mysqlTable("leadStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId"),
  oldStatus: varchar("oldStatus", { length: 50 }),
  newStatus: varchar("newStatus", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadStatusHistory = typeof leadStatusHistory.$inferSelect;
export type InsertLeadStatusHistory = typeof leadStatusHistory.$inferInsert;

/**
 * Settings table - stores system configuration
 */
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;

/**
 * Doctors table - stores information about hospital doctors
 */
/**
 * Doctors table - stores information about hospital doctors
 * يخزن معلومات أطباء المستشفى
 */
export const doctors = mysqlTable("doctors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: varchar("specialty", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // Unique URL-friendly identifier for landing pages
  image: varchar("image", { length: 500 }),
  bio: text("bio"),
  available: mysqlEnum("available", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Doctor = typeof doctors.$inferSelect;
export type InsertDoctor = typeof doctors.$inferInsert;

/**
 * Appointments table - stores appointment bookings
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  doctorId: int("doctorId").notNull(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  preferredDate: varchar("preferredDate", { length: 50 }),
  preferredTime: varchar("preferredTime", { length: 50 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  utmSource: varchar("utmSource", { length: 100 }),
  utmMedium: varchar("utmMedium", { length: 100 }),
  utmCampaign: varchar("utmCampaign", { length: 100 }),
  utmContent: varchar("utmContent", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// Access requests table for new user authorization
export const accessRequests = mysqlTable("accessRequests", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: int("reviewedBy"),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

/**
 * Offers table - stores special medical offers and promotions
 * يخزن العروض الطبية الخاصة والعروض الترويجية
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(), // Offer title (e.g., "OB/GYN Delivery Special")
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier for landing pages
  description: text("description"), // Detailed offer description
  imageUrl: varchar("imageUrl", { length: 500 }), // Offer promotional image
  isActive: boolean("isActive").default(true).notNull(), // Is the offer currently active?
  startDate: timestamp("startDate"), // Offer start date
  endDate: timestamp("endDate"), // Offer end date
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

/**
 * Camps table - stores information about medical camps
 * يخزن معلومات المخيمات الطبية
 */
export const camps = mysqlTable("camps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // Camp name (e.g., "General Surgery Camp")
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier for landing pages
  description: text("description"), // Detailed camp description
  imageUrl: varchar("imageUrl", { length: 500 }), // Camp promotional image
  startDate: timestamp("startDate"), // Camp start date
  endDate: timestamp("endDate"), // Camp end date
  isActive: boolean("isActive").default(true).notNull(), // Is the camp currently active?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Camp = typeof camps.$inferSelect;
export type InsertCamp = typeof camps.$inferInsert;
