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

// Phase 3: Advanced Features Procedures
export const whatsappPhase3Procedures = {
  // Templates
  sendTemplate: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        templateName: z.string().min(1),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { sendTemplateMessage } = await import("../services/whatsappTemplates");
      return sendTemplateMessage({
        phone: input.phone,
        templateName: input.templateName,
        language: input.language,
      });
    }),

  getTemplates: protectedProcedure.query(async () => {
    const { getAvailableTemplates } = await import("../services/whatsappTemplates");
    return getAvailableTemplates();
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

  // Broadcast
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

  // Auto Replies
  addAutoReplyRule: protectedProcedure
    .input(
      z.object({
        trigger: z.string().min(1),
        response: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { addAutoReplyRule } = await import("../services/whatsappAutoReply");
      return addAutoReplyRule({
        trigger: input.trigger,
        response: input.response,
      });
    }),

  deleteAutoReplyRule: protectedProcedure
    .input(z.object({ ruleId: z.string() }))
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
        ruleId: z.string(),
        enabled: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { toggleAutoReplyRule } = await import("../services/whatsappAutoReply");
      return toggleAutoReplyRule(input.ruleId, input.enabled);
    }),
};

// Phase 4: Appointments, Audit Log, Security & Compliance
export const whatsappPhase4Procedures = {
  // Appointments
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
      const { sendAppointmentConfirmation } = await import(
        "../services/whatsappAppointments"
      );
      return sendAppointmentConfirmation({
        appointmentId: input.appointmentId,
        phone: input.phone,
        patientName: input.patientName,
        doctorName: input.doctorName,
        appointmentTime: input.appointmentTime,
        department: input.department,
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
      return sendAppointmentReminder({
        appointmentId: input.appointmentId,
        phone: input.phone,
        patientName: input.patientName,
        doctorName: input.doctorName,
        appointmentTime: input.appointmentTime,
        hoursUntil: input.hoursUntil,
      });
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
      return sendAppointmentFollowup({
        appointmentId: input.appointmentId,
        phone: input.phone,
        patientName: input.patientName,
        doctorName: input.doctorName,
        department: input.department,
      });
    }),

  checkAndSendReminders: protectedProcedure.mutation(async () => {
    const { checkAndSendReminders } = await import("../services/whatsappAppointments");
    return checkAndSendReminders();
  }),

  // Audit Log
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
      return getAuditLogs({
        phone: input.phone,
        type: input.type,
        limit: input.limit,
      });
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
      return exportAuditLogs({
        phone: input.phone,
      });
    }),

  // Security & Compliance
  blockPhone: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        reason: z.enum(["opt_out", "spam", "manual", "invalid"]),
      })
    )
    .mutation(async ({ input }) => {
      const { blockPhone } = await import("../services/whatsappSecurity");
      return blockPhone({
        phone: input.phone,
        reason: input.reason,
      });
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
      return handleOptOutRequest({
        phone: input.phone,
        reason: input.reason,
      });
    }),

  getOptOutRequests: protectedProcedure.query(async () => {
    const { getOptOutRequests } = await import("../services/whatsappSecurity");
    return getOptOutRequests();
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
};
