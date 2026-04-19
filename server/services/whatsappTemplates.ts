/**
 * WhatsApp Templates Service
 * خدمة إرسال القوالب المعتمدة من Meta عبر Cloud API الرسمي
 *
 * ✅ يستخدم Cloud API الرسمي (MetaApiService)
 * ✅ يدعم إرسال القوالب مع المتغيرات (components)
 * ✅ يدعم إرسال الوسائط (صور، فيديو، مستندات)
 * ✅ متوافق مع وثائق Meta الرسمية v23.0
 *
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/message-types/template-messages
 */

import { eq, notInArray } from "drizzle-orm";
import { normalizePhoneNumber } from "../db";
import { getDb } from "../db";
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from "../whatsappCloudAPI";
import { meta } from "../MetaApiService";
import { ENV } from "../_core/env";
import { whatsappTemplates } from "../../drizzle/schema";

export interface TemplateParameter {
  type: "text" | "image" | "document" | "video";
  value: string;
}

/**
 * إرسال رسالة قالب معتمد من Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/message-types/template-messages
 */
export async function sendTemplateMessage(params: {
  phone: string;
  templateName: string;
  language?: string;
  parameters?: TemplateParameter[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    // بناء components للقالب وفق بنية Meta الرسمية
    const components: any[] = [];
    if (params.parameters && params.parameters.length > 0) {
      components.push({
        type: "body",
        parameters: params.parameters.map((p) => ({
          type: p.type,
          text: p.type === "text" ? p.value : undefined,
          image: p.type === "image" ? { link: p.value } : undefined,
          document: p.type === "document" ? { link: p.value } : undefined,
          video: p.type === "video" ? { link: p.value } : undefined,
        })),
      });
    }

    const result = await sendWhatsAppTemplateMessage(
      normalizedPhone,
      {
        templateName: params.templateName,
        languageCode: params.language || "ar",
        components,
      }
    );

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to send template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * مزامنة القوالب من Meta API
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview
 */
export async function syncTemplatesFromMeta(): Promise<{
  success: boolean;
  synced?: number;
  updated?: number;
  deleted?: number;
  message?: string;
  error?: string;
}> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    // جلب القوالب من Meta - الاستجابة تكون {data: {data: [...], paging: {...}}}
    const response = await meta.get(`${wabaId}/message_templates`, {
      fields: "id,name,status,language,category,components,quality_score,rejected_reason",
      limit: "250",
    });

    if (!response.ok) {
      console.error("[WhatsApp Templates] Meta API error:", response.error);
      return {
        success: false,
        error: response.error?.message || "Failed to fetch templates from Meta",
      };
    }

    // Meta تُرجع {data: [...]} والمصفوفة تكون response.data.data
    const templates: any[] = response.data?.data ?? [];
    console.log(`[WhatsApp Templates] Fetched ${templates.length} templates from Meta (WABA: ${wabaId})`);

    if (templates.length === 0) {
      return {
        success: true,
        synced: 0,
        updated: 0,
        message: "لم يتم العثور على قوالب في Meta. تأكد من صحة WHATSAPP_BUSINESS_ACCOUNT_ID وصلاحية META_ACCESS_TOKEN",
      };
    }

    const db = await getDb();
    if (!db) {
      return { success: false, error: "لا يمكن الاتصال بقاعدة البيانات" };
    }

    let synced = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const template of templates) {
      try {
        // استخراج محتوى الجسم والمتغيرات
        let content = "";
        let variables: string[] = [];
        let headerText: string | null = null;
        let footerText: string | null = null;

        if (template.components) {
          for (const component of template.components) {
            if (component.type === "HEADER" && component.text) {
              headerText = component.text;
            } else if (component.type === "BODY" && component.text) {
              content = component.text;
              const positional = component.text.match(/\{\{(\d+)\}\}/g) || [];
              const named = component.text.match(/\{\{([a-z_]+)\}\}/g) || [];
              variables = [...positional, ...named].map((m: string) => m.replace(/[{}]/g, ""));
            } else if (component.type === "FOOTER" && component.text) {
              footerText = component.text;
            }
          }
        }

        // تحديد الفئة - استخدام فئة Meta مباشرة
        const validCategories = ["MARKETING", "UTILITY", "AUTHENTICATION"];
        const category = validCategories.includes(template.category?.toUpperCase())
          ? (template.category.toUpperCase() as "MARKETING" | "UTILITY" | "AUTHENTICATION")
          : "UTILITY";

        // التحقق من وجود القالب بالاسم
        const existing = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.metaName, template.name))
          .limit(1);

        if (existing.length > 0) {
          // تحديث القالب الموجود
          await db
            .update(whatsappTemplates)
            .set({
              metaStatus: template.status,
              metaCategory: template.category,
              metaTemplateId: template.id,
              content: content || existing[0].content,
              variables: JSON.stringify(variables),
              languageCode: template.language,
              headerText: headerText ?? existing[0].headerText,
              footerText: footerText ?? existing[0].footerText,
              updatedAt: new Date(),
            })
            .where(eq(whatsappTemplates.metaName, template.name));
          updated++;
        } else {
          // إضافة قالب جديد
          await db.insert(whatsappTemplates).values({
            name: template.name,
            metaName: template.name,
            metaTemplateId: template.id,
            metaStatus: template.status,
            metaCategory: template.category,
            languageCode: template.language,
            category,
            content,
            variables: JSON.stringify(variables),
            headerText,
            footerText,
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          synced++;
        }
      } catch (err) {
        const errMsg = `فشل معالجة القالب ${template.name}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`;
        console.error("[WhatsApp Templates]", errMsg);
        errors.push(errMsg);
      }
    }

    // ── حذف القوالب المحلية غير الموجودة في Meta ──────────────────────────────
    // نجمع أسماء القوالب التي جلبناها من Meta
    const metaTemplateNames = templates.map((t: any) => t.name as string);
    let deleted = 0;

    if (metaTemplateNames.length > 0) {
      try {
        // نجلب القوالب المحلية التي لها metaName ولكنها غير موجودة في Meta
        const localTemplates = await db
          .select({ id: whatsappTemplates.id, name: whatsappTemplates.name })
          .from(whatsappTemplates)
          .where(notInArray(whatsappTemplates.metaName, metaTemplateNames));

        // نحذف فقط القوالب التي لها metaName (أي تم جلبها من Meta سابقاً) وغير موجودة الآن
        const toDelete = localTemplates.filter((t) => t.name); // كل القوالب التي لها اسم
        if (toDelete.length > 0) {
          for (const t of toDelete) {
            await db.delete(whatsappTemplates).where(eq(whatsappTemplates.id, t.id));
            deleted++;
          }
          console.log(`[WhatsApp Templates] Deleted ${deleted} local templates not found in Meta`);
        }
      } catch (delErr) {
        console.error("[WhatsApp Templates] Failed to delete stale templates:", delErr);
      }
    }

    const totalProcessed = synced + updated;
    return {
      success: true,
      synced,
      updated,
      deleted,
      message: `تمت مزامنة ${totalProcessed} قالب من Meta (جديد: ${synced}, محدّث: ${updated}, محذوف: ${deleted})${errors.length > 0 ? ` - ${errors.length} أخطاء` : ""}`,
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to sync templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * إنشاء قالب جديد في Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/create-and-manage-templates
 */
export async function createTemplate(params: {
  name: string;
  content: string;
  category: string;
  language?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    const response: any = await meta.post(`/${wabaId}/message_templates`, {
      name: params.name,
      language: params.language || "ar",
      category: params.category.toUpperCase(),
      components: [
        {
          type: "BODY",
          text: params.content,
        },
      ],
    });

    return {
      success: true,
      templateId: response.id || `template_${Date.now()}`,
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to create template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * تحديث قالب موجود في Meta
 */
export async function updateTemplate(
  templateId: number,
  params: {
    name?: string;
    content?: string;
    category?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {};
    if (params.content) {
      updateData.components = [{ type: "BODY", text: params.content }];
    }
    if (params.category) {
      updateData.category = params.category.toUpperCase();
    }

    await meta.post(`/${templateId}`, updateData);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to update template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * حذف قالب من Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/create-and-manage-templates#delete-templates
 */
export async function deleteTemplate(
  templateId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    await meta.delete(`/${wabaId}/message_templates?hsm_id=${templateId}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to delete template:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * جلب القوالب المتاحة من Meta API
 */
export async function getAvailableTemplates(): Promise<{
  success: boolean;
  templates?: any[];
  error?: string;
}> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    const response = await meta.get(
      `/${wabaId}/message_templates?fields=id,name,status,language,category,components&limit=100`
    );

    return {
      success: true,
      templates: response.data || [],
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to get templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * جلب حالة قالب معين من Meta
 */
export async function getTemplateStatus(templateName: string): Promise<{
  success: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    const response = await meta.get(
      `/${wabaId}/message_templates?name=${templateName}&fields=name,status`
    );

    const template = response.data?.[0];
    return {
      success: true,
      status: template?.status || "UNKNOWN",
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to get template status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * إرسال رسالة وسائط عبر Cloud API الرسمي
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/message-types/media-messages
 */
export async function sendMediaMessage(params: {
  phone: string;
  mediaType: "image" | "video" | "document" | "audio";
  mediaUrl: string;
  caption?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    const phoneNumberId = ENV.whatsappPhoneNumberId;

    if (!phoneNumberId) {
      return { success: false, error: "WHATSAPP_PHONE_NUMBER_ID not configured" };
    }

    // بناء payload وفق بنية Meta الرسمية للوسائط
    const mediaPayload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: params.mediaType,
    };

    switch (params.mediaType) {
      case "image":
        mediaPayload.image = { link: params.mediaUrl, caption: params.caption };
        break;
      case "video":
        mediaPayload.video = { link: params.mediaUrl, caption: params.caption };
        break;
      case "document":
        mediaPayload.document = { link: params.mediaUrl, caption: params.caption };
        break;
      case "audio":
        mediaPayload.audio = { link: params.mediaUrl };
        break;
      default:
        return { success: false, error: "Unsupported media type" };
    }

    const response: any = await meta.post(`/${phoneNumberId}/messages`, mediaPayload);

    return {
      success: true,
      messageId: response.messages?.[0]?.id || "media_sent",
    };
  } catch (error) {
    console.error("[WhatsApp Templates] Failed to send media message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
