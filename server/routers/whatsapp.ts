import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { 
  sendWhatsAppTextMessage, 
  sendWhatsAppTemplateMessage, 
  getWhatsAppAPIStatus,
  formatPhoneNumber 
} from "../whatsappCloudAPI";

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
        // Get conversation details
        const conversation = await db.getWhatsAppConversationById(input.conversationId);
        if (!conversation) {
          throw new Error("المحادثة غير موجودة");
        }

        // Send via WhatsApp Cloud API
        let whatsappMessageId: string | undefined;
        let sendStatus: "sent" | "failed" = "sent";
        let errorMsg: string | undefined;

        try {
          const result = await sendWhatsAppTextMessage(
            conversation.phoneNumber,
            input.content
          );
          
          if (result.success) {
            whatsappMessageId = result.messageId;
          } else {
            sendStatus = "failed";
            errorMsg = result.error;
            console.error("[WhatsApp] Failed to send:", result.error);
          }
        } catch (error: any) {
          sendStatus = "failed";
          errorMsg = error.message;
          console.error("[WhatsApp] Exception sending message:", error);
        }

        // Save to database
        const message = await db.createWhatsAppMessage({
          conversationId: input.conversationId,
          direction: "outbound",
          content: input.content,
          messageType: input.messageType,
          status: sendStatus,
          whatsappMessageId: whatsappMessageId || null,
          sentBy: ctx.user.id,
          sentAt: new Date(),
        });

        // Update conversation lastMessageAt
        await db.updateWhatsAppConversation(input.conversationId, {
          lastMessage: input.content.substring(0, 100),
          lastMessageAt: new Date(),
        });

        if (sendStatus === "failed") {
          throw new Error(errorMsg || "فشل إرسال الرسالة عبر واتساب");
        }

        return message;
      }),

    // Send a new message to a phone number (creates conversation if needed)
    sendDirect: protectedProcedure
      .input(
        z.object({
          phone: z.string(),
          content: z.string(),
          customerName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const formattedPhone = formatPhoneNumber(input.phone);
        
        // Find or create conversation
        let conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
        
        if (!conversation) {
          await db.createWhatsAppConversation({
            phoneNumber: formattedPhone,
            customerName: input.customerName || null,
            lastMessageAt: new Date(),
            unreadCount: 0,
            isImportant: 0,
            isArchived: 0,
          });
          conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
          if (!conversation) {
            throw new Error("فشل إنشاء المحادثة");
          }
        }

        // Send via WhatsApp Cloud API
        const result = await sendWhatsAppTextMessage(formattedPhone, input.content);
        
        if (!result.success) {
          throw new Error(result.error || "فشل إرسال الرسالة");
        }

        // Save to database
        const message = await db.createWhatsAppMessage({
          conversationId: conversation.id,
          direction: "outbound",
          content: input.content,
          messageType: "text",
          status: "sent",
          whatsappMessageId: result.messageId || null,
          sentBy: ctx.user.id,
          sentAt: new Date(),
        });

        // Update conversation
        await db.updateWhatsAppConversation(conversation.id, {
          lastMessage: input.content.substring(0, 100),
          lastMessageAt: new Date(),
          customerName: input.customerName || conversation.customerName,
        });

        return { 
          success: true, 
          messageId: result.messageId,
          conversationId: conversation.id 
        };
      }),

    // Send template message
    sendTemplate: protectedProcedure
      .input(
        z.object({
          phone: z.string(),
          templateName: z.string(),
          languageCode: z.string().default("ar"),
          components: z.array(z.any()).optional(),
          customerName: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const formattedPhone = formatPhoneNumber(input.phone);
        
        const result = await sendWhatsAppTemplateMessage(
          formattedPhone,
          {
            templateName: input.templateName,
            languageCode: input.languageCode,
            components: input.components || [],
          }
        );

        if (!result.success) {
          throw new Error(result.error || "فشل إرسال قالب الرسالة");
        }

        // Find or create conversation and save message
        let conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
        if (!conversation) {
          await db.createWhatsAppConversation({
            phoneNumber: formattedPhone,
            customerName: input.customerName || null,
            lastMessageAt: new Date(),
            unreadCount: 0,
            isImportant: 0,
            isArchived: 0,
          });
          conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
        }

        if (conversation) {
          await db.createWhatsAppMessage({
            conversationId: conversation.id,
            direction: "outbound",
            content: `[قالب: ${input.templateName}]`,
            messageType: "text",
            status: "sent",
            whatsappMessageId: result.messageId || null,
            sentBy: ctx.user.id,
            isAutomated: 1,
            sentAt: new Date(),
          });

          await db.updateWhatsAppConversation(conversation.id, {
            lastMessage: `[قالب: ${input.templateName}]`,
            lastMessageAt: new Date(),
          });
        }

        return { success: true, messageId: result.messageId };
      }),

    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppMessage(input.messageId, {
          readAt: new Date(),
        });
      }),
  }),

  // Templates (local templates in database)
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
        if (!template) throw new Error("القالب غير موجود");

        let content = template.content;
        for (const [key, value] of Object.entries(input.variables)) {
          content = content.replaceAll(`{${key}}`, String(value));
        }

        return { content };
      }),
  }),

  // Quick test endpoint
  testSend: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const formattedPhone = formatPhoneNumber(input.phone);
      
      if (input.message) {
        return await sendWhatsAppTextMessage(formattedPhone, input.message);
      } else {
        return await sendWhatsAppTemplateMessage(formattedPhone, {
          templateName: "hello_world",
          languageCode: "en_US",
          components: [],
        });
      }
    }),
});
