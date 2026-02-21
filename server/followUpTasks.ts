import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { followUpTasks, InsertFollowUpTask } from "../drizzle/schema";

export async function createFollowUpTask(task: InsertFollowUpTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(followUpTasks).values(task);
  return result;
}

export async function getFollowUpTasksByEntity(
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration",
  entityId: number
) {
  const db = await getDb();
  if (!db) return [];
  
  const tasks = await db
    .select()
    .from(followUpTasks)
    .where(
      and(
        eq(followUpTasks.entityType, entityType),
        eq(followUpTasks.entityId, entityId)
      )
    )
    .orderBy(desc(followUpTasks.createdAt));
  
  return tasks;
}

export async function getFollowUpTaskCount(
  entityType: "appointment" | "lead" | "offerLead" | "campRegistration",
  entityId: number
) {
  const db = await getDb();
  if (!db) return 0;
  
  const tasks = await db
    .select()
    .from(followUpTasks)
    .where(
      and(
        eq(followUpTasks.entityType, entityType),
        eq(followUpTasks.entityId, entityId)
      )
    );
  
  return tasks.length;
}

export async function updateFollowUpTaskStatus(
  taskId: number,
  status: "pending" | "in_progress" | "completed" | "cancelled",
  completedById?: number,
  completedByName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === "completed") {
    updateData.completedAt = new Date();
    if (completedById) updateData.completedById = completedById;
    if (completedByName) updateData.completedByName = completedByName;
  }
  
  await db
    .update(followUpTasks)
    .set(updateData)
    .where(eq(followUpTasks.id, taskId));
}

export async function deleteFollowUpTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(followUpTasks).where(eq(followUpTasks.id, taskId));
}
