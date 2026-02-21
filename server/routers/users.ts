import { z } from "zod";
import { eq } from "drizzle-orm";
import { users } from "../../drizzle/schema";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

const userInputSchema = z.object({
  username: z.string().min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").optional(),
  name: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional(),
  role: z.enum(["user", "admin", "manager", "staff", "viewer"]).default("user"),
  isActive: z.enum(["yes", "no"]).default("yes"),
});

// Admin-only procedure for user management
const adminOnlyProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'يجب أن تكون مسؤولاً للوصول إلى هذه الميزة' 
    });
  }
  return next({ ctx });
});

export const usersRouter = router({
  // Get active users list (for task assignment)
  getActiveUsers: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const activeUsers = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
    }).from(users).where(eq(users.isActive, "yes"));
    
    return activeUsers;
  }),

  // Get all users (admin only)
  getAll: adminOnlyProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    }).from(users);
    
    return allUsers;
  }),

  // Get user by ID (admin only)
  getById: adminOnlyProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const user = await db.select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        loginMethod: users.loginMethod,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users).where(eq(users.id, input.id)).limit(1);
      
      if (user.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      }
      
      return user[0];
    }),

  // Create new user (admin only)
  create: adminOnlyProcedure
    .input(userInputSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if username already exists
      const existingUser = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
      if (existingUser.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "اسم المستخدم موجود بالفعل" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(input.password || "123456", 10);
      
      await db.insert(users).values({
        username: input.username,
        password: hashedPassword,
        name: input.name,
        email: input.email,
        role: input.role,
        isActive: input.isActive,
        loginMethod: "manual",
      });
      
      return { success: true };
    }),

  // Update user (admin only)
  update: adminOnlyProcedure
    .input(z.object({
      id: z.number(),
      ...userInputSchema.partial().shape,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, password, ...data } = input;
      
      // Prevent user from changing their own role or status
      if (id === ctx.user.id && (data.role || data.isActive)) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "لا يمكنك تغيير دورك أو حالتك الخاصة" 
        });
      }
      
      const updateData: any = { ...data };
      
      // Hash password if provided
      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }
      
      await db.update(users)
        .set(updateData)
        .where(eq(users.id, id));
      
      return { success: true };
    }),

  // Delete user (admin only)
  delete: adminOnlyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Prevent user from deleting themselves
      if (input.id === ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "لا يمكنك حذف حسابك الخاص" 
        });
      }
      
      await db.delete(users).where(eq(users.id, input.id));
      
      return { success: true };
    }),

  // Toggle user active status (admin only)
  toggleActive: adminOnlyProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Prevent user from deactivating themselves
      if (input.id === ctx.user.id) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "لا يمكنك تعطيل حسابك الخاص" 
        });
      }
      
      const user = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (user.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      }
      
      const newStatus = user[0].isActive === "yes" ? "no" : "yes";
      
      await db.update(users)
        .set({ isActive: newStatus })
        .where(eq(users.id, input.id));
      
      return { success: true, newStatus };
    }),
});
