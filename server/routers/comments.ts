import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getCommentsByEntity, addComment, deleteComment, getCommentCount } from "../comments";

export const commentsRouter = router({
  /**
   * Get all comments for a specific entity
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCommentsByEntity(input.entityType, input.entityId);
    }),

  /**
   * Add a new comment
   */
  add: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
        content: z.string().min(1, "التعليق لا يمكن أن يكون فارغاً"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = {
        entityType: input.entityType,
        entityId: input.entityId,
        content: input.content,
        userId: ctx.user.id,
        userName: ctx.user.name || ctx.user.username || "مستخدم",
      };

      return await addComment(comment);
    }),

  /**
   * Delete a comment
   */
  delete: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const isAdmin = ctx.user.role === "admin";
      return await deleteComment(input.commentId, ctx.user.id, isAdmin);
    }),

  /**
   * Get comment count for an entity
   */
  getCount: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["appointment", "lead", "offerLead", "campRegistration"]),
        entityId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await getCommentCount(input.entityType, input.entityId);
    }),
});
