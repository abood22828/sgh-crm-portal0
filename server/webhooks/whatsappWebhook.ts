/**
 * WhatsApp Webhook Handler — معالج Webhook لـ WhatsApp Cloud API
 *
 * ✅ التحقق من X-Hub-Signature-256 (وفق وثائق Meta الرسمية)
 * ✅ معالجة message_template_status_update تلقائياً
 * ✅ معالجة Opt-Out (STOP) تلقائياً
 * ✅ حفظ الرسائل الواردة في قاعدة البيانات
 * ✅ تحديث حالة القوالب تلقائياً عند تغيير Meta لها
 *
 * وفق وثائق Meta الرسمية:
 * https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/
 */

import crypto from "crypto";
import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";
import { getDb, getWhatsAppConversationByPhone, createWhatsAppConversation, createWhatsAppMessage, updateWhatsAppConversation, normalizePhoneNumber } from "../db";
import { whatsappTemplates, whatsappNotifications, whatsappMessages } from "../../drizzle/schema";
import { sendWhatsAppTextMessage } from "../whatsappCloudAPI";
import { processIncomingMessage } from "../services/whatsappAutoReply";

// ─── Signature Verification ────────────────────────────────────────────────────

/**
 * التحقق من صحة توقيع Webhook وفق وثائق Meta الرسمية
 * https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/#validating-payloads
 *
 * يستخدم HMAC-SHA256 مع App Secret لضمان أن الطلب قادم من Meta فعلاً
 */
export function verifyWebhookSignature(req: Request): boolean {
  const appSecret = process.env.META_APP_SECRET || process.env.JWT_SECRET;

  if (!appSecret) {
    // في بيئة التطوير: تخطي التحقق إذا لم يكن App Secret متاحاً
    if (process.env.NODE_ENV !== "production") {
      console.warn("[WhatsApp Webhook] ⚠️  META_APP_SECRET not set — skipping signature verification (dev mode)");
      return true;
    }
    console.error("[WhatsApp Webhook] ❌ META_APP_SECRET not set in production!");
    return false;
  }

  const signature = req.headers["x-hub-signature-256"] as string;
  if (!signature) {
    console.warn("[WhatsApp Webhook] ❌ Missing X-Hub-Signature-256 header");
    return false;
  }

  // الحصول على raw body للتحقق من التوقيع
  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.warn("[WhatsApp Webhook] ⚠️  rawBody not available — ensure express.raw() middleware is applied");
    // Fallback: استخدام JSON.stringify
    const bodyStr = JSON.stringify(req.body);
    const expectedSig = "sha256=" + crypto
      .createHmac("sha256", appSecret)
      .update(bodyStr, "utf8")
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }

  const expectedSig = "sha256=" + crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(expectedSig, "utf8")
    );
  } catch {
    return false;
  }
}

// ─── Webhook Verification (GET) ────────────────────────────────────────────────

/**
 * التحقق من Webhook Token عند تسجيل Webhook في Meta
 * وفق: GET /webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 */
export function verifyWebhookToken(req: Request, res: Response): boolean {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe") {
    console.warn("[WhatsApp Webhook] Invalid hub.mode:", mode);
    res.status(403).json({ error: "Invalid hub.mode" });
    return false;
  }

  if (token !== ENV.webhookVerifyToken) {
    console.warn("[WhatsApp Webhook] ❌ Invalid verify token");
    res.status(403).json({ error: "Invalid verify token" });
    return false;
  }

  if (!challenge) {
    console.warn("[WhatsApp Webhook] Missing hub.challenge");
    res.status(400).json({ error: "Missing challenge" });
    return false;
  }

  console.log("[WhatsApp Webhook] ✅ Webhook verified successfully");
  res.status(200).send(challenge);
  return true;
}

// ─── Message Handlers ──────────────────────────────────────────────────────────

/**
 * معالجة الرسائل الواردة وحفظها في قاعدة البيانات
 */
