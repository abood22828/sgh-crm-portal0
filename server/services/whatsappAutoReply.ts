import { whatsappBot } from "../config/whatsapp";
import { normalizePhoneNumber } from "../db";

export interface AutoReplyRule {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const autoReplyRules: Map<string, AutoReplyRule> = new Map();

export async function addAutoReplyRule(params: {
  trigger: string;
  response: string;
}): Promise<{ success: boolean; ruleId?: string; error?: string }> {
  try {
    if (!params.trigger || !params.response) {
      return { success: false, error: "Trigger and response are required" };
    }

    const ruleId = `rule_${Date.now()}`;
    const rule: AutoReplyRule = {
      id: ruleId,
      trigger: params.trigger,
      response: params.response,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    autoReplyRules.set(ruleId, rule);

    console.log(`[WhatsApp AutoReply] Added rule ${ruleId}`);

    return {
      success: true,
      ruleId,
    };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to add rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteAutoReplyRule(ruleId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!autoReplyRules.has(ruleId)) {
      return { success: false, error: "Rule not found" };
    }

    autoReplyRules.delete(ruleId);

    console.log(`[WhatsApp AutoReply] Deleted rule ${ruleId}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to delete rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getAutoReplyRules(): Promise<{
  success: boolean;
  rules?: AutoReplyRule[];
  error?: string;
}> {
  try {
    const rules = Array.from(autoReplyRules.values());

    return {
      success: true,
      rules,
    };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to get rules:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function processIncomingMessage(params: {
  phone: string;
  message: string;
}): Promise<{ success: boolean; replied?: boolean; error?: string }> {
  try {
    if (!whatsappBot) {
      return { success: false, error: "WhatsApp bot not initialized" };
    }

    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      return { success: false, error: "Invalid phone number format" };
    }

    for (const rule of Array.from(autoReplyRules.values())) {
      if (!rule.enabled) continue;

      if (params.message.toLowerCase().includes(rule.trigger.toLowerCase())) {
        try {
          await whatsappBot.sendText(normalizedPhone, rule.response);

          console.log(
            `[WhatsApp AutoReply] Sent auto-reply to ${normalizedPhone} using rule ${rule.id}`
          );

          return {
            success: true,
            replied: true,
          };
        } catch (error) {
          console.error(`[WhatsApp AutoReply] Failed to send auto-reply:`, error);
          return {
            success: false,
            replied: false,
            error: "Failed to send auto-reply",
          };
        }
      }
    }

    return {
      success: true,
      replied: false,
    };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to process incoming message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function toggleAutoReplyRule(
  ruleId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const rule = autoReplyRules.get(ruleId);
    if (!rule) {
      return { success: false, error: "Rule not found" };
    }

    rule.enabled = enabled;
    rule.updatedAt = new Date();

    console.log(`[WhatsApp AutoReply] Rule ${ruleId} ${enabled ? "enabled" : "disabled"}`);

    return { success: true };
  } catch (error) {
    console.error("[WhatsApp AutoReply] Failed to toggle rule:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
