/**
 * metaTemplateSync.ts — مزامنة قوالب WhatsApp مع Meta
 *
 * ✅ يستخدم MetaApiService المركزي (graph.facebook.com v23.0)
 * ✅ لا يستخدم graph.instagram.com أو توكن منفصل
 * ✅ يدعم WABA ID الصحيح لإدارة القوالب
 *
 * وفق وثائق Meta الرسمية:
 * https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview
 */

import { eq } from "drizzle-orm";
import { whatsappTemplates } from "../../drizzle/schema";
import { getDb } from "../db";
import { meta } from "../MetaApiService";

interface MetaTemplate {
  id?: string;
  name: string;
  status: string;
  category: string;
  language: string;
  quality_score?: { score: string };
  components?: Array<{
    type: string;
    format?: string;
    text?: string;
    buttons?: Array<{ type: string; text: string; url?: string }>;
    example?: any;
  }>;
}

interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  failed?: number;
  errors?: string[];
}

/**
 * الحصول على WABA ID من Phone Number ID
 * وفق: GET /{phone-number-id}?fields=whatsapp_business_account
 */
async function getWabaId(phoneNumberId: string): Promise<string | null> {
  const result = await meta.getWabaIdFromPhoneNumberId(phoneNumberId);
  if (!result.success || !result.wabaId) {
    // fallback: استخدام WHATSAPP_BUSINESS_ACCOUNT_ID من env
    return process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null;
  }
  return result.wabaId;
}

/**
 * جلب جميع القوالب من Meta ومزامنتها مع قاعدة البيانات
 * وفق: GET /{whatsapp-business-account-id}/message_templates
 */