async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const { from, id: messageId, timestamp, type, text, button, interactive } = message;
    const phoneNumberId = metadata?.phone_number_id;

    console.log(`[WhatsApp Webhook] 📩 Incoming ${type} message from ${from} (msgId: ${messageId})`);

    // ── 1. التحقق من Opt-Out (STOP / إلغاء الاشتراك) ──────────────────────────
    if (type === "text" && text?.body) {
      const msgLower = text.body.trim().toLowerCase();
      const optOutKeywords = ["stop", "إيقاف", "إلغاء", "unsubscribe", "لا أريد"];

      if (optOutKeywords.some((kw) => msgLower.includes(kw))) {
        console.log(`[WhatsApp Webhook] 🚫 Opt-Out received from ${from}`);
        await handleOptOut(from);
        return;
      }
    }

    // ── 2. معالجة الرد التلقائي ────────────────────────────────────────────────
    if (type === "text" && text?.body) {
      await processIncomingMessage({ phone: from, message: text.body });
    }

    // ── 3. حفظ الرسالة في قاعدة البيانات ─────────────────────────────────────
    const db = await getDb();
    if (!db) {
      console.error("[WhatsApp Webhook] Database not available");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(from);
    if (!normalizedPhone) {
      console.error("[WhatsApp Webhook] Invalid phone number");
      return;
    }

    // الحصول على أو إنشاء المحادثة
    let conversation = await getWhatsAppConversationByPhone(normalizedPhone);
    if (!conversation) {
      await createWhatsAppConversation({
        phoneNumber: normalizedPhone,
        lastMessage: text?.body?.substring(0, 100) || "رسالة جديدة",
        lastMessageAt: new Date(),
        unreadCount: 1,
      });
      conversation = await getWhatsAppConversationByPhone(normalizedPhone);
      console.log(`[WhatsApp Webhook] ✅ Created new conversation for ${normalizedPhone}`);
    }

    if (!conversation) {
      console.error("[WhatsApp Webhook] Failed to create or retrieve conversation");
      return;
    }

    // تحديد نوع المحتوى
    let content = "";
    let messageType = "text";

    if (type === "text" && text?.body) {
      content = text.body;
      messageType = "text";
    } else if (type === "image" && text?.body) {
      content = text.body;
      messageType = "image";
    } else if (type === "document" && text?.body) {
      content = text.body;
      messageType = "document";
    } else if (type === "video" && text?.body) {
      content = text.body;
      messageType = "video";
    } else if (type === "audio" && text?.body) {
      content = text.body;
      messageType = "audio";
    } else if (type === "location") {
      content = "📍 موقع";
      messageType = "location";
    } else if (type === "button" && button?.text) {
      content = button.text;
      messageType = "interactive";
    } else if (type === "interactive" && interactive) {
      // معالجة interactive messages (button_reply, list_reply, etc.)
      if (interactive.type === "button_reply" && interactive.button_reply) {
        content = interactive.button_reply.title || interactive.button_reply.id || "زر";
        messageType = "interactive";
      } else if (interactive.type === "list_reply" && interactive.list_reply) {
        content = interactive.list_reply.title || interactive.list_reply.id || "قائمة";
        messageType = "interactive";
      } else if (interactive.type === "narrow_list_reply" && interactive.narrow_list_reply) {
        content = interactive.narrow_list_reply.title || interactive.narrow_list_reply.id || "قائمة";
        messageType = "interactive";
      } else {
        content = interactive.type || "تفاعل";
        messageType = "interactive";
      }
    } else {
      content = "رسالة غير مدعومة";
      messageType = "unknown";
    }

    // حفظ الرسالة
    await createWhatsAppMessage({
      conversationId: conversation.id,
      direction: "inbound",
      content,
      messageType,
      status: "received",
      whatsappMessageId: messageId || null,
      sentAt: new Date(parseInt(timestamp) * 1000),
    });

    // تحديث المحادثة
    await updateWhatsAppConversation(conversation.id, {
      lastMessage: content.substring(0, 100),
      lastMessageAt: new Date(),
      unreadCount: (conversation.unreadCount || 0) + 1,
    });

    console.log(`[WhatsApp Webhook] ✅ Saved message to conversation ${conversation.id}`);

  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling incoming message:", error);
  }
}

