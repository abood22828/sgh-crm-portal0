import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { whatsappTemplates } from "../../drizzle/schema";
import * as whatsappTemplatesModule from "../services/whatsappTemplates";
import { normalizePhoneNumber } from "../db";

/**
 * WhatsApp Template Testing Router
 * لاختبار إرسال القوالب المعتمدة من Meta
 */

export const whatsappTemplateTestRouter = router({
  /**
   * اختبار إرسال قالب الترحيب المخصص بهوية المستشفى
   */
  sendWelcomeGreeting: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        fullName: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // تطبيع رقم الهاتف
        const normalizedPhone = normalizePhoneNumber(input.phone);

        // جلب قالب الترحيب المخصص
        const template = await db
          .select()
          .from(whatsappTemplates)
          .where(
            eq(whatsappTemplates.metaName, "sgh_welcome_greeting_ar")
          )
          .limit(1);

        if (!template || template.length === 0) {
          return {
            success: false,
            error: "قالب الترحيب غير موجود أو غير معتمد من Meta",
          };
        }

        const tmpl = template[0];

        if (tmpl.metaStatus !== "APPROVED") {
          return {
            success: false,
            error: `حالة القالب: ${tmpl.metaStatus}. يجب أن تكون APPROVED`,
          };
        }

        // إرسال الرسالة عبر القالب
        const result = await whatsappTemplatesModule.sendTemplateMessage({
          phone: normalizedPhone,
          templateName: tmpl.metaName || "sgh_welcome_greeting_ar",
          language: "ar",
          parameters: [
            {
              type: "text" as const,
              value: input.fullName,
            },
          ],
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error || "فشل إرسال الرسالة",
          };
        }

        return {
          success: true,
          message: "تم إرسال رسالة الترحيب بنجاح ✅",
          details: {
            phone: normalizedPhone,
            templateName: tmpl.metaName,
            status: tmpl.metaStatus,
            sentAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("[WhatsApp Template Test] Error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        };
      }
    }),

  /**
   * قائمة بجميع القوالب المتاحة والمعتمدة
   */
  listApprovedTemplates: protectedProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(whatsappTemplates)
        .where(eq(whatsappTemplates.metaStatus, "APPROVED"));

      return {
        success: true,
        count: templates.length,
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          metaName: t.metaName,
          category: t.category,
          languageCode: t.languageCode,
          metaStatus: t.metaStatus,
          metaCategory: t.metaCategory,
          variables: t.variables ? JSON.parse(t.variables) : [],
        })),
      };
    } catch (error) {
      console.error("[WhatsApp Template Test] Error listing templates:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير معروف",
      };
    }
  }),

  /**
   * اختبار إرسال أي قالب معتمد
   */
  sendTemplate: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(9).max(15),
        templateName: z.string(),
        parameters: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // تطبيع رقم الهاتف
        const normalizedPhone = normalizePhoneNumber(input.phone);

        // جلب القالب
        const template = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.metaName, input.templateName))
          .limit(1);

        if (!template || template.length === 0) {
          return {
            success: false,
            error: "القالب غير موجود",
          };
        }

        const tmpl = template[0];

        if (tmpl.metaStatus !== "APPROVED") {
          return {
            success: false,
            error: `حالة القالب: ${tmpl.metaStatus}. يجب أن تكون APPROVED`,
          };
        }

        // التحقق من عدد المتغيرات
        const variables = tmpl.variables ? JSON.parse(tmpl.variables) : [];
        const providedParams = input.parameters || [];

        if (providedParams.length !== variables.length) {
          return {
            success: false,
            error: `عدد المتغيرات غير صحيح. المتوقع: ${variables.length}, المقدم: ${providedParams.length}`,
            expectedVariables: variables,
          };
        }

        // إرسال الرسالة
        const result = await whatsappTemplatesModule.sendTemplateMessage({
          phone: normalizedPhone,
          templateName: tmpl.metaName || input.templateName,
          language: "ar",
          parameters: providedParams.map((value) => ({
            type: "text" as const,
            value,
          })),
        });

        if (!result.success) {
          return {
            success: false,
            error: result.error || "فشل إرسال الرسالة",
          };
        }

        return {
          success: true,
          message: "تم إرسال الرسالة بنجاح ✅",
          details: {
            phone: normalizedPhone,
            templateName: tmpl.metaName,
            status: tmpl.metaStatus,
            sentAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        console.error("[WhatsApp Template Test] Error sending template:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        };
      }
    }),

  /**
   * الحصول على تفاصيل قالب معين
   */
  getTemplateDetails: protectedProcedure
    .input(z.object({ templateName: z.string() }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const template = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.metaName, input.templateName))
          .limit(1);

        if (!template || template.length === 0) {
          return {
            success: false,
            error: "القالب غير موجود",
          };
        }

        const tmpl = template[0];

        return {
          success: true,
          template: {
            id: tmpl.id,
            name: tmpl.name,
            metaName: tmpl.metaName,
            category: tmpl.category,
            content: tmpl.content,
            variables: tmpl.variables ? JSON.parse(tmpl.variables) : [],
            languageCode: tmpl.languageCode,
            metaStatus: tmpl.metaStatus,
            metaCategory: tmpl.metaCategory,
            headerText: tmpl.headerText,
            footerText: tmpl.footerText,
            usageCount: tmpl.usageCount,
            createdAt: tmpl.createdAt,
          },
        };
      } catch (error) {
        console.error("[WhatsApp Template Test] Error getting template:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        };
      }
    }),
});
