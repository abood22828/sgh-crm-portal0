import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createFollowUpTask,
  getFollowUpTasksByEntity,
  getFollowUpTaskCount,
  updateFollowUpTaskStatus,
  deleteFollowUpTask,
} from "../followUpTasks";

export const followUpTasksRouter = router({
  // Get tasks for a specific entity
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getFollowUpTasksByEntity(input.entityType, input.entityId);
    }),

  // Get task count for a specific entity
  getCount: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getFollowUpTaskCount(input.entityType, input.entityId);
    }),

  // Create a new task
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]).default("medium"),
        dueDate: z.string().optional(), // ISO date string
        assignedToId: z.number().optional(),
        assignedToName: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createFollowUpTask({
        entityType: input.entityType,
        entityId: input.entityId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        assignedToId: input.assignedToId,
        assignedToName: input.assignedToName,
        createdById: ctx.user.id,
        createdByName: ctx.user.name || ctx.user.username,
        status: "pending",
      });
      
      return { success: true };
    }),

  // Update task status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await updateFollowUpTaskStatus(
        input.id,
        input.status,
        ctx.user.id,
        ctx.user.name || ctx.user.username
      );
      
      return { success: true };
    }),

  // Delete a task
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteFollowUpTask(input.id);
      return { success: true };
    }),
});
