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
export async function sendWhatsAppTemplateMessage(
  phone: string,
  template: WhatsAppTemplateMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !META_ACCESS_TOKEN) {
    console.error("[WhatsApp API] Missing credentials");
    return {
      success: false,
      error: "WhatsApp Business API credentials not configured",
    };
  }

  try {
    const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

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

    console.log("[WhatsApp API] Sending template message:", {
      phone,
      templateName: template.templateName,
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

  return sendWhatsAppTemplateMessage(data.phone, {
    templateName: data.templateName,
    languageCode: "ar",
    components,
  });
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
