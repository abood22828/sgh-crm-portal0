import { Router, Request, Response } from "express";
import { getDb, getWhatsAppMessageByWhatsAppId, updateWhatsAppMessage, getWhatsAppConversationByPhone, createWhatsAppConversation, createWhatsAppMessage, updateWhatsAppConversation, getCustomerInfoByPhone, normalizePhoneNumber } from "./db";
import { appointments, offerLeads, campRegistrations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { publish, channelForConversation, channelForUser } from "./_core/pubsub";

/**
 * WhatsApp Webhook Express Routes
 * Meta requires standard HTTP GET/POST endpoints (not tRPC)
 * GET  /api/webhooks/whatsapp → Verification
 * POST /api/webhooks/whatsapp → Receive messages & statuses
 */

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "sgh_crm_webhook_2024";

// Global channel for all users to receive new message notifications
const GLOBAL_CHANNEL = "global:whatsapp";

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
      if (!body) {
        console.error("[Webhook] Empty payload received");
        return;
      }

      if (body.object !== "whatsapp_business_account") {
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
                const existingMsg = await getWhatsAppMessageByWhatsAppId(status.id);
                if (existingMsg) {
                  const updateData: any = { status: status.status };
                  if (status.status === 'delivered') updateData.deliveredAt = new Date();
                  if (status.status === 'read') updateData.readAt = new Date();
                  if (status.status === 'failed') updateData.errorInfo = JSON.stringify(status.errors || []);
                  await updateWhatsAppMessage(existingMsg.id, updateData);
                  console.log(`[Webhook] Updated message ${existingMsg.id} status => ${status.status}`);

                  // 🔔 Publish SSE: message status updated (for ✓✓ delivery indicators in ChatWindow)
                  publish(
                    channelForConversation(existingMsg.conversationId),
                    'message_updated',
                    {
                      messageId: existingMsg.id,
                      whatsappMessageId: status.id,
                      status: status.status,
                      deliveredAt: status.status === 'delivered' ? new Date().toISOString() : undefined,
                      readAt: status.status === 'read' ? new Date().toISOString() : undefined,
                    }
                  );
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
                const normalizedPhone = normalizePhoneNumber(userPhone);
                let conversation = await getWhatsAppConversationByPhone(normalizedPhone);
                
                if (!conversation) {
                  // Search for customer name from customer records
                  const customerInfo = await getCustomerInfoByPhone(normalizedPhone);
                  const customerName = customerInfo?.name || null;
                  
                  await createWhatsAppConversation({
                    phoneNumber: normalizedPhone,
                    customerName: customerName,
                    lastMessageAt: new Date(),
                    unreadCount: 1,
                    isImportant: 0,
                    isArchived: 0,
                  });
                  conversation = await getWhatsAppConversationByPhone(normalizedPhone);
                } else if (conversation.customerName === null || conversation.customerName === 'عميل جديد') {
                  // Update old conversations with "عميل جديد" to actual customer name
                  const customerInfo = await getCustomerInfoByPhone(normalizedPhone);
                  if (customerInfo?.name) {
                    await updateWhatsAppConversation(conversation.id, {
                      customerName: customerInfo.name,
                    });
                    conversation = { ...conversation, customerName: customerInfo.name };
                  }
                }

                if (conversation) {
                  const newMessageResult = await createWhatsAppMessage({
                    conversationId: conversation.id,
                    direction: 'inbound',
                    content: message.text.body,
                    messageType: 'text',
                    status: 'received',
                    whatsappMessageId: message.id || null,
                    sentAt: new Date(),
                  });
                  const newMessageId = (newMessageResult as any)?.[0]?.insertId || null;

                  const updatedUnreadCount = (conversation.unreadCount || 0) + 1;
                  await updateWhatsAppConversation(conversation.id, {
                    lastMessage: message.text.body.substring(0, 100),
                    lastMessageAt: new Date(),
                    unreadCount: updatedUnreadCount,
                  });

                  // 🔔 Publish SSE: new message to conversation channel (ChatWindow listens)
                  publish(
                    channelForConversation(conversation.id),
                    'new_message',
                    {
                      id: newMessageId,
                      conversationId: conversation.id,
                      direction: 'inbound',
                      content: message.text.body,
                      messageType: 'text',
                      status: 'received',
                      whatsappMessageId: message.id || null,
                      sentAt: new Date().toISOString(),
                    }
                  );

                  // 🔔 Publish SSE: global notification for sidebar badge
                  publish(
                    GLOBAL_CHANNEL,
                    'new_inbound_message',
                    {
                      conversationId: conversation.id,
                      phoneNumber: normalizedPhone,
                      customerName: conversation.customerName,
                      content: message.text.body.substring(0, 100),
                      unreadCount: updatedUnreadCount,
                      timestamp: new Date().toISOString(),
                    }
                  );

                  // 🔔 Publish SSE: user-specific channel for real-time updates
                  const ownerId = parseInt(process.env.OWNER_ID || '1', 10);
                  publish(
                    channelForUser(ownerId),
                    'new_inbound_message',
                    {
                      conversationId: conversation.id,
                      phoneNumber: normalizedPhone,
                      customerName: conversation.customerName,
                      content: message.text.body.substring(0, 100),
                      unreadCount: updatedUnreadCount,
                      timestamp: new Date().toISOString(),
                    }
                  );

                  console.log(`[Webhook] SSE published for conversation ${conversation.id}`);
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
      // Log detailed error information for debugging
      if (error instanceof Error) {
        console.error("[Webhook] Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }
  });

  return router;
}
