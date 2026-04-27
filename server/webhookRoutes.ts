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

/**
 * Helper function to save inbound messages and publish SSE events
 */
async function saveInboundMessage(
  userPhone: string,
  content: string,
  messageType: string,
  whatsappMessageId?: string,
  metadata?: string
) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Webhook] Database not available");
      return;
    }

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
        content: content,
        messageType: messageType,
        status: 'received',
        whatsappMessageId: whatsappMessageId || null,
        sentAt: new Date(),
        metadata: metadata || null,
      });
      const newMessageId = (newMessageResult as any)?.[0]?.insertId || null;

      const updatedUnreadCount = (conversation.unreadCount || 0) + 1;
      await updateWhatsAppConversation(conversation.id, {
        lastMessage: content.substring(0, 100),
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
          content: content,
          messageType: messageType,
          status: 'received',
          whatsappMessageId: whatsappMessageId || null,
          sentAt: new Date().toISOString(),
          metadata: metadata || null,
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
          content: content.substring(0, 100),
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
          content: content.substring(0, 100),
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
            } else if (message.type === "interactive" && message.interactive) {
              // معالجة الرسائل التفاعلية (قوائم، أزرار سريعة)
              console.log(`[Webhook] Interactive message from ${userPhone}:`, JSON.stringify(message.interactive));
              
              const interactive = message.interactive;
              let content = "رسالة تفاعلية";
              let payload = null;

              if (interactive.type === "button_reply" && interactive.button_reply) {
                payload = interactive.button_reply.payload;
                content = `رد على زر: ${interactive.button_reply.title}`;
                console.log(`[Webhook] Button reply: ${payload} - ${interactive.button_reply.title}`);
              } else if (interactive.type === "list_reply" && interactive.list_reply) {
                payload = interactive.list_reply.id;
                content = `رد على قائمة: ${interactive.list_reply.title}`;
                console.log(`[Webhook] List reply: ${payload} - ${interactive.list_reply.title}`);
              }

              // حفظ الرسالة التفاعلية كرسالة نصية
              await saveInboundMessage(userPhone, content, 'interactive', message.id, payload);
            } else if (message.type === "text" && message.text) {
              console.log(`[Webhook] Text message from ${userPhone}: ${message.text.body}`);
              await saveInboundMessage(userPhone, message.text.body, 'text', message.id);
            } else if (message.type === "image" && message.image) {
              console.log(`[Webhook] Image message from ${userPhone}: ${message.image.caption || '(no caption)'}`);
              const content = message.image.caption || `📷 صورة (${message.image.mime_type})`;
              await saveInboundMessage(userPhone, content, 'image', message.id, JSON.stringify(message.image));
            } else if (message.type === "audio" && message.audio) {
              console.log(`[Webhook] Audio message from ${userPhone}`);
              await saveInboundMessage(userPhone, '🎵 رسالة صوتية', 'audio', message.id, JSON.stringify(message.audio));
            } else if (message.type === "video" && message.video) {
              console.log(`[Webhook] Video message from ${userPhone}: ${message.video.caption || '(no caption)'}`);
              const content = message.video.caption || `🎥 فيديو (${message.video.mime_type})`;
              await saveInboundMessage(userPhone, content, 'video', message.id, JSON.stringify(message.video));
            } else if (message.type === "document" && message.document) {
              console.log(`[Webhook] Document message from ${userPhone}: ${message.document.filename || '(no filename)'}`);
              const content = `📄 ملف: ${message.document.filename || 'غير معروف'}`;
              await saveInboundMessage(userPhone, content, 'document', message.id, JSON.stringify(message.document));
            } else if (message.type === "location" && message.location) {
              console.log(`[Webhook] Location message from ${userPhone}: ${message.location.latitude}, ${message.location.longitude}`);
              const content = `📍 الموقع: ${message.location.latitude}, ${message.location.longitude}`;
              await saveInboundMessage(userPhone, content, 'location', message.id, JSON.stringify(message.location));
            } else if (message.type === "contacts" && message.contacts) {
              console.log(`[Webhook] Contacts message from ${userPhone}: ${message.contacts.length} contacts`);
              const content = `👥 ${message.contacts.length} جهة اتصال`;
              await saveInboundMessage(userPhone, content, 'contacts', message.id, JSON.stringify(message.contacts));
            } else if (message.type === "template" && message.template) {
              console.log(`[Webhook] Template response from ${userPhone}: ${message.template.name}`);
              const content = `رد على قالب: ${message.template.name}`;
              await saveInboundMessage(userPhone, content, 'template', message.id, JSON.stringify(message.template));
            } else {
              console.warn(`[Webhook] Unsupported message type: ${message.type} from ${userPhone}`);
              console.log(`[Webhook] Full message:`, JSON.stringify(message, null, 2));
              // حفظ كرسالة نصية عامة
              await saveInboundMessage(userPhone, `[نوع غير مدعوم: ${message.type}]`, 'unknown', message.id);
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
