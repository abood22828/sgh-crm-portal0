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
      const { sendAppointmentConfirmation } = await import(
        "../services/whatsappAppointments"
      );
      return sendAppointmentConfirmation(input);
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
      const { sendAppointmentConfirmation, sendCampRegistrationConfirmation, sendOfferLeadConfirmation } =
        await import("../services/whatsappAppointments");
      const dbConn = await db.getDb();
      if (!dbConn) return { success: false, error: "لا يمكن الاتصال بقاعدة البيانات" };

      if (input.entityType === "appointment") {
        const { appointments } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const rows = await dbConn.select().from(appointments).where(eq(appointments.id, input.entityId)).limit(1);
        if (!rows.length) return { success: false, error: "الموعد غير موجود" };
        const appt = rows[0];
        return sendAppointmentConfirmation({
          appointmentId: appt.id,
          phone: appt.phone,
          patientName: appt.fullName,
          doctorName: "",
          appointmentTime: appt.appointmentDate instanceof Date ? appt.appointmentDate : new Date(appt.appointmentDate || appt.createdAt),
          department: appt.procedure || "",
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
        return sendCampRegistrationConfirmation({
          registrationId: reg.id,
          phone: reg.phone,
          patientName: reg.fullName,
          campName,
          campDate: reg.createdAt instanceof Date ? reg.createdAt : new Date(reg.createdAt),
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
        return sendOfferLeadConfirmation({
          offerLeadId: lead.id,
          phone: lead.phone,
          patientName: lead.fullName,
          offerName,
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
});
