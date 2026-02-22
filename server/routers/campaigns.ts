import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getCampaigns,
  getCampaignById,
  getCampaignBySlug,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
  getCampaignsOverview,
  getCampaignAllLinks,
  linkOffersToCampaign,
  linkCampsToCampaign,
  linkDoctorsToCampaign,
} from "../db/campaigns";

// Validation schemas
const campaignTypeSchema = z.enum(["digital", "field", "awareness", "mixed"]);
const campaignStatusSchema = z.enum(["draft", "active", "paused", "completed", "cancelled"]);

const createCampaignSchema = z.object({
  name: z.string().min(1, "اسم الحملة مطلوب"),
  slug: z.string().min(1, "الرابط المختصر مطلوب"),
  description: z.string().optional(),
  type: campaignTypeSchema,
  status: campaignStatusSchema.optional(),
  plannedBudget: z.number().optional(),
  actualBudget: z.number().optional(),
  currency: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  platforms: z.string().optional(), // JSON string
  goals: z.string().optional(), // JSON string
  targetLeads: z.number().optional(),
  targetBookings: z.number().optional(),
  targetROI: z.number().optional(),
  targetRevenue: z.number().optional(),
  kpis: z.string().optional(),
  notes: z.string().optional(),
  teamLeaderId: z.number().optional(),
  teamMembers: z.string().optional(), // JSON string
  metaPixelId: z.string().optional(),
  metaAccessToken: z.string().optional(),
  whatsappEnabled: z.boolean().optional(),
  whatsappWelcomeMessage: z.string().optional(),
});

const updateCampaignSchema = createCampaignSchema.partial().extend({
  id: z.number(),
  targetRevenue: z.number().optional(),
  kpis: z.string().optional(),
  notes: z.string().optional(),
});

export const campaignsRouter = router({
  // Get all campaigns with filters
  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return await getCampaigns(input);
    }),

  // Get campaign by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return await getCampaignById(input.id);
    }),

  // Get campaign by slug
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await getCampaignBySlug(input.slug);
    }),

  // Create campaign
  create: protectedProcedure
    .input(createCampaignSchema)
    .mutation(async ({ input }) => {
      return await createCampaign(input as any);
    }),

  // Update campaign
  update: protectedProcedure
    .input(updateCampaignSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await updateCampaign(id, data as any);
    }),

  // Delete campaign
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteCampaign(input.id);
    }),

  // Get campaign statistics
  getStats: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      return await getCampaignStats(input.campaignId);
    }),

  // Get campaigns overview
  getOverview: protectedProcedure
    .query(async () => {
      return await getCampaignsOverview();
    }),

  // Get all campaign links (offers, camps, doctors)
  getLinks: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      return await getCampaignAllLinks(input.campaignId);
    }),

  // Link offers to campaign
  linkOffers: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      offerIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      return await linkOffersToCampaign(input.campaignId, input.offerIds);
    }),

  // Link camps to campaign
  linkCamps: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      campIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      return await linkCampsToCampaign(input.campaignId, input.campIds);
    }),

  // Link doctors to campaign
  linkDoctors: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      doctorIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      return await linkDoctorsToCampaign(input.campaignId, input.doctorIds);
    }),
});
