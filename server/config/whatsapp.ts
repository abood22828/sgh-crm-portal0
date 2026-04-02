/**
 * WhatsApp Cloud API Configuration
 * مركز إعدادات تكامل WhatsApp Cloud API
 */

import { createBot } from "@awadoc/whatsapp-cloud-api";
import { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { ENV } from "../_core/env";

/**
 * WhatsApp Bot Instance
 * استخدام @awadoc/whatsapp-cloud-api للرسائل الأساسية والـ Flows
 */
export const whatsappBot = (() => {
  try {
    if (!ENV.whatsappPhoneNumberId || !ENV.metaAccessToken) {
      console.warn("[WhatsApp] Missing phone number ID or access token");
      return null;
    }

    const bot = createBot(ENV.whatsappPhoneNumberId, ENV.metaAccessToken);
    console.log("[WhatsApp] Bot initialized successfully");
    return bot;
  } catch (error) {
    console.error("[WhatsApp] Failed to initialize bot:", error);
    return null;
  }
})();

/**
 * WhatsApp Client Instance
 * استخدام @kapso/whatsapp-cloud-api للاستعلامات المتقدمة
 */
export const whatsappClient = (() => {
  try {
    if (!ENV.metaAccessToken) {
      console.warn("[WhatsApp] Missing access token");
      return null;
    }

    const client = new WhatsAppClient({
      accessToken: ENV.metaAccessToken,
    });
    console.log("[WhatsApp] Client initialized successfully");
    return client;
  } catch (error) {
    console.error("[WhatsApp] Failed to initialize client:", error);
    return null;
  }
})();

/**
 * Verify WhatsApp Configuration
 */
export function verifyWhatsAppConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!ENV.whatsappPhoneNumberId) {
    errors.push("WHATSAPP_PHONE_NUMBER_ID is not set");
  }

  if (!ENV.metaAccessToken) {
    errors.push("META_ACCESS_TOKEN is not set");
  }

  if (!ENV.webhookVerifyToken) {
    errors.push("WEBHOOK_VERIFY_TOKEN is not set");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get WhatsApp Configuration Status
 */
export function getWhatsAppStatus() {
  const config = verifyWhatsAppConfig();

  return {
    botInitialized: whatsappBot !== null,
    clientInitialized: whatsappClient !== null,
    configValid: config.isValid,
    errors: config.errors,
    phoneNumberId: ENV.whatsappPhoneNumberId ? "***" : "NOT_SET",
    hasAccessToken: !!ENV.metaAccessToken,
  };
}
