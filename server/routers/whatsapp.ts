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
// whatsappBot removed — using sendWhatsAppTextMessage (Cloud API) directly

// Simple in-memory rate limiter for manual messages
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 messages per minute per user

function checkRateLimit(userId: number): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `user:${userId}`;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired one
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetTime: entry.resetTime };
}

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
        const { id, important, archived, ...rest } = input;
        const updateData: Record<string, any> = { ...rest };
        // تحويل important/archived إلى أسماء الحقول الصحيحة في DB
        if (important !== undefined) updateData.isImportant = important ? 1 : 0;
        if (archived !== undefined) updateData.isArchived = archived ? 1 : 0;
        return await db.updateWhatsAppConversation(id, updateData);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppConversation(input.id, {
          unreadCount: 0,
        });
      }),

    assignToUser: protectedProcedure
      .input(z.object({ id: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppConversation(input.id, {
          assignedToUserId: input.userId,
        });
      }),

    updateNotes: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppConversation(input.id, {
          notes: input.notes,
        });
      }),

    updateName: protectedProcedure
      .input(z.object({ id: z.number(), customerName: z.string() }))
      .mutation(async ({ input }) => {
        return await db.updateWhatsAppConversation(input.id, {
          customerName: input.customerName,
        });
      }),

    bulkArchive: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { whatsappConversations } = await import("../../drizzle/schema");
        const { eq, inArray } = await import("drizzle-orm");
        
        await dbConn
          .update(whatsappConversations)
          .set({ isArchived: 1, updatedAt: new Date() })
          .where(inArray(whatsappConversations.id, input.ids));
        
        return { success: true, count: input.ids.length };
      }),

    bulkMarkImportant: protectedProcedure
      .input(z.object({ ids: z.array(z.number()), important: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { whatsappConversations } = await import("../../drizzle/schema");
        const { inArray } = await import("drizzle-orm");
        
        await dbConn
          .update(whatsappConversations)
          .set({ isImportant: input.important, updatedAt: new Date() })
          .where(inArray(whatsappConversations.id, input.ids));
        
        return { success: true, count: input.ids.length };
      }),

    getStats: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { whatsappMessages } = await import("../../drizzle/schema");
        const { eq, count, sql } = await import("drizzle-orm");
        
        const messages = await dbConn
          .select()
          .from(whatsappMessages)
          .where(eq(whatsappMessages.conversationId, input.conversationId));
        
        const totalMessages = messages.length;
        const inboundMessages = messages.filter(m => m.direction === "inbound").length;
        const outboundMessages = messages.filter(m => m.direction === "outbound").length;
        const templateMessages = messages.filter(m => m.messageType === "template").length;
        
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        
        // Calculate average response time (simplified)
        let avgResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < messages.length; i++) {
          if (messages[i].direction === "outbound" && messages[i-1].direction === "inbound") {
            const prevTime = new Date(messages[i-1].createdAt || messages[i-1].sentAt).getTime();
            const currTime = new Date(messages[i].createdAt || messages[i].sentAt).getTime();
            avgResponseTime += (currTime - prevTime);
            responseCount++;
          }
        }
        avgResponseTime = responseCount > 0 ? avgResponseTime / responseCount : 0;
        
        return {
          totalMessages,
          inboundMessages,
          outboundMessages,
          templateMessages,
          firstMessageAt: firstMessage?.createdAt || firstMessage?.sentAt,
          lastMessageAt: lastMessage?.createdAt || lastMessage?.sentAt,
          avgResponseTimeMs: avgResponseTime,
          avgResponseTimeMinutes: Math.round(avgResponseTime / (1000 * 60)),
        };
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
          replyToMessageId: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // Rate limiting check
          const rateLimit = checkRateLimit(ctx.user.id);
          if (!rateLimit.allowed) {
            const resetInSeconds = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
            throw new Error(`Rate limit exceeded. Please wait ${resetInSeconds} seconds before sending more messages.`);
          }

          const conv = await db.getWhatsAppConversationById(input.conversationId);
          if (!conv) throw new Error("Conversation not found");

          // Server-side 24-hour window validation
          const lastMessageTime = conv.lastMessageAt ? new Date(conv.lastMessageAt) : null;
          const now = new Date();
          const hoursSinceLastMessage = lastMessageTime 
            ? (now.getTime() - lastMessageTime.getTime()) / (1000 * 60 * 60)
            : Infinity;

          if (hoursSinceLastMessage > 24) {
            console.warn(`[WhatsApp] 24-hour window exceeded for conversation ${input.conversationId}. Last message was ${hoursSinceLastMessage.toFixed(1)} hours ago.`);
            // Note: We still allow sending but log a warning. For strict enforcement, uncomment below:
            // throw new Error("Cannot send free-form text message: 24-hour messaging window exceeded. Use a template message instead.");
          }

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
              replyToMessageId: input.replyToMessageId,
            });

            await db.updateWhatsAppConversation(input.conversationId, {
              lastMessage: input.message,
              lastMessageAt: new Date(),
            });
          }

          return { ...result, rateLimit };
        } catch (error: any) {
          console.error("[WhatsApp] Failed to send message:", error);
          throw new Error(error.message || "Failed to send message");
        }
      }),

    delete: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { whatsappMessages } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbConn.delete(whatsappMessages).where(eq(whatsappMessages.id, input.messageId));
        
        return { success: true };
      }),

    forward: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        targetConversationId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        
        const { whatsappMessages, whatsappConversations } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        // Get original message
        const originalMessages = await dbConn
          .select()
          .from(whatsappMessages)
          .where(eq(whatsappMessages.id, input.messageId))
          .limit(1);
        
        if (!originalMessages.length) throw new Error("Original message not found");
        const original = originalMessages[0];
        
        // Get target conversation
        const targetConvs = await dbConn
          .select()
          .from(whatsappConversations)
          .where(eq(whatsappConversations.id, input.targetConversationId))
          .limit(1);
        
        if (!targetConvs.length) throw new Error("Target conversation not found");
        const targetConv = targetConvs[0];
        
        // Send the message to target conversation
        const result = await sendWhatsAppTextMessage(targetConv.phoneNumber, original.content);
        
        if (result.success) {
          await db.createWhatsAppMessage({
            conversationId: input.targetConversationId,
            direction: "outbound",
            content: original.content,
            messageType: original.messageType,
            status: "sent",
            sentBy: ctx.user.id,
            whatsappMessageId: result.messageId,
          });
          
          await db.updateWhatsAppConversation(input.targetConversationId, {
            lastMessage: original.content,
            lastMessageAt: new Date(),
          });
        }
        
        return result;
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

    syncFromMeta: protectedProcedure.mutation(async () => {
      const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
      const hasToken = !!process.env.META_ACCESS_TOKEN;
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      console.log(`[syncFromMeta] WABA_ID=${wabaId}, PHONE_ID=${phoneId}, HAS_TOKEN=${hasToken}`);

      if (!wabaId) {
        return {
          success: false,
          error: "WHATSAPP_BUSINESS_ACCOUNT_ID غير مُعيَّن في متغيرات البيئة",
          synced: 0,
          updated: 0,
        };
      }
      if (!hasToken) {
        return {
          success: false,
          error: "META_ACCESS_TOKEN غير مُعيَّن في متغيرات البيئة",
          synced: 0,
          updated: 0,
        };
      }

      const { syncTemplatesFromMeta } = await import("../services/whatsappTemplates");
      const result = await syncTemplatesFromMeta();
      console.log(`[syncFromMeta] Result:`, JSON.stringify(result));
      return result;
    }),

    syncStatus: protectedProcedure.mutation(async () => {
      const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const hasToken = !!process.env.META_ACCESS_TOKEN;

      if (!phoneId) {
        return {
          success: false,
          error: "WHATSAPP_PHONE_NUMBER_ID غير مُعيَّن في متغيرات البيئة",
        };
      }
      if (!hasToken) {
        return {
          success: false,
          error: "META_ACCESS_TOKEN غير مُعيَّن في متغيرات البيئة",
        };
      }

      const { syncAllTemplates } = await import("../services/templateSyncService");
      const result = await syncAllTemplates(phoneId);
      console.log(`[syncStatus] Result:`, JSON.stringify(result));
      return result;
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          content: z.string().min(1),
          category: z.string(),
          language: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { createTemplate } = await import("../services/whatsappTemplates");
        return createTemplate(input);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          content: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateTemplate } = await import("../services/whatsappTemplates");
        return updateTemplate(input.id, input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteTemplate } = await import("../services/whatsappTemplates");
        return deleteTemplate(input.id);
      }),
  }),

  // Phase 2 Procedures
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
        const normalizedPhone = normalizePhoneNumber(input.phone);
        const testMessage = `اختبار الاتصال بـ WhatsApp ✅\nالوقت: ${new Date().toLocaleString("ar-YE")}`;

        const result = await sendWhatsAppTextMessage(normalizedPhone, testMessage);

        return {
          success: result.success,
          message: result.success ? "تم إرسال رسالة الاختبار بنجاح" : undefined,
          error: result.error,
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

  // Phase 3 Procedures
  sendTemplate: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        templateName: z.string().min(1),
        language: z.string().optional(),
        conversationId: z.number().optional(), // لحفظ الرسالة في المحادثة
        templateContent: z.string().optional(), // محتوى القالب للحفظ
      })
    )
    .mutation(async ({ input }) => {
      const { sendTemplateMessage } = await import("../services/whatsappTemplates");
      const result = await sendTemplateMessage({
        phone: input.phone,
        templateName: input.templateName,
        language: input.language,
      });

      // حفظ الرسالة في المحادثة إذا نجح الإرسال
      if (result.success && input.conversationId) {
        try {
          const { createWhatsAppMessage, updateWhatsAppConversation } = await import("../db");
          const content = input.templateContent || `[قالب: ${input.templateName}]`;
          await createWhatsAppMessage({
            conversationId: input.conversationId,
            direction: "outbound",
            content,
            messageType: "template",
            status: "sent",
            whatsappMessageId: result.messageId || null,
            sentAt: new Date(),
          });
          await updateWhatsAppConversation(input.conversationId, {
            lastMessage: content.substring(0, 200),
            lastMessageAt: new Date(),
          });
        } catch (err) {
          console.error("[WhatsApp] Failed to save template message to conversation:", err);
        }
      }

      return result;
    }),

  getTemplates: protectedProcedure.query(async () => {
    // جلب القوالب من قاعدة البيانات المحلية (بعد المزامنة مع Meta)
    const { whatsappTemplates } = await import("../../drizzle/schema");
    const dbConn = await import("../db").then(m => m.getDb());
    if (!dbConn) return { success: true, templates: [] };
    const templates = await dbConn.select().from(whatsappTemplates).orderBy(whatsappTemplates.name);
    return { success: true, templates };
  }),

  getTemplateStatus: protectedProcedure
    .input(z.object({ templateName: z.string() }))
    .query(async ({ input }) => {
      const { getTemplateStatus } = await import("../services/whatsappTemplates");
      return getTemplateStatus(input.templateName);
    }),

  sendMedia: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        mediaType: z.enum(["image", "video", "document", "audio"]),
        mediaUrl: z.string().url(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendMediaMessage } = await import("../services/whatsappTemplates");
      return sendMediaMessage({
        phone: input.phone,
        mediaType: input.mediaType,
        mediaUrl: input.mediaUrl,
        caption: input.caption,
      });
    }),

  sendBroadcast: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4096),
        recipients: z.array(z.string().min(9).max(15)),
        priority: z.enum(["high", "normal", "low"]).optional(),
        delay: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendBroadcast } = await import("../services/whatsappBroadcast");
      return sendBroadcast({
        message: input.message,
        recipients: input.recipients,
        priority: input.priority,
        delay: input.delay,
      });
    }),

  getBroadcastStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const { getBroadcastStatus } = await import("../services/whatsappBroadcast");
      return getBroadcastStatus(input.jobId);
    }),

  getBroadcastStats: protectedProcedure.query(async () => {
    const { getBroadcastStats } = await import("../services/whatsappBroadcast");
    return getBroadcastStats();
  }),

  scheduleBroadcast: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4096),
        recipients: z.array(z.string().min(9).max(15)),
        scheduledAt: z.date(),
        priority: z.enum(["high", "normal", "low"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { scheduleBroadcast } = await import("../services/whatsappBroadcast");
      return scheduleBroadcast({
        message: input.message,
        recipients: input.recipients,
        scheduledAt: input.scheduledAt,
        priority: input.priority,
      });
    }),

  addAutoReplyRule: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        triggerType: z.enum(["keyword", "outside_hours", "first_message", "faq"]),
        triggerValue: z.string().optional(),
        replyMessage: z.string().min(1),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { addAutoReplyRule } = await import("../services/whatsappAutoReply");
      return addAutoReplyRule({
        name: input.name,
        triggerType: input.triggerType,
        triggerValue: input.triggerValue,
        replyMessage: input.replyMessage,
        priority: input.priority,
        createdBy: ctx.user.id,
      });
    }),

  deleteAutoReplyRule: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ input }) => {
      const { deleteAutoReplyRule } = await import("../services/whatsappAutoReply");
      return deleteAutoReplyRule(input.ruleId);
    }),

  getAutoReplyRules: protectedProcedure.query(async () => {
    const { getAutoReplyRules } = await import("../services/whatsappAutoReply");
    return getAutoReplyRules();
  }),

  toggleAutoReplyRule: protectedProcedure
    .input(
      z.object({
        ruleId: z.number(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { toggleAutoReplyRule } = await import("../services/whatsappAutoReply");
      return toggleAutoReplyRule(input.ruleId, input.enabled);
    }),

  // Phase 4 Procedures
  sendAppointmentConfirmation: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        phone: z.string().min(9).max(15),
        patientName: z.string(),
        doctorName: z.string(),
        appointmentTime: z.date(),
        department: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { dispatchWhatsAppMessage } = await import(
        "../services/whatsappMessageDispatcher"
      );
      // استخدام dispatchWhatsAppMessage مع triggerEvent on_create
      return dispatchWhatsAppMessage({
        phone: input.phone,
        entityType: "appointment",
        entityId: input.appointmentId,
        triggerEvent: "on_create",
        recipientName: input.patientName,
        variables: {
          name: input.patientName,
          doctor: input.doctorName,
          date: input.appointmentTime.toLocaleDateString("ar-SA"),
          time: input.appointmentTime.toLocaleTimeString("ar-SA"),
          service: input.department,
        },
      });
    }),

  sendAppointmentReminder: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        phone: z.string().min(9).max(15),
        patientName: z.string(),
        doctorName: z.string(),
        appointmentTime: z.date(),
        hoursUntil: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendAppointmentReminder } = await import(
        "../services/whatsappAppointments"
      );
      return sendAppointmentReminder(input);
    }),

  sendAppointmentFollowup: protectedProcedure
    .input(
      z.object({
        appointmentId: z.number(),
        phone: z.string().min(9).max(15),
        patientName: z.string(),
        doctorName: z.string(),
        department: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendAppointmentFollowup } = await import(
        "../services/whatsappAppointments"
      );
      return sendAppointmentFollowup(input);
    }),

  checkAndSendReminders: protectedProcedure.mutation(async () => {
    const { checkAndSendReminders } = await import("../services/whatsappAppointments");
    return checkAndSendReminders();
  }),

  getAuditLogs: protectedProcedure
    .input(
      z.object({
        phone: z.string().optional(),
        type: z.string().optional(),
        limit: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const { getAuditLogs } = await import("../services/whatsappAuditLog");
      return getAuditLogs(input);
    }),

  getAuditStats: protectedProcedure.query(async () => {
    const { getAuditStats } = await import("../services/whatsappAuditLog");
    return getAuditStats();
  }),

  exportAuditLogs: protectedProcedure
    .input(
      z.object({
        phone: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { exportAuditLogs } = await import("../services/whatsappAuditLog");
      return exportAuditLogs(input);
    }),

  blockPhone: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        reason: z.enum(["opt_out", "spam", "manual", "invalid"]),
      })
    )
    .mutation(async ({ input }) => {
      const { blockPhone } = await import("../services/whatsappSecurity");
      return blockPhone(input);
    }),

  unblockPhone: protectedProcedure
    .input(z.object({ phone: z.string().min(9).max(15) }))
    .mutation(async ({ input }) => {
      const { unblockPhone } = await import("../services/whatsappSecurity");
      return unblockPhone(input.phone);
    }),

  getBlockedPhones: protectedProcedure.query(async () => {
    const { getBlockedPhones } = await import("../services/whatsappSecurity");
    return getBlockedPhones();
  }),

  handleOptOutRequest: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { handleOptOutRequest } = await import("../services/whatsappSecurity");
      return handleOptOutRequest(input);
    }),

  getOptOutRequests: protectedProcedure.query(async () => {
    const { getBlockedPhones } = await import("../services/whatsappSecurity");
    return getBlockedPhones();
  }),

  validateMetaCompliance: protectedProcedure
    .input(z.object({ message: z.string() }))
    .query(async ({ input }) => {
      const { validateMetaCompliance } = await import("../services/whatsappSecurity");
      return validateMetaCompliance(input.message);
    }),

  getSecurityStats: protectedProcedure.query(async () => {
    const { getSecurityStats } = await import("../services/whatsappSecurity");
    return getSecurityStats();
  }),

  // Phase 5 Procedures
  initializeScheduler: protectedProcedure.mutation(async () => {
    const { initializeScheduler } = await import("../services/whatsappScheduler");
    return initializeScheduler();
  }),

  getScheduledTasks: protectedProcedure.query(async () => {
    const { getScheduledTasks } = await import("../services/whatsappScheduler");
    return getScheduledTasks();
  }),

  stopTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      const { stopTask } = await import("../services/whatsappScheduler");
      return stopTask(input.taskId);
    }),

  resumeTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ input }) => {
      const { resumeTask } = await import("../services/whatsappScheduler");
      return resumeTask(input.taskId);
    }),

  shutdownScheduler: protectedProcedure.mutation(async () => {
    const { shutdownScheduler } = await import("../services/whatsappScheduler");
    return shutdownScheduler();
  }),

  // جلب سجلات إشعارات WhatsApp من قاعدة البيانات
  getNotificationLogs: protectedProcedure
    .input(z.object({
      entityType: z.enum(["appointment", "camp_registration", "offer_lead"]).optional(),
      status: z.enum(["pending", "sent", "delivered", "read", "failed"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const { getNotificationLogs } = await import("../services/whatsappAppointments");
      return getNotificationLogs(input);
    }),

  getNotificationStats: protectedProcedure.query(async () => {
    const { getNotificationStats } = await import("../services/whatsappAppointments");
    return getNotificationStats();
  }),

  // إعادة إرسال إشعار WhatsApp لكيان محدد
  resendNotification: protectedProcedure
    .input(z.object({
      entityType: z.enum(["appointment", "camp_registration", "offer_lead"]),
      entityId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { dispatchWhatsAppMessage } = await import(
        "../services/whatsappMessageDispatcher"
      );
      const dbConn = await db.getDb();
      if (!dbConn) return { success: false, error: "لا يمكن الاتصال بقاعدة البيانات" };

      if (input.entityType === "appointment") {
        const { appointments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await dbConn.select().from(appointments).where(eq(appointments.id, input.entityId)).limit(1);
        if (!rows.length) return { success: false, error: "الموعد غير موجود" };
        const appt = rows[0];
        return dispatchWhatsAppMessage({
          phone: appt.phone,
          entityType: "appointment",
          entityId: appt.id,
          triggerEvent: "on_create",
          recipientName: appt.fullName,
          variables: {
            name: appt.fullName,
            date: appt.appointmentDate instanceof Date ? appt.appointmentDate.toLocaleDateString("ar-SA") : new Date(appt.appointmentDate || appt.createdAt).toLocaleDateString("ar-SA"),
            time: appt.appointmentDate instanceof Date ? appt.appointmentDate.toLocaleTimeString("ar-SA") : new Date(appt.appointmentDate || appt.createdAt).toLocaleTimeString("ar-SA"),
            service: appt.procedure || "",
          },
        });
      }

      if (input.entityType === "camp_registration") {
        const { campRegistrations, camps } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await dbConn.select().from(campRegistrations).where(eq(campRegistrations.id, input.entityId)).limit(1);
        if (!rows.length) return { success: false, error: "التسجيل غير موجود" };
        const reg = rows[0];
        let campName = "";
        if (reg.campId) {
          const campRows = await dbConn.select().from(camps).where(eq(camps.id, reg.campId)).limit(1);
          campName = campRows[0]?.name || "";
        }
        return dispatchWhatsAppMessage({
          phone: reg.phone,
          entityType: "camp_registration",
          entityId: reg.id,
          triggerEvent: "on_create",
          recipientName: reg.fullName,
          variables: {
            name: reg.fullName,
            camp_name: campName,
            date: reg.createdAt instanceof Date ? reg.createdAt.toLocaleDateString("ar-SA") : new Date(reg.createdAt).toLocaleDateString("ar-SA"),
          },
        });
      }

      if (input.entityType === "offer_lead") {
        const { offerLeads, offers } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await dbConn.select().from(offerLeads).where(eq(offerLeads.id, input.entityId)).limit(1);
        if (!rows.length) return { success: false, error: "حجز العرض غير موجود" };
        const lead = rows[0];
        let offerName = "";
        if (lead.offerId) {
          const offerRows = await dbConn.select().from(offers).where(eq(offers.id, lead.offerId)).limit(1);
          offerName = offerRows[0]?.title || "";
        }
        return dispatchWhatsAppMessage({
          phone: lead.phone,
          entityType: "offer_lead",
          entityId: lead.id,
          triggerEvent: "on_create",
          recipientName: lead.fullName,
          variables: {
            name: lead.fullName,
            offer_name: offerName,
          },
        });
      }

      return { success: false, error: "نوع غير معروف" };
    }),

  // جلب حالة إشعار WhatsApp لكيان محدد
  getEntityWhatsAppStatus: protectedProcedure
    .input(z.object({
      entityType: z.enum(["appointment", "camp_registration", "offer_lead"]),
      entityId: z.number(),
    }))
    .query(async ({ input }) => {
      const { getEntityNotifications } = await import("../services/whatsappAppointments");
      const result = await getEntityNotifications({ entityType: input.entityType, entityId: input.entityId });
      const notifications = result.notifications || [];
      const latest = notifications[notifications.length - 1] || null;
      return {
        hasSent: notifications.length > 0,
        status: latest?.status || null,
        sentAt: latest?.sentAt || null,
        messageId: latest?.messageId || null,
        count: notifications.length,
      };
    }),

  // ── تشغيل مهام التذكير يدوياً (للاختبار أو التشغيل الفوري) ─────────────────
  runReminderJobs: protectedProcedure
    .mutation(async () => {
      const { runAppointmentReminderJobs } = await import("../cron/appointmentReminders");
      const result = await runAppointmentReminderJobs();
      return result;
    }),

  // Quick Replies
  quickReplies: router({
    list: protectedProcedure.query(async () => {
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const { quickReplies } = await import("../../drizzle/schema");
      return await dbConn.select().from(quickReplies).orderBy(quickReplies.name);
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        content: z.string().min(1),
        category: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        const { quickReplies } = await import("../../drizzle/schema");
        const insertId = await dbConn.insert(quickReplies).values({
          name: input.name,
          content: input.content,
          category: input.category,
          createdBy: ctx.user.id,
        }).$returningId();
        return { id: insertId, ...input };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        content: z.string().optional(),
        category: z.string().optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        const { quickReplies } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { id, ...updateData } = input;
        await dbConn
          .update(quickReplies)
          .set(updateData)
          .where(eq(quickReplies.id, id));
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        const { quickReplies } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbConn.delete(quickReplies).where(eq(quickReplies.id, input.id));
        return { success: true };
      }),
  }),

  // Saved Searches
  savedSearches: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return [];
      const { savedSearches } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return await dbConn.select().from(savedSearches).where(eq(savedSearches.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        searchQuery: z.string().optional(),
        filterType: z.string().optional(),
        dateRange: z.string().optional(),
        messageType: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        const { savedSearches } = await import("../../drizzle/schema");
        const insertId = await dbConn.insert(savedSearches).values({
          userId: ctx.user.id,
          name: input.name,
          searchQuery: input.searchQuery,
          filterType: input.filterType,
          dateRange: input.dateRange,
          messageType: input.messageType,
        }).$returningId();
        return { id: insertId, ...input };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const dbConn = await db.getDb();
        if (!dbConn) throw new Error("Database not available");
        const { savedSearches } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await dbConn.delete(savedSearches).where(eq(savedSearches.id, input.id));
        return { success: true };
      }),
  }),
});
