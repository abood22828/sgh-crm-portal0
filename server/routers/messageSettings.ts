import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";

export const messageSettingsRouter = router({
  // Get all message settings
  list: protectedProcedure.query(async () => {
    return await db.getAllMessageSettings();
  }),

  // Get message settings by category
  listByCategory: protectedProcedure
    .input(z.object({
      category: z.enum(["patient_journey", "executive_reports", "task_management", "doctor_notifications"]),
    }))
    .query(async ({ input }) => {
      return await db.getMessageSettingsByCategory(input.category);
    }),

  // Get a single message setting by type
  getByType: protectedProcedure
    .input(z.object({
      messageType: z.string(),
    }))
    .query(async ({ input }) => {
      return await db.getMessageSettingByType(input.messageType);
    }),

  // Update message setting
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      displayName: z.string().optional(),
      messageContent: z.string().optional(),
      isEnabled: z.number().min(0).max(1).optional(),
      deliveryChannel: z.enum(["whatsapp_api", "whatsapp_integration", "both"]).optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return await db.updateMessageSetting(input);
    }),

  // Toggle message enabled/disabled
  toggleEnabled: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      return await db.toggleMessageSettingEnabled(input.id);
    }),

  // Get enabled message setting by type (for sending messages)
  getEnabledByType: protectedProcedure
    .input(z.object({
      messageType: z.string(),
    }))
    .query(async ({ input }) => {
      const setting = await db.getMessageSettingByType(input.messageType);
      if (!setting || setting.isEnabled === 0) {
        return null;
      }
      return setting;
    }),
});
