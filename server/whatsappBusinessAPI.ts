/**
 * WhatsApp Business API Integration
 * يتعامل مع إرسال الرسائل عبر WhatsApp Business API الرسمي من Meta
 * 
 * Requirements:
 * - WHATSAPP_PHONE_NUMBER_ID: رقم الهاتف المسجل في WhatsApp Business API
 * - META_ACCESS_TOKEN: Access token من Meta Business Manager
 */

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const WHATSAPP_API_VERSION = "v21.0";
const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsAppButton {
  type: "quick_reply";
  text: string;
  payload: string;
}

interface WhatsAppTemplateMessage {
  templateName: string;
  languageCode: string;
  components: Array<{
    type: "header" | "body" | "footer" | "button";
    parameters?: Array<{
      type: "text" | "payload";
      text?: string;
      payload?: string;
    }>;
    sub_type?: "quick_reply";
    index?: number;
  }>;
}

/**
 * Send a message using approved WhatsApp template
 * يرسل رسالة باستخدام قالب معتمد من Meta
 */
/**
 * Determine if message should use Marketing Messages API endpoint
 * رسائل التسويق (marketing) تستخدم endpoint خاص للحصول على تحسينات تلقائية
 */
function shouldUseMarketingEndpoint(templateCategory?: string): boolean {
  return templateCategory === 'marketing' || templateCategory === 'MARKETING';
}

