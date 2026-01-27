import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { appointments, offerLeads, campRegistrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * WhatsApp Webhook Router
 * يستقبل ردود المستخدمين على الأزرار التفاعلية من WhatsApp Business API
 */

// Webhook verification (Meta requirement)
const verifyWebhookSchema = z.object({
  "hub.mode": z.string(),
  "hub.verify_token": z.string(),
  "hub.challenge": z.string(),
});

// Button response schema
const buttonResponseSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          value: z.object({
            messaging_product: z.string(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }),
            messages: z
              .array(
                z.object({
                  from: z.string(),
                  id: z.string(),
                  timestamp: z.string(),
                  type: z.string(),
                  button: z
                    .object({
                      payload: z.string(),
                      text: z.string(),
                    })
                    .optional(),
                })
              )
              .optional(),
          }),
          field: z.string(),
        })
      ),
    })
  ),
});

export const webhooksRouter = router({
  /**
   * Webhook verification endpoint (GET)
   * Meta يستخدم هذا للتحقق من صحة الـ webhook
   */
  verify: publicProcedure
    .input(
      z.object({
        mode: z.string(),
        token: z.string(),
        challenge: z.string(),
      })
    )
    .query(({ input }) => {
      const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "sgh_crm_webhook_2024";

      if (input.mode === "subscribe" && input.token === VERIFY_TOKEN) {
        console.log("[Webhook] Verification successful");
        return { challenge: input.challenge };
      } else {
        console.error("[Webhook] Verification failed");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Verification token mismatch",
        });
      }
    }),

  /**
   * Webhook receiver endpoint (POST)
   * يستقبل ردود المستخدمين على الأزرار التفاعلية
   */
  receive: publicProcedure.input(buttonResponseSchema).mutation(async ({ input }) => {
    try {
      console.log("[Webhook] Received:", JSON.stringify(input, null, 2));

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // معالجة كل entry
      for (const entry of input.entry) {
        for (const change of entry.changes) {
          const messages = change.value.messages;
          if (!messages || messages.length === 0) continue;

          for (const message of messages) {
            if (message.type === "button" && message.button) {
              const payload = message.button.payload;
              const userPhone = message.from;

              console.log(`[Webhook] Button clicked: ${payload} from ${userPhone}`);

              // تحليل الـ payload لمعرفة نوع الحجز والإجراء
              // Format: CONFIRM_APPOINTMENT_123 أو CANCEL_APPOINTMENT_123
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

              // تحديث الحالة حسب نوع الحجز
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

              // TODO: إرسال رسالة تأكيد للمستخدم بعد تحديث الحالة
            }
          }
        }
      }

      return { success: true, message: "Webhook processed successfully" };
    } catch (error) {
      console.error("[Webhook] Error processing webhook:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to process webhook",
      });
    }
  }),
});
