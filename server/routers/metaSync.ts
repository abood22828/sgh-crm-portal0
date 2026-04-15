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
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    const accessToken = ENV.metaAccessToken;

    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        message: "بيانات اعتماد Meta غير مكتملة",
      };
    }

    return await fetchTemplatesFromMeta(phoneNumberId, accessToken);
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