export async function sendWhatsAppTemplateMessage(
  phone: string,
  template: WhatsAppTemplateMessage,
  options?: {
    category?: 'marketing' | 'utility' | 'authentication';
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
    console.error("[WhatsApp API] Missing credentials");
    return {
      success: false,
      error: "WhatsApp Business API credentials not configured",
    };
  }

  try {
    // استخدام Marketing Messages API endpoint للرسائل التسويقية
    const endpoint = shouldUseMarketingEndpoint(options?.category) 
      ? 'marketing_messages' 
      : 'messages';
    const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/${endpoint}`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phone,
      type: "template",
      template: {
        name: template.templateName,
        language: {
          code: template.languageCode,
        },
        components: template.components,
      },
    };

    console.log(`[WhatsApp API] Sending template message via ${endpoint}:`, {
      phone,
      templateName: template.templateName,
      category: options?.category || 'not specified',
      endpoint,
      payload: JSON.stringify(payload, null, 2),
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp API] Error response:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      };
    }

    console.log("[WhatsApp API] Message sent successfully:", data);
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("[WhatsApp API] Exception:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send booking confirmation with interactive buttons
 * يرسل تأكيد الحجز مع أزرار تفاعلية
 */
export async function sendBookingConfirmationWithButtons(data: {
  phone: string;
  templateName: string;
  variables: {
    name: string;
    date: string;
    time: string;
    doctor?: string;
    service?: string;
  };
  buttons: Array<{
    text: string;
    payload: string;
  }>;
  category?: 'marketing' | 'utility' | 'authentication';
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Build template components
  const components: WhatsAppTemplateMessage["components"] = [
    {
      type: "body",
      parameters: [
        { type: "text", text: data.variables.name },
        { type: "text", text: data.variables.date },
        { type: "text", text: data.variables.time },
      ],
    },
  ];

  // Add optional variables
  if (data.variables.doctor) {
    components[0].parameters!.push({ type: "text", text: data.variables.doctor });
  }
  if (data.variables.service) {
    components[0].parameters!.push({ type: "text", text: data.variables.service });
  }

  // Add buttons
  data.buttons.forEach((button, index) => {
    components.push({
      type: "button",
      sub_type: "quick_reply",
      index,
      parameters: [
        {
          type: "payload",
          payload: button.payload,
        },
      ],
    });
  });

  return sendWhatsAppTemplateMessage(
    data.phone, 
    {
      templateName: data.templateName,
      languageCode: "ar",
      components,
    },
    {
      category: data.category || 'utility', // افتراضياً utility للرسائل الخدمية
    }
  );
}

/**
 * Check if WhatsApp Business API is configured
 */
export function isWhatsAppBusinessAPIConfigured(): boolean {
  return !!(WHATSAPP_PHONE_NUMBER_ID && META_ACCESS_TOKEN);
}

/**
 * Get WhatsApp Business API status
 */
export function getWhatsAppBusinessAPIStatus(): {
  configured: boolean;
  phoneNumberId?: string;
} {
  return {
    configured: isWhatsAppBusinessAPIConfigured(),
    phoneNumberId: WHATSAPP_PHONE_NUMBER_ID,
  };
}

/**
 * WhatsApp Error Codes من Meta API
 * https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
 */
interface WhatsAppError {
  code: number;
  title: string;
  message: string;
  userFriendlyMessage: string;
  shouldRetry: boolean;
  category: 'rate_limit' | 'template' | 'user' | 'system' | 'policy';
}

const WHATSAPP_ERROR_CODES: Record<number, WhatsAppError> = {
  131049: {
    code: 131049,
    title: 'Marketing messages to US users blocked',
    message: 'Cannot send marketing messages to WhatsApp users in the United States',
    userFriendlyMessage: 'لا يمكن إرسال رسائل تسويقية للمستخدمين في الولايات المتحدة',
    shouldRetry: false,
    category: 'policy',
  },
  131026: {
    code: 131026,
    title: 'Template not approved or paused',
    message: 'The template is not approved, paused, or disabled',
    userFriendlyMessage: 'القالب غير معتمد أو متوقف مؤقتاً',
    shouldRetry: false,
    category: 'template',
  },
  131047: {
    code: 131047,
    title: 'Messaging limit reached',
    message: 'You have reached your messaging limit',
    userFriendlyMessage: 'تم الوصول إلى حد الرسائل المسموح به',
    shouldRetry: true,
    category: 'rate_limit',
  },
  131051: {
    code: 131051,
    title: 'Invalid phone number',
    message: 'The phone number is blocked, invalid, or not registered on WhatsApp',
    userFriendlyMessage: 'رقم الهاتف محظور أو غير صحيح أو غير مسجل في واتساب',
    shouldRetry: false,
    category: 'user',
  },
  130472: {
    code: 130472,
    title: 'User number is part of an experiment',
    message: 'The user number is part of an experiment',
    userFriendlyMessage: 'رقم المستخدم جزء من تجربة',
    shouldRetry: false,
    category: 'user',
  },
  133016: {
    code: 133016,
    title: 'Service temporarily unavailable',
    message: 'WhatsApp service is temporarily unavailable',
    userFriendlyMessage: 'خدمة واتساب غير متاحة مؤقتاً',
    shouldRetry: true,
    category: 'system',
  },
};

/**
 * Parse WhatsApp API error and return user-friendly information
 */
export function parseWhatsAppError(errorData: any): {
  code: number;
  title: string;
  message: string;
  userFriendlyMessage: string;
  shouldRetry: boolean;
  category: string;
} {
  const errorCode = errorData?.error?.code || errorData?.code || 0;
  const knownError = WHATSAPP_ERROR_CODES[errorCode];

  if (knownError) {
    return knownError;
  }

  // Unknown error
  return {
    code: errorCode,
    title: 'Unknown error',
    message: errorData?.error?.message || errorData?.message || 'Unknown error occurred',
    userFriendlyMessage: 'حدث خطأ غير معروف',
    shouldRetry: false,
    category: 'system',
  };
}

/**
 * Enhanced sendWhatsAppTemplateMessage with better error handling
 */
export async function sendWhatsAppTemplateMessageEnhanced(
  phone: string,
  template: WhatsAppTemplateMessage,
  options?: {
    category?: 'marketing' | 'utility' | 'authentication';
    retryOnFailure?: boolean;
    maxRetries?: number;
  }
): Promise<{ 
  success: boolean; 
  messageId?: string; 
  error?: string;
  errorDetails?: ReturnType<typeof parseWhatsAppError>;
}> {
  const maxRetries = options?.maxRetries || 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendWhatsAppTemplateMessage(phone, template, options);

    if (result.success) {
      return result;
    }

    // Parse error
    lastError = result.error;
    const errorDetails = parseWhatsAppError({ error: { message: result.error } });

    // Don't retry if error is not retryable
    if (!errorDetails.shouldRetry || !options?.retryOnFailure) {
      return {
        ...result,
        errorDetails,
      };
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`[WhatsApp API] Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError,
    errorDetails: parseWhatsAppError({ error: { message: lastError } }),
  };
}
