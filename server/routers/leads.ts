import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { createAuditLog } from "./auditLogs";
import {
  createLead,
  getCampaignBySlug,
  getAllLeads,
  getLeadById,
  updateLead,
  createLeadStatusHistory,
  getLeadStatusHistory,
  getLeadsStats,
  searchLeads,
  getLeadsByCampaign,
  createCampaign,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { sendNewLeadNotification } from "../email";
import { sendNewLeadTelegram } from "../telegram";
import { sendWelcomeMessage, sendBookingConfirmation, sendCustomMessage } from "../whatsapp";

export const leadsRouter = router({
  // Public endpoint for lead submission from landing page
  submit: publicProcedure
    .input(z.object({
      campaignSlug: z.string(),
      fullName: z.string().min(1),
      phone: z.string().min(1),
      email: z.string().email().optional(),
      notes: z.string().optional(),
      status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer", "pending", "confirmed", "completed", "cancelled"]).optional(),
      source: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
      utmTerm: z.string().optional(),
      utmContent: z.string().optional(),
      utmPlacement: z.string().optional(),
      referrer: z.string().optional(),
      fbclid: z.string().optional(),
      gclid: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Get or create campaign by slug
      let campaign = await getCampaignBySlug(input.campaignSlug);
      if (!campaign) {
        // Auto-create campaign for appointments
        await createCampaign({
          name: `حجز موعد - ${input.campaignSlug}`,
          slug: input.campaignSlug,
          description: `حجز موعد تلقائي`,
          isActive: true,
          whatsappEnabled: false,
        });
        campaign = await getCampaignBySlug(input.campaignSlug);
      }
      
      if (!campaign) {
        throw new Error("Failed to create or retrieve campaign");
      }

      // Create lead
      await createLead({
        campaignId: campaign.id,
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        status: input.status || "new",
        source: input.source || "direct",
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        utmContent: input.utmContent,
        emailSent: false,
        whatsappSent: false,
        bookingConfirmationSent: false,
      });

      // Send notification to owner
      await notifyOwner({
        title: "تسجيل جديد في المخيم الطبي الخيري",
        content: `تم تسجيل عميل جديد:
الاسم: ${input.fullName}
الهاتف: ${input.phone}
البريد: ${input.email || "غير متوفر"}`,
      });

      // Send Telegram notification
      await sendNewLeadTelegram({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        source: input.utmSource || "direct",
      });

      // Send email notification
      await sendNewLeadNotification({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        campaignName: campaign.name,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        createdAt: new Date(),
      });

      // Send WhatsApp welcome message if enabled
      if (campaign.whatsappEnabled) {
        await sendWelcomeMessage({
          phone: input.phone,
          fullName: input.fullName,
          campaignName: campaign.name,
          welcomeMessage: campaign.whatsappWelcomeMessage || undefined,
        });
      }

      return { success: true };
    }),

  // Admin endpoints
  list: protectedProcedure.query(async () => {
    return getAllLeads();
  }),

  // Unified list from all sources
  unifiedList: protectedProcedure.query(async () => {
    const { getAllUnifiedLeads } = await import('../db');
    return getAllUnifiedLeads();
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return getLeadById(input.id);
    }),

  search: protectedProcedure
    .input(z.object({ searchTerm: z.string() }))
    .query(async ({ input }) => {
      return searchLeads(input.searchTerm);
    }),

  getByCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      return getLeadsByCampaign(input.campaignId);
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "booked", "not_interested", "no_answer"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lead = await getLeadById(input.id);
      if (!lead) {
        throw new Error("Lead not found");
      }

      // Update lead status
      await updateLead(input.id, { status: input.status });

      // Create status history
      await createLeadStatusHistory({
        leadId: input.id,
        userId: ctx.user.id,
        oldStatus: lead.status,
        newStatus: input.status,
        notes: input.notes,
      });

      // Create audit log
      await createAuditLog({
        entityType: 'lead',
        entityId: input.id,
        action: 'status_change',
        oldValue: lead.status,
        newValue: input.status,
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        notes: input.notes,
      });

      return { success: true };
    }),

  getStatusHistory: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      return getLeadStatusHistory(input.leadId);
    }),

  stats: protectedProcedure.query(async () => {
    return getLeadsStats();
  }),

  sendWhatsApp: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      message: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) {
        throw new Error("Lead not found");
      }

      const success = await sendCustomMessage(lead.phone, input.message);
      
      if (success) {
        await updateLead(input.leadId, {
          whatsappSent: true,
        });
      }

      return { success };
    }),

  sendBookingConfirmation: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      appointmentDate: z.string().optional(),
      appointmentTime: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.leadId);
      if (!lead) {
        throw new Error("Lead not found");
      }

      const success = await sendBookingConfirmation({
        phone: lead.phone,
        fullName: lead.fullName,
        appointmentDate: input.appointmentDate,
        appointmentTime: input.appointmentTime,
      });

      if (success) {
        await updateLead(input.leadId, {
          bookingConfirmationSent: true,
        });
      }

      return { success };
    }),
});
