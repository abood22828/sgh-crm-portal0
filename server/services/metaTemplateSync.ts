import { getDb } from "../db";
import { whatsappTemplates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const META_GRAPH_API_VERSION = "v18.0";
const META_API_BASE = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;

interface MetaTemplate {
  name: string;
  status: string;
  category: string;
  language: string;
  components?: Array<{
    type: string;
    format?: string;
    text?: string;
    buttons?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  failed?: number;
  errors?: string[];
}

/**
 * جلب جميع القوالب من Meta
 */
export async function fetchTemplatesFromMeta(
  phoneNumberId: string,
  accessToken: string
): Promise<SyncResult> {
  try {
    const response = await fetch(
      `${META_API_BASE}/${phoneNumberId}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `فشل جلب القوالب من Meta: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { data: MetaTemplate[] };
    const templates = data.data || [];

    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: "لا يمكن الاتصال بقاعدة البيانات",
      };
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const template of templates) {
      try {
        // استخراج محتوى الرسالة
        let content = "";
        let variables: string[] = [];

        if (template.components) {
          for (const component of template.components) {
            if (component.type === "BODY" && component.text) {
              content = component.text;
              // استخراج المتغيرات من النص
              const matches = component.text.match(/{{(\d+)}}/g) || [];
              variables = matches.map((m) => m.replace(/[{}]/g, ""));
            }
          }
        }

        // تحديث أو إدراج القالب
        const existing = await db
          .select()
          .from(whatsappTemplates)
          .where(eq(whatsappTemplates.metaName, template.name))
          .limit(1);

        if (existing.length > 0) {
          // تحديث
          await db
            .update(whatsappTemplates)
            .set({
              metaStatus: template.status,
              metaCategory: template.category,
              content,
              variables: JSON.stringify(variables),
              languageCode: template.language,
              updatedAt: new Date(),
            })
            .where(eq(whatsappTemplates.metaName, template.name));
        } else {
          // إدراج جديد
          await db.insert(whatsappTemplates).values({
            name: template.name,
            metaName: template.name,
            metaStatus: template.status,
            metaCategory: template.category,
            languageCode: template.language,
            category: "custom",
            content,
            variables: JSON.stringify(variables),
            createdBy: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        synced++;
      } catch (error) {
        failed++;
        errors.push(
          `فشل معالجة القالب ${template.name}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`
        );
      }
    }

    return {
      success: true,
      message: `تم مزامنة ${synced} قالب بنجاح`,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في جلب القوالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * دفع قالب جديد إلى Meta
 */
export async function pushTemplateToMeta(
  phoneNumberId: string,
  accessToken: string,
  templateName: string,
  content: string,
  category: string = "MARKETING",
  language: string = "ar"
): Promise<SyncResult> {
  try {
    // بناء مكونات القالب
    const components = [
      {
        type: "BODY",
        text: content,
      },
    ];

    const response = await fetch(
      `${META_API_BASE}/${phoneNumberId}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          language,
          category,
          components,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `فشل دفع القالب: ${JSON.stringify(errorData)}`,
      };
    }

    const data = (await response.json()) as { id: string };

    // تحديث حالة القالب في قاعدة البيانات
    const db = await getDb();
    if (db) {
      await db
        .update(whatsappTemplates)
        .set({
          metaStatus: "PENDING_APPROVAL",
          updatedAt: new Date(),
        })
        .where(eq(whatsappTemplates.name, templateName));
    }

    return {
      success: true,
      message: `تم دفع القالب ${templateName} بنجاح. معرف Meta: ${data.id}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في دفع القالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * التحقق من حالة قالب معين
 */
export async function checkTemplateStatus(
  phoneNumberId: string,
  accessToken: string,
  templateId: string
): Promise<{
  success: boolean;
  status?: string;
  message: string;
}> {
  try {
    const response = await fetch(`${META_API_BASE}/${templateId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: `فشل التحقق من حالة القالب: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as { status: string };

    return {
      success: true,
      status: data.status,
      message: `حالة القالب: ${data.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في التحقق من الحالة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * حذف قالب من Meta
 */
export async function deleteTemplateFromMeta(
  phoneNumberId: string,
  accessToken: string,
  templateName: string
): Promise<SyncResult> {
  try {
    const response = await fetch(
      `${META_API_BASE}/${phoneNumberId}/message_templates?name=${templateName}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `فشل حذف القالب: ${response.statusText}`,
      };
    }

    // حذف من قاعدة البيانات
    const db = await getDb();
    if (db) {
      await db
        .delete(whatsappTemplates)
        .where(eq(whatsappTemplates.metaName, templateName));
    }

    return {
      success: true,
      message: `تم حذف القالب ${templateName} بنجاح`,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في حذف القالب: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}

/**
 * مزامنة شاملة للقوالب
 */
export async function syncTemplatesCompletely(
  phoneNumberId: string,
  accessToken: string
): Promise<SyncResult> {
  try {
    // أولاً: جلب جميع القوالب من Meta
    const fetchResult = await fetchTemplatesFromMeta(
      phoneNumberId,
      accessToken
    );

    if (!fetchResult.success) {
      return fetchResult;
    }

    // ثانياً: التحقق من القوالب المعتمدة
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: "لا يمكن الاتصال بقاعدة البيانات",
      };
    }

    const approvedTemplates = await db
      .select()
      .from(whatsappTemplates)
      .where(eq(whatsappTemplates.metaStatus, "APPROVED"));

    return {
      success: true,
      message: `تمت المزامنة بنجاح. ${approvedTemplates.length} قالب معتمد جاهز للاستخدام`,
      synced: fetchResult.synced,
    };
  } catch (error) {
    return {
      success: false,
      message: `خطأ في المزامنة الشاملة: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
    };
  }
}