/**
 * معالجة تحديثات حالة الرسائل (sent, delivered, read, failed)
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/components/statuses
 */
async function handleMessageStatus(status: any) {
  try {
    const { id: messageId, status: messageStatus, timestamp, recipient_id, errors } = status;

    console.log(`[WhatsApp Webhook] 📊 Message ${messageId} → ${messageStatus} (to: ${recipient_id})`);

    // معالجة حالة الفشل
    if (messageStatus === "failed" && errors?.length > 0) {
      const errorCode = errors[0]?.code;
      const errorTitle = errors[0]?.title;
      const errorMessage = errors[0]?.message;
      console.error(`[WhatsApp Webhook] ❌ Message failed: ${errorTitle} (code: ${errorCode}) - ${errorMessage}`);

      // كود 131047: انتهت نافذة 24 ساعة — يجب إرسال قالب
      if (errorCode === 131047) {
        console.warn(`[WhatsApp Webhook] ⚠️  24-hour window expired for ${recipient_id} — template required`);
      }
    }

    // تحديث حالة الرسالة في قاعدة البيانات
    const db = await getDb();
    if (!db) {
      console.error("[WhatsApp Webhook] Database not available for status update");
      return;
    }

    // تحديث حالة الرسالة في جدول whatsappMessages
    const messageUpdate = await db
      .update(whatsappMessages)
      .set({
        status: messageStatus,
        deliveredAt: messageStatus === "delivered" ? new Date(parseInt(timestamp) * 1000) : undefined,
        readAt: messageStatus === "read" ? new Date(parseInt(timestamp) * 1000) : undefined,
      })
      .where(eq(whatsappMessages.whatsappMessageId, messageId));

    console.log(`[WhatsApp Webhook] ✅ Updated message status: ${messageId} → ${messageStatus}`);

    // تحديث حالة الإشعار في جدول whatsappNotifications
    const notificationUpdate = await db
      .update(whatsappNotifications)
      .set({
        status: messageStatus,
        errorMessage: messageStatus === "failed" && errors?.length > 0 
          ? `${errors[0]?.title}: ${errors[0]?.message}` 
          : null,
        deliveredAt: messageStatus === "delivered" ? new Date(parseInt(timestamp) * 1000) : undefined,
        readAt: messageStatus === "read" ? new Date(parseInt(timestamp) * 1000) : undefined,
      })
      .where(eq(whatsappNotifications.metaMessageId, messageId));

    console.log(`[WhatsApp Webhook] ✅ Updated notification status: ${messageId} → ${messageStatus}`);

  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling message status:", error);
  }
}

/**
 * معالجة تحديثات حالة القوالب تلقائياً
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/components/template-status-updates
 *
 * الأحداث: APPROVED, REJECTED, DISABLED, PENDING_DELETION, FLAGGED, PAUSED, REINSTATED
 */
