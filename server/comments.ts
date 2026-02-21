import { eq, and, desc } from "drizzle-orm";
import { comments, type InsertComment } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get comments for a specific entity
 */
export async function getCommentsByEntity(
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration",
  entityId: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get comments: database not available");
    return [];
  }

  try {
    const result = await db
      .select()
      .from(comments)
      .where(and(eq(comments.entityType, entityType), eq(comments.entityId, entityId)))
      .orderBy(desc(comments.createdAt));

    return result;
  } catch (error) {
    console.error("[Database] Failed to get comments:", error);
    return [];
  }
}

/**
 * Add a new comment
 */
export async function addComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const [result] = await db.insert(comments).values(comment);
    return result;
  } catch (error) {
    console.error("[Database] Failed to add comment:", error);
    throw error;
  }
}

/**
 * Delete a comment (only by the author or admin)
 */
export async function deleteComment(commentId: number, userId: number, isAdmin: boolean = false) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // First, check if the comment exists and belongs to the user
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);

    if (!comment) {
      throw new Error("Comment not found");
    }

    // Only allow deletion if user is the author or admin
    if (comment.userId !== userId && !isAdmin) {
      throw new Error("Unauthorized to delete this comment");
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete comment:", error);
    throw error;
  }
}

/**
 * Get comment count for an entity
 */
export async function getCommentCount(
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration",
  entityId: number
): Promise<number> {
  const db = await getDb();
  if (!db) {
    return 0;
  }

  try {
    const result = await db
      .select()
      .from(comments)
      .where(and(eq(comments.entityType, entityType), eq(comments.entityId, entityId)));

    return result.length;
  } catch (error) {
    console.error("[Database] Failed to get comment count:", error);
    return 0;
  }
}
