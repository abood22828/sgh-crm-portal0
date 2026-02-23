/**
 * WhatsApp Cloud API - Unified Module
 * يتعامل مع جميع عمليات WhatsApp Business Cloud API
 * 
 * يستخدم:
 * - WHATSAPP_PHONE_NUMBER_ID: معرف رقم الهاتف في Cloud API
 * - META_ACCESS_TOKEN: رمز الوصول من Meta Business Manager
 */

const WHATSAPP_API_VERSION = "v21.0";
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

function getCredentials() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  return { phoneNumberId, accessToken };
}

/**
 * Format phone number to international format (967XXXXXXXXX)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d]/g, "");
  
  if (cleaned.startsWith("00967")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("967")) {
    // Already has country code
  } else if (cleaned.startsWith("0")) {
    cleaned = "967" + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = "967" + cleaned;
  }
  
  return cleaned;
}

/**
 * Check if WhatsApp Cloud API is configured and working
 */
export function getWhatsAppAPIStatus(): {
  isReady: boolean;
  isConnecting: boolean;
  hasQRCode: boolean;
  apiConfigured: boolean;
  phoneNumberId?: string;
  apiVersion: string;
  mode: string;
} {
  const { phoneNumberId, accessToken } = getCredentials();
  const configured = !!(phoneNumberId && accessToken);
  
  return {
    isReady: configured,
    isConnecting: false,
    hasQRCode: false,
    apiConfigured: configured,
    phoneNumberId: phoneNumberId || undefined,
    apiVersion: WHATSAPP_API_VERSION,
    mode: "cloud_api",
  };
}

/**
 * Check if WhatsApp Business API is configured (backward compatible alias)
 */
export function isWhatsAppBusinessAPIConfigured(): boolean {
  const { phoneNumberId, accessToken } = getCredentials();
  return !!(phoneNumberId && accessToken);
}

export function getWhatsAppBusinessAPIStatus(): {
  configured: boolean;
  phoneNumberId?: string;
} {
  const { phoneNumberId } = getCredentials();
  return {
    configured: isWhatsAppBusinessAPIConfigured(),
    phoneNumberId,
  };
}

// ─── Error Handling ────────────────────────────────────────

interface WhatsAppError {
  code: number;
  title: string;
  message: string;
  userFriendlyMessage: string;
  shouldRetry: boolean;
  category: 'rate_limit' | 'template' | 'user' | 'system' | 'policy';
}

const WHATSAPP_ERROR_CODES: Record<number, WhatsAppError> = {
  131049: { code: 131049, title: 'Marketing messages to US users blocked', message: 'Cannot send marketing messages to WhatsApp users in the United States', userFriendlyMessage: 'لا يمكن إرسال رسائل تسويقية للمستخدمين في الولايات المتحدة', shouldRetry: false, category: 'policy' },
  131026: { code: 131026, title: 'Template not approved or paused', message: 'The template is not approved, paused, or disabled', userFriendlyMessage: 'القالب غير معتمد أو متوقف مؤقتاً', shouldRetry: false, category: 'template' },
  131047: { code: 131047, title: 'Messaging limit reached', message: 'You have reached your messaging limit', userFriendlyMessage: 'تم الوصول إلى حد الرسائل المسموح به', shouldRetry: true, category: 'rate_limit' },
  131051: { code: 131051, title: 'Invalid phone number', message: 'The phone number is blocked, invalid, or not registered on WhatsApp', userFriendlyMessage: 'رقم الهاتف محظور أو غير صحيح أو غير مسجل في واتساب', shouldRetry: false, category: 'user' },
  130472: { code: 130472, title: 'User number is part of an experiment', message: 'The user number is part of an experiment', userFriendlyMessage: 'رقم المستخدم جزء من تجربة', shouldRetry: false, category: 'user' },
  133016: { code: 133016, title: 'Service temporarily unavailable', message: 'WhatsApp service is temporarily unavailable', userFriendlyMessage: 'خدمة واتساب غير متاحة مؤقتاً', shouldRetry: true, category: 'system' },
};

export function parseWhatsAppError(errorData: any): {
  code: number; title: string; message: string; userFriendlyMessage: string; shouldRetry: boolean; category: string;
} {
  const errorCode = errorData?.error?.code || errorData?.code || 0;
  const knownError = WHATSAPP_ERROR_CODES[errorCode];
  if (knownError) return knownError;
  return { code: errorCode, title: 'Unknown error', message: errorData?.error?.message || errorData?.message || 'Unknown error occurred', userFriendlyMessage: 'حدث خطأ غير معروف', shouldRetry: false, category: 'system' };
}

// ─── Send Messages ─────────────────────────────────────────

/**
 * Send a text message via WhatsApp Cloud API
 */
export async function sendWhatsAppTextMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials();
  
  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: "واتساب Cloud API غير مُعد. يرجى تعيين WHATSAPP_PHONE_NUMBER_ID و META_ACCESS_TOKEN",
    };
  }

  try {
    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;
    const formattedPhone = formatPhoneNumber(phone);

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    console.log(`[WhatsApp Cloud API] Sending text to ${formattedPhone}:`, message.substring(0, 50) + "...");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      const errorCode = data.error?.code;
      console.error(`[WhatsApp Cloud API] Error (${errorCode}):`, errorMsg);
      return {
        success: false,
        error: `${errorMsg} (كود: ${errorCode || 'غير معروف'})`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp Cloud API] Message sent successfully. ID: ${messageId}`);
    
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("[WhatsApp Cloud API] Exception:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

interface TemplateMessage {
  templateName: string;
  languageCode: string;
  components: Array<{
    type: "header" | "body" | "footer" | "button";
    parameters?: Array<{
      type: "text" | "payload" | "image";
      text?: string;
      payload?: string;
    }>;
    sub_type?: "quick_reply";
    index?: number;
  }>;
}

/**
 * Send a template message via WhatsApp Cloud API
 */
export async function sendWhatsAppTemplateMessage(
  phone: string,
  template: TemplateMessage,
  options?: { category?: "marketing" | "utility" | "authentication" }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { phoneNumberId, accessToken } = getCredentials();
  
  if (!phoneNumberId || !accessToken) {
    return {
      success: false,
      error: "واتساب Cloud API غير مُعد",
    };
  }

  try {
    const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`;
    const formattedPhone = formatPhoneNumber(phone);

    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: template.templateName,
        language: {
          code: template.languageCode,
        },
      },
    };

    if (template.components && template.components.length > 0) {
      payload.template.components = template.components;
    }

    console.log(`[WhatsApp Cloud API] Sending template "${template.templateName}" to ${formattedPhone}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      const errorCode = data.error?.code;
      console.error(`[WhatsApp Cloud API] Template error (${errorCode}):`, errorMsg);
      return {
        success: false,
        error: `${errorMsg} (كود: ${errorCode || 'غير معروف'})`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    console.log(`[WhatsApp Cloud API] Template sent successfully. ID: ${messageId}`);
    
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "خطأ غير معروف";
    console.error("[WhatsApp Cloud API] Template exception:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): { valid: boolean; formatted: string; error?: string } {
  const formatted = formatPhoneNumber(phone);
  
  if (formatted.length < 10 || formatted.length > 15) {
    return { valid: false, formatted, error: "رقم الهاتف غير صحيح" };
  }
  
  if (!formatted.startsWith("967")) {
    return { valid: true, formatted, error: undefined };
  }
  
  if (formatted.length !== 12) {
    return { valid: false, formatted, error: "رقم الهاتف اليمني يجب أن يكون 9 أرقام بعد كود الدولة" };
  }
  
  return { valid: true, formatted };
}
