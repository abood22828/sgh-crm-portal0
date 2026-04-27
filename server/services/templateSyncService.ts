/**
 * Template Sync Service
 * خدمة مزامنة حالة القوالب مع Meta API
 */

import { meta } from "../MetaApiService";
import { getDb } from "../db";
import { messageTemplates, whatsappTemplates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * مزامنة حالة قوالب messageTemplates مع Meta
 */
export async function syncMessageTemplatesStatus(phoneNumberId: string): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // الحصول على WABA ID من Phone Number ID
    const wabaResult = await meta.getWabaIdFromPhoneNumberId(phoneNumberId);
    if (!wabaResult.success) {
      throw new Error(`Failed to get WABA ID: ${wabaResult.error}`);
    }

    // جلب القوالب من Meta
    const templatesResult = await meta.getWhatsAppTemplates(wabaResult.wabaId!);
    if (!templatesResult.success) {
      throw new Error(`Failed to fetch templates from Meta: ${templatesResult.error}`);
    }

    const metaTemplates = templatesResult.templates || [];
    console.log(`[Template Sync] Fetched ${metaTemplates.length} templates from Meta`);

    // إنشاء خريطة للقوالب من Meta
    const metaTemplateMap = new Map(
      metaTemplates.map((t: any) => [t.name, t])
    );

    // جلب القوالب من قاعدة البيانات
    const dbTemplates = await db.select().from(messageTemplates);
    console.log(`[Template Sync] Found ${dbTemplates.length} templates in database`);

    // تحديث حالة كل قالب
    for (const dbTemplate of dbTemplates) {
      const metaTemplate = metaTemplateMap.get(dbTemplate.templateName);

      if (!metaTemplate) {
        console.warn(`[Template Sync] Template "${dbTemplate.templateName}" not found in Meta`);
        errors.push(`Template "${dbTemplate.templateName}" not found in Meta`);
        continue;
      }

      // تحديث الحالة إذا تغيرت
      if (metaTemplate.status !== dbTemplate.status) {
        console.log(`[Template Sync] Updating status of "${dbTemplate.templateName}" from ${dbTemplate.status} to ${metaTemplate.status}`);
        
        await db.update(messageTemplates)
          .set({
            status: metaTemplate.status,
            metaTemplateId: metaTemplate.id,
            updatedAt: new Date(),
          })
          .where(eq(messageTemplates.id, dbTemplate.id));
        
        synced++;
      }

      // تحديث معرف القالب من Meta إذا لم يكن موجوداً
      if (!dbTemplate.metaTemplateId && metaTemplate.id) {
        await db.update(messageTemplates)
          .set({
            metaTemplateId: metaTemplate.id,
            updatedAt: new Date(),
          })
          .where(eq(messageTemplates.id, dbTemplate.id));
        
        synced++;
      }
    }

    console.log(`[Template Sync] Synced ${synced} templates`);
    return { success: true, synced, errors };
  } catch (error: any) {
    console.error("[Template Sync] Failed:", error);
    return { success: false, synced, errors: [error.message] };
  }
}

/**
 * مزامنة حالة قوالب whatsappTemplates مع Meta
 */
export async function syncWhatsAppTemplatesStatus(phoneNumberId: string): Promise<{
  success: boolean;
  synced: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // الحصول على WABA ID من Phone Number ID
    const wabaResult = await meta.getWabaIdFromPhoneNumberId(phoneNumberId);
    if (!wabaResult.success) {
      throw new Error(`Failed to get WABA ID: ${wabaResult.error}`);
    }

    // جلب القوالب من Meta
    const templatesResult = await meta.getWhatsAppTemplates(wabaResult.wabaId!);
    if (!templatesResult.success) {
      throw new Error(`Failed to fetch templates from Meta: ${templatesResult.error}`);
    }

    const metaTemplates = templatesResult.templates || [];
    console.log(`[Template Sync] Fetched ${metaTemplates.length} templates from Meta`);

    // إنشاء خريطة للقوالب من Meta
    const metaTemplateMap = new Map(
      metaTemplates.map((t: any) => [t.name, t])
    );

    // جلب القوالب من قاعدة البيانات
    const dbTemplates = await db.select().from(whatsappTemplates);
    console.log(`[Template Sync] Found ${dbTemplates.length} templates in database`);

    // تحديث حالة كل قالب
    for (const dbTemplate of dbTemplates) {
      const metaName = dbTemplate.metaName || dbTemplate.name;
      const metaTemplate = metaTemplateMap.get(metaName);

      if (!metaTemplate) {
        console.warn(`[Template Sync] Template "${metaName}" not found in Meta`);
        errors.push(`Template "${metaName}" not found in Meta`);
        continue;
      }

      // تحديث الحالة إذا تغيرت
      if (metaTemplate.status !== dbTemplate.metaStatus) {
        console.log(`[Template Sync] Updating status of "${metaName}" from ${dbTemplate.metaStatus} to ${metaTemplate.status}`);
        
        await db.update(whatsappTemplates)
          .set({
            metaStatus: metaTemplate.status,
            metaTemplateId: metaTemplate.id,
            updatedAt: new Date(),
          })
          .where(eq(whatsappTemplates.id, dbTemplate.id));
        
        synced++;
      }

      // تحديث معرف القالب من Meta إذا لم يكن موجوداً
      if (!dbTemplate.metaTemplateId && metaTemplate.id) {
        await db.update(whatsappTemplates)
          .set({
            metaTemplateId: metaTemplate.id,
            updatedAt: new Date(),
          })
          .where(eq(whatsappTemplates.id, dbTemplate.id));
        
        synced++;
      }
    }

    console.log(`[Template Sync] Synced ${synced} templates`);
    return { success: true, synced, errors };
  } catch (error: any) {
    console.error("[Template Sync] Failed:", error);
    return { success: false, synced, errors: [error.message] };
  }
}

/**
 * مزامنة جميع القوالب (كلا الجدولين)
 */
export async function syncAllTemplates(phoneNumberId: string): Promise<{
  success: boolean;
  messageTemplates: { synced: number; errors: string[] };
  whatsappTemplates: { synced: number; errors: string[] };
}> {
  console.log("[Template Sync] Starting full template sync...");

  const messageResult = await syncMessageTemplatesStatus(phoneNumberId);
  const whatsappResult = await syncWhatsAppTemplatesStatus(phoneNumberId);

  return {
    success: messageResult.success && whatsappResult.success,
    messageTemplates: { synced: messageResult.synced, errors: messageResult.errors },
    whatsappTemplates: { synced: whatsappResult.synced, errors: whatsappResult.errors },
  };
}