async function handleTemplateStatusUpdate(update: any) {
  try {
    const { message_template_id, message_template_name, event, reason } = update;

    console.log(`[WhatsApp Webhook] 📋 Template "${message_template_name}" → ${event}${reason ? ` (${reason})` : ""}`);

    const db = await getDb();
    if (!db) return;

    // تحديث حالة القالب في قاعدة البيانات
    const statusMap: Record<string, string> = {
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
      DISABLED: "DISABLED",
      PAUSED: "PAUSED",
      REINSTATED: "APPROVED",
      FLAGGED: "FLAGGED",
      PENDING_DELETION: "PENDING_DELETION",
    };

    const newStatus = statusMap[event] || event;

    await db
      .update(whatsappTemplates)
      .set({
        metaStatus: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(whatsappTemplates.metaTemplateId, String(message_template_id)));

    // إذا تم رفض القالب أو تعطيله، سجّل السبب
    if (event === "REJECTED" || event === "DISABLED") {
      console.error(`[WhatsApp Webhook] ⛔ Template "${message_template_name}" ${event}: ${reason || "No reason provided"}`);
    }

    if (event === "APPROVED") {
      console.log(`[WhatsApp Webhook] ✅ Template "${message_template_name}" APPROVED — ready to use`);
    }

  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling template status update:", error);
  }
}

/**
 * معالجة Opt-Out تلقائياً
 * وفق سياسة Meta: يجب احترام طلبات إلغاء الاشتراك فوراً
 */
async function handleOptOut(phone: string) {
  try {
    // إرسال رسالة تأكيد إلغاء الاشتراك
    await sendWhatsAppTextMessage(
      phone,
      "تم إلغاء اشتراكك في رسائل المستشفى السعودي الألماني. لن تتلقى رسائل ترويجية بعد الآن.\n\nللاشتراك مجدداً، أرسل كلمة: مرحبا"
    );

    // TODO: تحديث حالة المريض في قاعدة البيانات (optedOut = true)
    console.log(`[WhatsApp Webhook] ✅ Opt-out confirmed for ${phone}`);
  } catch (error) {
    console.error("[WhatsApp Webhook] Error handling opt-out:", error);
  }
}

/**
 * معالجة تنبيهات الحساب (account_alerts)
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/components/account-alerts
 */
async function handleAccountAlert(alert: any) {
  const { type: alertType, details } = alert;
  console.warn(`[WhatsApp Webhook] ⚠️  Account Alert: ${alertType}`, details);

  // تنبيهات مهمة تستدعي تدخلاً فورياً
  if (alertType === "ACCOUNT_BANNED") {
    console.error("[WhatsApp Webhook] 🚨 CRITICAL: WhatsApp Business Account BANNED!");
  } else if (alertType === "PHONE_NUMBER_QUALITY_UPDATED") {
    console.warn("[WhatsApp Webhook] 📉 Phone number quality score updated:", details);
  }
}

// ─── Main Event Processor ──────────────────────────────────────────────────────

/**
 * معالجة أحداث Webhook الواردة من Meta
 * وفق: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/
 */
export async function processWebhookEvent(body: any) {
  try {
    // التحقق من أن الحدث من WhatsApp Business
    if (body.object !== "whatsapp_business_account") {
      console.warn("[WhatsApp Webhook] Unexpected object type:", body.object);
      return;
    }

    const { entry } = body;
    if (!entry || !Array.isArray(entry)) {
      console.warn("[WhatsApp Webhook] Invalid webhook body — missing entry");
      return;
    }

    for (const item of entry) {
      const { changes } = item;
      if (!changes || !Array.isArray(changes)) continue;

      for (const change of changes) {
        const { field, value } = change;

        if (!value) continue;

        switch (field) {
          case "messages": {
            const metadata = value.metadata;

            // ── الرسائل الواردة ──────────────────────────────────────────────
            if (value.messages) {
              for (const message of value.messages) {
                await handleIncomingMessage(message, metadata);
              }
            }

            // ── تحديثات حالة الرسائل ─────────────────────────────────────────
            if (value.statuses) {
              for (const status of value.statuses) {
                await handleMessageStatus(status);
              }
            }
            break;
          }

          case "message_template_status_update": {
            // ── تحديثات حالة القوالب (APPROVED, REJECTED, DISABLED...) ────────
            await handleTemplateStatusUpdate(value);
            break;
          }

          case "account_alerts": {
            // ── تنبيهات الحساب ────────────────────────────────────────────────
            if (value.account_alerts) {
              for (const alert of value.account_alerts) {
                await handleAccountAlert(alert);
              }
            }
            break;
          }

          case "phone_number_quality_update": {
            // ── تحديثات جودة رقم الهاتف ──────────────────────────────────────
            console.log("[WhatsApp Webhook] 📊 Phone number quality update:", value);
            break;
          }

          case "business_profile_update": {
            // ── تحديثات الملف التجاري ─────────────────────────────────────────
            console.log("[WhatsApp Webhook] 📋 Business profile update:", value);
            break;
          }

          case "security": {
            // ── تحديثات الأمان ─────────────────────────────────────────────────
            console.warn("[WhatsApp Webhook] 🔒 Security event:", value);
            break;
          }

          case "messaging_product": {
            // ── تحديثات منتج المراسلة ─────────────────────────────────────────
            console.log("[WhatsApp Webhook] 📱 Messaging product update:", value);
            break;
          }

          case "conversation": {
            // ── تحديثات المحادثات ─────────────────────────────────────────────
            console.log("[WhatsApp Webhook] 💬 Conversation update:", value);
            break;
          }

          case "template_event": {
            // ── أحداث القوالب (template_event) ─────────────────────────────────
            console.log("[WhatsApp Webhook] 📄 Template event:", value);
            break;
          }

          case "message_template_quality_update": {
            // ── تحديثات جودة القوالب ───────────────────────────────────────────
            console.log("[WhatsApp Webhook] 📈 Message template quality update:", value);
            break;
          }

          case "encrypted_phone_number_data": {
            // ── بيانات رقم الهاتف المشفر ─────────────────────────────────────
            console.log("[WhatsApp Webhook] 🔐 Encrypted phone number data:", value);
            break;
          }

          case "subscription_message_quality_update": {
            // ── تحديثات جودة رسائل الاشتراك ───────────────────────────────────
            console.log("[WhatsApp Webhook] 📊 Subscription message quality update:", value);
            break;
          }

          case "flows_update": {
            // ── تحديثات Flows ─────────────────────────────────────────────────
            console.log("[WhatsApp Webhook] 🔄 Flows update:", value);
            break;
          }

          case "flows_execution": {
            // ── تنفيذ Flows ────────────────────────────────────────────────────
            console.log("[WhatsApp Webhook] ⚡ Flows execution:", value);
            break;
          }

          case "phone_number_name_update": {
            // ── تحديثات اسم رقم الهاتف ───────────────────────────────────────
            console.log("[WhatsApp Webhook] 📛 Phone number name update:", value);
            break;
          }

          case "phone_number_code_verification": {
            // ── التحقق من رمز رقم الهاتف ─────────────────────────────────────
            console.log("[WhatsApp Webhook] ✅ Phone number code verification:", value);
            break;
          }

          default: {
            console.log(`[WhatsApp Webhook] Unhandled field: ${field}`, value);
          }
        }
      }
    }
  } catch (error) {
    console.error("[WhatsApp Webhook] Error processing webhook event:", error);
  }
}

// ─── Express Handler ───────────────────────────────────────────────────────────

/**
 * Express Middleware لمعالجة Webhook
 */
export function createWhatsAppWebhookHandler() {
  return async (req: Request, res: Response) => {
    // ── GET: التحقق من Webhook Token ──────────────────────────────────────────
    if (req.method === "GET") {
      verifyWebhookToken(req, res);
      return;
    }

    // ── POST: معالجة الأحداث ──────────────────────────────────────────────────
    if (req.method === "POST") {
      // ✅ التحقق من التوقيع قبل معالجة أي حدث
      if (!verifyWebhookSignature(req)) {
        console.error("[WhatsApp Webhook] ❌ Invalid signature — request rejected");
        res.status(403).json({ error: "Invalid signature" });
        return;
      }

      try {
        const body = req.body;
        console.log(`[WhatsApp Webhook] ✅ Received verified webhook event (object: ${body.object})`);

        // معالجة الحدث بشكل غير متزامن
        processWebhookEvent(body).catch((err) => {
          console.error("[WhatsApp Webhook] Async processing error:", err);
        });

        // ✅ الرد بـ 200 فوراً (وفق متطلبات Meta: يجب الرد خلال 20 ثانية)
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("[WhatsApp Webhook] Error:", error);
        // ✅ حتى في حالة الخطأ، يجب الرد بـ 200 لتجنب إعادة الإرسال من Meta
        res.status(200).json({ success: false, error: "Processing error" });
      }
    }
  };
}

export default createWhatsAppWebhookHandler;
