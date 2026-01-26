import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const whatsappRouter = router({
  // Conversations
  conversations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllWhatsAppConversations();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWhatsAppConversationById(input.id);
      }),

    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchWhatsAppConversations(input.searchTerm);
      }),

    unreadCount: protectedProcedure.query(async () => {
      return await db.getUnreadWhatsAppConversationsCount();
    }),

    create: protectedProcedure
      .input(
        z.object({
          customerName: z.string(),
          customerPhone: z.string(),
          leadId: z.number().optional(),
          appointmentId: z.number().optional(),
          offerLeadId: z.number().optional(),
          campRegistrationId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createWhatsAppConversation({
          ...input,
          lastMessageAt: new Date(),
          unreadCount: 0,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          customerName: z.string().optional(),
          unreadCount: z.number().optional(),
          important: z.boolean().optional(),
          archived: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateWhatsAppConversation(id, data);
      }),
  }),

  // Messages
  messages: router({
    listByConversation: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getWhatsAppMessagesByConversation(input.conversationId);
      }),

    send: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          content: z.string(),
          messageType: z.enum(["text", "image", "document", "audio", "video"]).default("text"),
          mediaUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // TODO: Integrate with WhatsApp Business API to actually send the message
        // For now, just save to database
        const message = await db.createWhatsAppMessage({
          ...input,
          direction: "outgoing",
          status: "sent",
          sentBy: ctx.user.id,
        });

        // Update conversation lastMessageAt
        await db.updateWhatsAppConversation(input.conversationId, {
          lastMessageAt: new Date(),
        });

        return message;
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppMessage(input.messageId, {
          readAt: new Date(),
        });
      }),
  }),

  // Templates
  templates: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllWhatsAppTemplates();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getWhatsAppTemplateById(input.id);
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          content: z.string(),
          category: z.enum(["confirmation", "reminder", "followup", "thank_you", "custom"]),
          variables: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createWhatsAppTemplate({
          ...input,
          isActive: 1,
          createdBy: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          content: z.string().optional(),
          category: z.enum(["confirmation", "reminder", "followup", "thank_you", "custom"]).optional(),
          variables: z.array(z.string()).optional(),
          active: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateWhatsAppTemplate(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteWhatsAppTemplate(input.id);
      }),

    preview: protectedProcedure
      .input(
        z.object({
          templateId: z.number(),
          variables: z.record(z.string(), z.string()),
        })
      )
      .query(async ({ input }) => {
        const template = await db.getWhatsAppTemplateById(input.templateId);
        if (!template) throw new Error("Template not found");

        let content = template.content;
        for (const [key, value] of Object.entries(input.variables)) {
          content = content.replaceAll(`{${key}}`, String(value));
        }

        return { content };
      }),
  }),
});
