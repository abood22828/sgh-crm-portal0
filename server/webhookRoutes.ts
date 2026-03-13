import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { appointments, offerLeads, campRegistrations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * WhatsApp Webhook Express Routes
 * Meta requires standard HTTP GET/POST endpoints (not tRPC)
 * GET  /api/webhooks/whatsapp → Verification
 * POST /api/webhooks/whatsapp → Receive messages & statuses
 */

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "sgh_crm_webhook_2024";

export function createWebhookRouter(): Router {
  const router = Router();

  /**
   * GET /api/webhooks/whatsapp
   * Meta verification endpoint - returns hub.challenge on success
   */
  router.get("/api/webhooks/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    console.log("[Webhook] Verification request:", { mode, token: token ? "***" : "missing", challenge: challenge ? "present" : "missing" });

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("[Webhook] Verification successful");
      // Meta expects ONLY the challenge string as plain text response
      res.status(200).send(challenge);
    } else {
      console.error("[Webhook] Verification failed - token mismatch");
      res.status(403).json({ error: "Verification token mismatch" });
    }
  });

  /**
   * POST /api/webhooks/whatsapp
   * Receives incoming messages, button responses, and message statuses
   */
  router.post("/api/webhooks/whatsapp", async (req: Request, res: Response) => {
    try {
      // Always respond 200 immediately to Meta (they retry on non-200)
      res.status(200).json({ success: true });

      const body = req.body;
      if (!body || body.object !== "whatsapp_business_account") {
        console.log("[Webhook] Ignoring non-WhatsApp webhook");
        return;
      }

      console.log("[Webhook] Received:", JSON.stringify(body, null, 2));

      const db = await getDb();
      if (!db) {
        console.error("[Webhook] Database not available");
        return;
      }

      // Process each entry
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          if (!value) continue;

          // Process message statuses (sent, delivered, read, failed)
          const statuses = value.statuses;
          if (statuses && statuses.length > 0) {
            for (const status of statuses) {
              console.log(`[Webhook] Message status: ${status.status} for message ${status.id}`);

              if (status.status === "failed" && status.errors) {
                for (const error of status.errors) {
                  console.error(`[Webhook] Message failed - Code: ${error.code}, Title: ${error.title}, Message: ${error.message || "N/A"}`);
                }
              }
              try {
                // Try to find a message by whatsapp message id and update status
                const existingMsg = await db.getWhatsAppMessageByWhatsAppId(status.id);
                if (existingMsg) {
                  const updateData: any = { status: status.status };
                  if (status.status === 'delivered') updateData.deliveredAt = new Date();
                  if (status.status === 'read') updateData.readAt = new Date();
                  if (status.status === 'failed') updateData.errorInfo = JSON.stringify(status.errors || []);
                  await db.updateWhatsAppMessage(existingMsg.id, updateData);
                  console.log(`[Webhook] Updated message ${existingMsg.id} status => ${status.status}`);
                }
              } catch (err) {
                console.error('[Webhook] Failed to update message status in DB', err);
              }
            }
          }

          // Process incoming messages
          const messages = value.messages;
          if (!messages || messages.length === 0) continue;

          for (const message of messages) {
            const userPhone = message.from;

            if (message.type === "button" && message.button) {
              const payload = message.button.payload;
              console.log(`[Webhook] Button clicked: ${payload} from ${userPhone}`);

              // Parse payload: CONFIRM_APPOINTMENT_123 or CANCEL_APPOINTMENT_123
              const [action, type, id] = payload.split("_");

              if (!action || !type || !id) {
                console.error(`[Webhook] Invalid payload format: ${payload}`);
                continue;
              }

              const bookingId = parseInt(id);
              if (isNaN(bookingId)) {
                console.error(`[Webhook] Invalid booking ID: ${id}`);
                continue;
              }

              // Update status based on booking type
              if (type === "APPOINTMENT") {
                const newStatus = action === "CONFIRM" ? "confirmed" : "cancelled";
                await db
                  .update(appointments)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(appointments.id, bookingId));
                console.log(`[Webhook] Appointment ${bookingId} updated to ${newStatus}`);
              } else if (type === "OFFER") {
                const newStatus = action === "CONFIRM" ? "confirmed" : "cancelled";
                await db
                  .update(offerLeads)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(offerLeads.id, bookingId));
                console.log(`[Webhook] Offer lead ${bookingId} updated to ${newStatus}`);
              } else if (type === "CAMP") {
                const newStatus = action === "CONFIRM" ? "confirmed" : "cancelled";
                await db
                  .update(campRegistrations)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(campRegistrations.id, bookingId));
                console.log(`[Webhook] Camp registration ${bookingId} updated to ${newStatus}`);
              }
            } else if (message.type === "text" && message.text) {
              console.log(`[Webhook] Text message from ${userPhone}: ${message.text.body}`);
              try {
                // ensure conversation exists
                const formattedPhone = userPhone;
                let conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
                if (!conversation) {
                  await db.createWhatsAppConversation({
                    phoneNumber: formattedPhone,
                    customerName: null,
                    lastMessageAt: new Date(),
                    unreadCount: 1,
                    isImportant: 0,
                    isArchived: 0,
                  });
                  conversation = await db.getWhatsAppConversationByPhone(formattedPhone);
                }

                if (conversation) {
                  await db.createWhatsAppMessage({
                    conversationId: conversation.id,
                    direction: 'inbound',
                    content: message.text.body,
                    messageType: 'text',
                    status: 'received',
                    whatsappMessageId: message.id || null,
                    sentAt: new Date(),
                  });

                  await db.updateWhatsAppConversation(conversation.id, {
                    lastMessage: message.text.body.substring(0, 100),
                    lastMessageAt: new Date(),
                    unreadCount: (conversation.unreadCount || 0) + 1,
                  });
                }
              } catch (err) {
                console.error('[Webhook] Failed to persist incoming message', err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[Webhook] Error processing webhook:", error);
      // Don't throw - we already sent 200 to Meta
    }
  });

  return router;
}
