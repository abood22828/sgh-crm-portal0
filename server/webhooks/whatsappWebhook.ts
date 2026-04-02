/**
 * WhatsApp Webhook Handler
 * معالج Webhook لـ WhatsApp Cloud API
 */

import { Request, Response } from "express";
import { ENV } from "../_core/env";
import { whatsappBot } from "../config/whatsapp";

/**
 * Verify Webhook Token
 */
export function verifyWebhookToken(req: Request, res: Response): boolean {
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (token !== ENV.webhookVerifyToken) {
    console.warn("[WhatsApp Webhook] Invalid verify token");
    res.status(403).json({ error: "Invalid verify token" });
    return false;
  }

  if (!challenge) {
    console.warn("[WhatsApp Webhook] Missing challenge");
    res.status(400).json({ error: "Missing challenge" });
    return false;
  }

  console.log("[WhatsApp Webhook] ✅ Webhook verified successfully");
  res.status(200).send(challenge);
  return true;
}

/**
 * Handle Incoming Message
 */
async function handleIncomingMessage(message: any) {
  try {
    const { from, id: messageId, timestamp, type, text } = message;

    console.log(`[WhatsApp Webhook] Incoming message from ${from}:`, {
      type,
      messageId,
    });

    // Auto-reply (optional)
    if (type === "text" && text && whatsappBot) {
      const autoReplyMessage = `شكراً لرسالتك! 👋

تم استقبال رسالتك بنجاح. سنرد عليك في أقرب وقت ممكن.

المستشفى السعودي الألماني - صنعاء
☎️ 8000018`;

      try {
        await whatsappBot.sendText(from, autoReplyMessage);
        console.log(`[WhatsApp Webhook] Auto-reply sent to ${from}`);
      } catch (error) {
        console.error("[WhatsApp Webhook] Failed to send auto-reply:", error);
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling incoming message:", error);
  }
}

/**
 * Handle Message Status Update
 */
async function handleMessageStatus(status: any) {
  try {
    const { id: messageId, status: messageStatus, timestamp } = status;

    console.log(`[WhatsApp Webhook] Message status:`, {
      messageId,
      status: messageStatus,
    });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling message status:", error);
  }
}

/**
 * Process Webhook Event
 */
export async function processWebhookEvent(body: any) {
  try {
    const { entry } = body;

    if (!entry || !Array.isArray(entry)) {
      console.warn("[WhatsApp Webhook] Invalid webhook body");
      return;
    }

    for (const item of entry) {
      const { changes } = item;

      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const { value } = change;

        if (!value) continue;

        // Handle messages
        if (value.messages) {
          for (const message of value.messages) {
            await handleIncomingMessage(message);
          }
        }

        // Handle message statuses
        if (value.statuses) {
          for (const status of value.statuses) {
            await handleMessageStatus(status);
          }
        }

        // Handle template status updates
        if (value.template_status_update) {
          console.log("[WhatsApp Webhook] Template status update:", value.template_status_update);
        }

        // Handle account alerts
        if (value.account_alerts) {
          console.warn("[WhatsApp Webhook] Account alert:", value.account_alerts);
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook event:", error);
  }
}

/**
 * Express Middleware for WhatsApp Webhook
 */
export function createWhatsAppWebhookHandler() {
  return async (req: Request, res: Response) => {
    // Handle GET request (verification)
    if (req.method === "GET") {
      verifyWebhookToken(req, res);
      return;
    }

    // Handle POST request (events)
    if (req.method === "POST") {
      try {
        const body = req.body;

        console.log("[WhatsApp Webhook] Received webhook event");

        // Process the webhook event
        await processWebhookEvent(body);

        // Always respond with 200 OK
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("[WhatsApp Webhook] Error processing webhook:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}

export default createWhatsAppWebhookHandler;