export async function fetchTemplatesFromMeta(
  phoneNumberId: string,
  _accessToken?: string // محتفظ به للتوافق — يُستخدم MetaApiService بدلاً منه
): Promise<SyncResult> {
  try {
    const wabaId = await getWabaId(phoneNumberId);
    if (!wabaId) {
      return {
        success: false,
        message: "لم يتم العثور على WABA ID. تأكد من تعيين WHATSAPP_BUSINESS_ACCOUNT_ID",
      };
    }

    // جلب القوالب من Meta عبر MetaApiService
    const result = await meta.getWhatsAppTemplates(wabaId, 250);
    if (!result.success) {
      return {
        success: false,
        message: `فشل جلب القوالب من Meta: ${result.error}`,
      };
    }

    const templates: MetaTemplate[] = result.templates || [];
    console.log(`[MetaTemplateSync] Fetched ${templates.length} templates from Meta (WABA: ${wabaId})`);

    const db = await getDb();
    if (!db) {
      return { success: false, message: "لا يمكن الاتصال بقاعدة البيانات" };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const template of templates) {
      try {
        let content = "";
        let variables: string[] = [];

        // استخراج محتوى الجسم والمتغيرات
        if (template.components) {
          for (const component of template.components) {
            if (component.type === "BODY" && component.text) {
              content = component.text;
              // دعم المتغيرات الموضعية {{1}} والمسماة {{name}}
              const positional = component.text.match(/\{\{(\d+)\}\}/g) || [];
              const named = component.text.match(/\{\{([a-z_]+)\}\}/g) || [];
              variables = [...positional, ...named].map((m) => m.replace(/[{}]/g, ""));
            }
          }
        }

        const existing = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.metaName, template.name))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(whatsappTemplates)
            .set({
              metaStatus: template.status,
              metaCategory: template.category,
              content: content || existing[0].content,
              variables: JSON.stringify(variables),
              languageCode: template.language,
              updatedAt: new Date(),
            })
            .where(eq(whatsappTemplates.metaName, template.name));
        } else {
          await db.insert(whatsappTemplates).values({
            name: template.name,
            metaName: template.name,
            metaStatus: template.status,
            metaCategory: template.category,
            languageCode: template.language,
            category: "custom",
            content,
            variables: JSON.stringify(variables),
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        synced++;
      } catch (error) {
        failed++;
        errors.push(
          `فشل معالجة القالب ${template.name}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`
        );
      }
    }

    return {
      success: true,
      message: `تم مزامنة ${synced} قالب بنجاح من Meta (WABA: ${wabaId})`,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في جلب القوالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * دفع قالب جديد إلى Meta للمراجعة والاعتماد
 * وفق: POST /{whatsapp-business-account-id}/message_templates
 * https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#creation
 */
export async function pushTemplateToMeta(
  phoneNumberId: string,
  _accessToken?: string,
  templateName?: string,
  content?: string,
  category: string = "UTILITY",
  language: string = "ar",
  components?: any[]
): Promise<SyncResult> {
  try {
    const wabaId = await getWabaId(phoneNumberId);
    if (!wabaId) {
      return {
        success: false,
        message: "لم يتم العثور على WABA ID",
      };
    }

    // بناء مكونات القالب وفق وثائق Meta
    const templateComponents = components || [
      {
        type: "BODY",
        text: content || "",
        example: {
          body_text: [["مثال على القيمة"]],
        },
      },
    ];

    const payload = {
      name: templateName,
      language,
      category: category.toUpperCase(),
      components: templateComponents,
    };

    const res = await meta.post(`${wabaId}/message_templates`, payload);

    if (!res.ok) {
      return {
        success: false,
        message: `فشل دفع القالب إلى Meta: ${res.error?.message || "خطأ غير معروف"} (كود: ${res.error?.code})`,
      };
    }

    const metaTemplateId = res.data?.id;

    // تحديث حالة القالب في قاعدة البيانات
    const db = await getDb();
    if (db && templateName) {
      await db
        .update(whatsappTemplates)
        .set({
          metaStatus: "PENDING",
          metaTemplateId: metaTemplateId,
          updatedAt: new Date(),
        })
        .where(eq(whatsappTemplates.name, templateName));
    }

    return {
      success: true,
      message: `تم إرسال القالب "${templateName}" إلى Meta للمراجعة. معرف Meta: ${metaTemplateId}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في دفع القالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * التحقق من حالة قالب معين
 * وفق: GET /{template-id}
 */
export async function checkTemplateStatus(
  _phoneNumberId: string,
  _accessToken?: string,
  templateId?: string
): Promise<{ success: boolean; status?: string; message: string }> {
  try {
    if (!templateId) {
      return { success: false, message: "معرف القالب مطلوب" };
    }

    const res = await meta.get(templateId, {
      fields: "name,status,category,quality_score",
    });

    if (!res.ok) {
      return {
        success: false,
        message: `فشل التحقق من حالة القالب: ${res.error?.message}`,
      };
    }

    const status = res.data?.status;

    // تحديث الحالة في قاعدة البيانات
    const db = await getDb();
    if (db && status) {
      await db
        .update(whatsappTemplates)
        .set({ metaStatus: status, updatedAt: new Date() })
        .where(eq(whatsappTemplates.metaTemplateId, templateId));
    }

    return {
      success: true,
      status,
      message: `حالة القالب: ${status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في التحقق من الحالة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * حذف قالب من Meta
 * وفق: DELETE /{whatsapp-business-account-id}/message_templates?name={template-name}
 */
export async function deleteTemplateFromMeta(
  phoneNumberId: string,
  _accessToken?: string,
  templateName?: string
): Promise<SyncResult> {
  try {
    const wabaId = await getWabaId(phoneNumberId);
    if (!wabaId) {
      return { success: false, message: "لم يتم العثور على WABA ID" };
    }

    const res = await meta.delete(
      `${wabaId}/message_templates?name=${templateName}`
    );

    if (!res.ok) {
      return {
        success: false,
        message: `فشل حذف القالب من Meta: ${res.error?.message}`,
      };
    }

    // حذف من قاعدة البيانات
    const db = await getDb();
    if (db && templateName) {
      await db
        .delete(whatsappTemplates)
        .where(eq(whatsappTemplates.metaName, templateName));
    }

    return {
      success: true,
      message: `تم حذف القالب "${templateName}" من Meta وقاعدة البيانات بنجاح`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في حذف القالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * مزامنة شاملة للقوالب
 */
export async function syncTemplatesCompletely(
  phoneNumberId: string,
  _accessToken?: string
): Promise<SyncResult> {
  try {
    const fetchResult = await fetchTemplatesFromMeta(phoneNumberId);

    if (!fetchResult.success) {
      return fetchResult;
    }

    const db = await getDb();
    if (!db) {
      return { success: false, message: "لا يمكن الاتصال بقاعدة البيانات" };
    }

    const approvedTemplates = await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.metaStatus, "APPROVED"));

    return {
      success: true,
      message: `تمت المزامنة بنجاح. ${approvedTemplates.length} قالب معتمد جاهز للاستخدام`,
      synced: fetchResult.synced,
      failed: fetchResult.failed,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في المزامنة الشاملة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}
