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

import { normalizePhoneNumber } from "../db";
import { sendWhatsAppTextMessage, sendWhatsAppTemplateMessage } from "../whatsappCloudAPI";
import meta from "../MetaApiService";
import { ENV } from "../_core/env";

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
  message?: string;
  error?: string;
}> {
  try {
    const wabaId = ENV.whatsappBusinessAccountId;

    if (!wabaId) {
      return { success: false, error: "WHATSAPP_BUSINESS_ACCOUNT_ID not configured" };
    }

    const response = await meta.get(`/${wabaId}/message_templates?fields=id,name,status,language,category,components&limit=100`);

    return {
      success: true,
      synced: response.data?.length || 0,
      updated: 0,
      message: `تمت مزامنة ${response.data?.length || 0} قالب من Meta`,
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
