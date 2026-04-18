/**
 * WhatsApp Security & Compliance Service
 * خدمة الأمان والامتثال لـ WhatsApp
 *
 * ✅ إدارة الأرقام المحظورة في قاعدة البيانات
 * ✅ معالجة طلبات إلغاء الاشتراك (opt-out)
 * ✅ التحقق من امتثال الرسائل لمعايير Meta
 * ✅ تشفير البيانات الحساسة
 */

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { whatsappBlockedNumbers } from "../../drizzle/schema";

// ── التحقق من حظر الرقم ──────────────────────────────────────────────────────
export async function isPhoneBlocked(phone: string): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    const result = await db
      .select()
      .from(whatsappBlockedNumbers)
      .where(eq(whatsappBlockedNumbers.phone, phone))
      .limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}

// ── حظر رقم ──────────────────────────────────────────────────────────────────
export async function blockPhone(params: {
  phone: string;
  reason?: string;
  blockedBy?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    // التحقق من عدم وجود الرقم مسبقاً
    const existing = await db
      .select()
      .from(whatsappBlockedNumbers)
      .where(eq(whatsappBlockedNumbers.phone, params.phone))
      .limit(1);

    if (existing.length > 0) {
      return { success: true }; // مسبقاً محظور
    }

    await db.insert(whatsappBlockedNumbers).values({
      phone: params.phone,
      reason: params.reason || "manual",
      blockedBy: params.blockedBy,
    });

    console.log(`[WhatsApp Security] Blocked phone ${params.phone}`);
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to block phone:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── إلغاء حظر رقم ────────────────────────────────────────────────────────────
export async function unblockPhone(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    await db.delete(whatsappBlockedNumbers).where(eq(whatsappBlockedNumbers.phone, phone));

    console.log(`[WhatsApp Security] Unblocked phone ${phone}`);
    return { success: true };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to unblock phone:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── جلب قائمة الأرقام المحظورة ───────────────────────────────────────────────
export async function getBlockedPhones(): Promise<{
  success: boolean;
  phones?: any[];
  total?: number;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    const phones = await db.select().from(whatsappBlockedNumbers).orderBy(whatsappBlockedNumbers.createdAt);

    return { success: true, phones, total: phones.length };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to get blocked phones:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── معالجة طلب إلغاء الاشتراك (opt-out) ─────────────────────────────────────
export async function handleOptOutRequest(params: {
  phone: string;
  reason?: string;
  blockedBy?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await blockPhone({
      phone: params.phone,
      reason: params.reason || "opt_out - طلب العميل إيقاف الرسائل",
      blockedBy: params.blockedBy,
    });
  } catch (error) {
    console.error("[WhatsApp Security] Failed to handle opt-out:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── إحصائيات الأمان ───────────────────────────────────────────────────────────
export async function getSecurityStats(): Promise<{
  success: boolean;
  stats?: {
    blockedPhones: number;
    optOutCount: number;
    manualBlockCount: number;
  };
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "قاعدة البيانات غير متاحة" };

    const all = await db.select().from(whatsappBlockedNumbers);

    const stats = {
      blockedPhones: all.length,
      optOutCount: all.filter(p => p.reason?.includes("opt_out")).length,
      manualBlockCount: all.filter(p => !p.reason?.includes("opt_out")).length,
    };

    return { success: true, stats };
  } catch (error) {
    console.error("[WhatsApp Security] Failed to get stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "خطأ غير معروف" };
  }
}

// ── تشفير البيانات الحساسة ────────────────────────────────────────────────────
export function encryptSensitiveData(data: string, encryptionKey?: string): string {
  try {
    const key = encryptionKey || process.env.ENCRYPTION_KEY || "sgh-default-key-change-in-prod";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0").substring(0, 32)), iv);
    let encrypted = cipher.update(data, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch {
    return data;
  }
}

export function decryptSensitiveData(encryptedData: string, encryptionKey?: string): string {
  try {
    const key = encryptionKey || process.env.ENCRYPTION_KEY || "sgh-default-key-change-in-prod";
    const parts = encryptedData.split(":");
    if (parts.length !== 2) return encryptedData;
    const iv = Buffer.from(parts[0], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key.padEnd(32, "0").substring(0, 32)), iv);
    let decrypted = decipher.update(parts[1], "hex", "utf-8");
    decrypted += decipher.final("utf-8");
    return decrypted;
  } catch {
    return encryptedData;
  }
}

// ── التحقق من امتثال الرسالة لمعايير Meta ────────────────────────────────────
export async function validateMetaCompliance(message: string): Promise<{
  success: boolean;
  compliant: boolean;
  issues?: string[];
}> {
  const issues: string[] = [];

  if (message.length > 4096) {
    issues.push("الرسالة تتجاوز الحد الأقصى 4096 حرف");
  }

  const urlCount = (message.match(/https?:\/\//g) || []).length;
  if (urlCount > 3) {
    issues.push("الرسالة تحتوي على عدد كبير من الروابط");
  }

  return {
    success: true,
    compliant: issues.length === 0,
    issues: issues.length > 0 ? issues : undefined,
  };
}
