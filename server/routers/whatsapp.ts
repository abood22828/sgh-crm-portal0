import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { meta } from "../MetaApiService";
import { z } from "zod";
import { 
  sendWhatsAppTextMessage, 
  getWhatsAppAPIStatus,
  formatPhoneNumber 
} from "../whatsappCloudAPI";
import {
  sendTextMessage,
  sendWelcomeMessage,
  sendBookingConfirmation,
  verifyWhatsAppHealth,
} from "../services/whatsappService";
import { normalizePhoneNumber } from "../db";
import { whatsappBot } from "../config/whatsapp";

export const whatsappRouter = router({
  // WhatsApp Cloud API Status
  connection: router({
    status: protectedProcedure.query(async () => {
      return getWhatsAppAPIStatus();
    }),
  }),

  // Conversations
  conversations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllWhatsAppConversations();
    }),

    getCustomerInfo: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        return await db.getCustomerInfoByPhone(input.phone);
      }),

    getCustomerRecords: protectedProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        return await db.getAllCustomerRecordsByPhone(input.phone);
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
          phoneNumber: input.customerPhone,
          customerName: input.customerName,
          lastMessageAt: new Date(),
          unreadCount: 0,
          isImportant: 0,
          isArchived: 0,
          leadId: input.leadId,
          appointmentId: input.appointmentId,
          offerLeadId: input.offerLeadId,
          campRegistrationId: input.campRegistrationId,
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

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppConversation(input.id, {
          unreadCount: 0,
        });
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
          message: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const conv = await db.getWhatsAppConversationById(input.conversationId);
          if (!conv) throw new Error("Conversation not found");

          const result = await sendWhatsAppTextMessage(
            conv.phoneNumber,
            input.message
          );

          if (result.success) {
            await db.createWhatsAppMessage({
              conversationId: input.conversationId,
              direction: "outbound",
              content: input.message,
              messageType: "text",
              status: "sent",
              sentBy: ctx.user.id,
              whatsappMessageId: result.messageId,
            });

            await db.updateWhatsAppConversation(input.conversationId, {
              lastMessage: input.message,
              lastMessageAt: new Date(),
            });
          }

          return result;
        } catch (error: any) {
          console.error("[WhatsApp] Failed to send message:", error);
          throw new Error(error.message || "Failed to send message");
        }
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
  }),
});

// Phase 2: New WhatsApp Service Methods - Added after templates router
export const whatsappPhase2Procedures = {
  sendSimpleText: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        message: z.string().min(1).max(4096),
        priority: z.enum(["high", "normal", "low"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return sendTextMessage(input.phone, input.message, {
        priority: input.priority,
      });
    }),

  sendWelcomeMsg: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        fullName: z.string().min(1),
        campaignName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return sendWelcomeMessage({
        phone: input.phone,
        fullName: input.fullName,
        campaignName: input.campaignName,
      });
    }),

  health: publicProcedure.query(async () => {
    return verifyWhatsAppHealth();
  }),

  testConnection: protectedProcedure
    .input(z.object({ phone: z.string().min(9).max(15) }))
    .mutation(async ({ input }) => {
      try {
        if (!whatsappBot) {
          return {
            success: false,
            error: "WhatsApp bot not initialized",
          };
        }

        const normalizedPhone = normalizePhoneNumber(input.phone);
        const testMessage = `اختبار الاتصال بـ WhatsApp ✅\nالوقت: ${new Date().toLocaleString("ar-YE")}`;

        await whatsappBot.sendText(normalizedPhone, testMessage);

        return {
          success: true,
          message: "تم إرسال رسالة الاختبار بنجاح",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  normalizePhone: publicProcedure
    .input(z.object({ phone: z.string() }))
    .query(({ input }) => {
      const normalized = normalizePhoneNumber(input.phone);
      return {
        original: input.phone,
        normalized,
        isValid: normalized.length >= 9 && normalized.length <= 15,
      };
    }),
};
