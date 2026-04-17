import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  fetchTemplatesFromMeta,
  pushTemplateToMeta,
  checkTemplateStatus,
  deleteTemplateFromMeta,
  syncTemplatesCompletely,
} from "../services/metaTemplateSync";
import { ENV } from "../_core/env";

export const metaSyncRouter = router({
  /**
   * جلب جميع القوالب من Meta
   */
  fetchTemplates: protectedProcedure.mutation(async () => {
    const phoneNumberId = ENV.whatsappPhoneNumberId;
    const wabaId = ENV.whatsappBusinessAccountId;
    const accessToken = ENV.metaAccessToken;

    // تشخيص شامل لمتغيرات البيئة
    const diagnostics = {
      hasPhoneNumberId: !!phoneNumberId,
      hasWabaId: !!wabaId,
      hasAccessToken: !!accessToken,
      phoneNumberIdLength: phoneNumberId?.length || 0,
      wabaIdLength: wabaId?.length || 0,
      accessTokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'MISSING',
    };

    if (!accessToken) {
      return {
        success: false,
        message: "توكن Meta غير موجود. تأكد من إضافة META_ACCESS_TOKEN إلى متغيرات البيئة",
        diagnostics,
      };
    }

    if (!phoneNumberId && !wabaId) {
      return {
        success: false,
        message: "يجب توفير WHATSAPP_PHONE_NUMBER_ID أو WHATSAPP_BUSINESS_ACCOUNT_ID",
        diagnostics,
      };
    }

    const result = await fetchTemplatesFromMeta(phoneNumberId || wabaId, accessToken);
    return { ...result, diagnostics };
  }),

  /**
   * دفع قالب جديد إلى Meta
   */
  pushTemplate: protectedProcedure
    .input(
      z.object({
        templateName: z.string().min(1),
        content: z.string().min(1),
        category: z
          .enum(["MARKETING", "UTILITY", "AUTHENTICATION"])
          .default("MARKETING"),
        language: z.string().default("ar"),
      })
    )
    .mutation(async ({ input }) => {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
      const accessToken = ENV.metaAccessToken;

      if (!phoneNumberId || !accessToken) {
        return {
          success: false,
          message: "بيانات اعتماد Meta غير مكتملة",
        };
      }

      return await pushTemplateToMeta(
        phoneNumberId,
        accessToken,
        input.templateName,
        input.content,
        input.category,
        input.language
      );
    }),

  /**
   * التحقق من حالة قالب معين
   */
  checkStatus: protectedProcedure
    .input(
      z.object({
        templateId: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
      const accessToken = ENV.metaAccessToken;

      if (!phoneNumberId || !accessToken) {
        return {
          success: false,
          message: "بيانات اعتماد Meta غير مكتملة",
        };
      }

      return await checkTemplateStatus(
        phoneNumberId,
        accessToken,
        input.templateId
      );
    }),

  /**
   * حذف قالب من Meta
   */
  deleteTemplate: protectedProcedure
    .input(
      z.object({
        templateName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
      const accessToken = ENV.metaAccessToken;

      if (!phoneNumberId || !accessToken) {
        return {
          success: false,
          message: "بيانات اعتماد Meta غير مكتملة",
        };
      }

      return await deleteTemplateFromMeta(
        phoneNumberId,
        accessToken,
        input.templateName
      );
    }),

  /**
   * مزامنة شاملة للقوالب
   */
  syncAll: protectedProcedure.mutation(async () => {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const accessToken = ENV.metaAccessToken;

    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        message: "بيانات اعتماد Meta غير مكتملة",
      };
    }

    return await syncTemplatesCompletely(phoneNumberId, accessToken);
  }),
});
