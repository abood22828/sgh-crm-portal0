/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                         MetaApiService — خدمة Meta المركزية                ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  القاعدة المعمارية الأساسية:                                                ║
 * ║  جميع طلبات Meta Graph API (WhatsApp, Instagram, Facebook Pages,            ║
 * ║  Messenger, Ads Management, CAPI, ...) تمر عبر هذه الخدمة حصراً.           ║
 * ║                                                                              ║
 * ║  التوكن المُستخدم: META_ACCESS_TOKEN (من .env)                              ║
 * ║  لا يُسمح بإنشاء متغيرات توكن إضافية (IG_TOKEN, FB_TOKEN, ...).            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * الاستخدام:
 *   import { meta } from './MetaApiService';
 *
 *   // GET
 *   const data = await meta.get('me', { fields: 'name,email' });
 *
 *   // POST
 *   const result = await meta.post(`${phoneId}/messages`, payload);
 *
 *   // وصول مباشر للتوكن (للحالات الاستثنائية فقط)
 *   const token = meta.accessToken;
 */

/** نسخة Graph API الافتراضية لجميع الخدمات */
const GRAPH_API_VERSION = "v23.0"; // ✅ محدَّث وفق وثائق Meta الرسمية (ديسمبر 2025)
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface MetaApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    type: string;
    code: number;
    fbtrace_id?: string;
  };
  /** HTTP status code */
  status: number;
  /** true if HTTP 2xx and no error field */
  ok: boolean;
}

class MetaApiService {
  /**
   * التوكن الموحد — يُقرأ من process.env.META_ACCESS_TOKEN في كل استدعاء
   * لضمان التقاط أي تحديث للمتغير دون إعادة تشغيل الخادم.
   */
  get accessToken(): string {
    return process.env.META_ACCESS_TOKEN ?? "";
  }

  /** التحقق من وجود التوكن قبل أي طلب */
  private assertToken(): void {
    if (!this.accessToken) {
      throw new Error(
        "[MetaApiService] META_ACCESS_TOKEN غير مُعيَّن في متغيرات البيئة. " +
        "أضف التوكن في ملف .env أو إعدادات المنصة."
      );
    }
  }

  /**
   * بناء URL كامل بدون access_token (يُرسَل عبر Authorization header)
   */
  buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${GRAPH_API_BASE}/${endpoint.replace(/^\//, "")}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /**
   * طلب GET عام — يستخدم Authorization: Bearer header حصراً
   * @param endpoint  مسار نقطة النهاية (مثل: "me", "123456/messages")
   * @param params    معاملات query string إضافية
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<MetaApiResponse<T>> {
    this.assertToken();
    const url = this.buildUrl(endpoint, params);
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`,
        },
      });
      const body = await res.json();
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] GET ${endpoint} failed:`, msg);
      return { error: { message: msg, type: "NetworkError", code: 0 }, status: 0, ok: false };
    }
  }

  /**
   * طلب POST عام (JSON body)
   * @param endpoint  مسار نقطة النهاية
   * @param payload   البيانات المُرسَلة في body
   */
  async post<T = any>(
    endpoint: string,
    payload: Record<string, any> = {}
  ): Promise<MetaApiResponse<T>> {
    this.assertToken();
    const url = `${GRAPH_API_BASE}/${endpoint.replace(/^\//, "")}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] POST ${endpoint} failed:`, msg);
      return { error: { message: msg, type: "NetworkError", code: 0 }, status: 0, ok: false };
    }
  }

  /**
   * طلب DELETE عام
   */
  async delete<T = any>(endpoint: string): Promise<MetaApiResponse<T>> {
    this.assertToken();
    const url = this.buildUrl(endpoint);
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const body = await res.json();
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] DELETE ${endpoint} failed:`, msg);
      return { error: { message: msg, type: "NetworkError", code: 0 }, status: 0, ok: false };
    }
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── WhatsApp Cloud API helpers ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  /** إرسال رسالة نصية عبر WhatsApp Cloud API */
  async sendWhatsAppText(
    phoneNumberId: string,
    to: string,
    text: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const res = await this.post(`${phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    });
    if (!res.ok) {
      const errMsg = this._formatMetaError(res.error);
      console.error(`[MetaApiService] sendWhatsAppText failed:`, JSON.stringify(res.error));
      return { success: false, error: errMsg };
    }
    return { success: true, messageId: res.data?.messages?.[0]?.id };
  }

  /** إرسال رسالة قالب عبر WhatsApp Cloud API */
  async sendWhatsAppTemplate(
    phoneNumberId: string,
    to: string,
    templateName: string,
    languageCode: string,
    components: any[] = []
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: { name: templateName, language: { code: languageCode } },
    };
    if (components.length > 0) payload.template.components = components;

    console.log(`[MetaApiService] Sending template "${templateName}" (lang: ${languageCode}) to ${to}`);
    const res = await this.post(`${phoneNumberId}/messages`, payload);
    if (!res.ok) {
      const errMsg = this._formatMetaError(res.error);
      console.error(`[MetaApiService] sendWhatsAppTemplate failed:`, JSON.stringify(res.error));
      return { success: false, error: errMsg };
    }
    return { success: true, messageId: res.data?.messages?.[0]?.id };
  }

  /**
   * تحويل خطأ Meta API إلى رسالة واضحة للمستخدم
   * وفق وثائق Meta الرسمية: https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes
   */
  private _formatMetaError(error: any): string {
    if (!error) return "خطأ غير معروف";
    const code = error.code || 0;
    const metaErrors: Record<number, string> = {
      // Auth
      190: "انتهت صلاحية توكن الوصول أو تم إلغاؤه",
      // WhatsApp Business
      131000: "خطأ في المعاملات — تحقق من صحة البيانات المُرسَلة",
      131005: "ليس لديك صلاحية إرسال هذا النوع من الرسائل",
      131008: "معامل مطلوب مفقود في الطلب",
      131009: "قيمة معامل غير صحيحة",
      131016: "الخدمة غير متاحة مؤقتاً، حاول مرة أخرى",
      131021: "لا يمكن إرسال رسالة لنفس الرقم",
      131026: "لا يمكن تسليم الرسالة — الرقم غير مسجل في واتساب أو محظور",
      131042: "مشكلة في طريقة الدفع لحساب واتساب للأعمال",
      131047: "انتهت نافذة 24 ساعة — يجب إرسال قالب معتمد من Meta",
      131051: "نوع الرسالة غير مدعوم",
      132000: "عدد متغيرات القالب لا يتطابق مع ما هو معرّف في Meta",
      132001: "القالب غير موجود أو غير معتمد من Meta — تحقق من الاسم واللغة",
      132005: "نص القالب بعد تعبئة المتغيرات طويل جداً",
      132007: "محتوى القالب يخالف سياسة Meta",
      132012: "تنسيق متغيرات القالب غير صحيح",
      132015: "القالب متوقف مؤقتاً بسبب جودة منخفضة",
      132016: "القالب معطّل نهائياً بسبب جودة منخفضة",
    };
    if (metaErrors[code]) {
      return `${metaErrors[code]} (كود الخطأ: ${code})`;
    }
    return error.message || `خطأ من Meta API (كود: ${code})`;
  }

  /** جلب قوالب WhatsApp من WABA */
  async getWhatsAppTemplates(
    wabaId: string,
    limit = 100
  ): Promise<{ success: boolean; templates?: any[]; error?: string }> {
    const res = await this.get(`${wabaId}/message_templates`, {
      fields: "name,status,category,language,components",
      limit: String(limit),
    });
    if (!res.ok) {
      return { success: false, error: res.error?.message ?? "خطأ غير معروف" };
    }
    return { success: true, templates: res.data?.data ?? [] };
  }

  /** الحصول على WABA ID من Phone Number ID */
  async getWabaIdFromPhoneNumberId(
    phoneNumberId: string
  ): Promise<{ success: boolean; wabaId?: string; error?: string }> {
    const res = await this.get(`${phoneNumberId}`, {
      fields: "whatsapp_business_account",
    });
    if (!res.ok) {
      return { success: false, error: res.error?.message ?? "خطأ غير معروف" };
    }
    const wabaId = res.data?.whatsapp_business_account?.id;
    if (!wabaId) {
      return { success: false, error: "لم يتم العثور على WABA ID" };
    }
    return { success: true, wabaId };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Instagram Graph API helpers ───────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  /** جلب إحصائيات حساب Instagram Business */
  async getInstagramProfile(accountId: string) {
    return this.get(accountId, {
      fields: "followers_count,follows_count,media_count,profile_picture_url",
    });
  }

  async getInstagramInsights(accountId: string, period = "days_28") {
    return this.get(`${accountId}/insights`, {
      metric: "reach,impressions,profile_views",
      period,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Facebook Pages helpers ────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  /** جلب بيانات صفحة Facebook */
  async getFacebookPage(pageId: string) {
    return this.get(pageId, { fields: "fan_count,name,picture" });
  }

  async getFacebookPageInsights(pageId: string, period = "days_28") {
    return this.get(`${pageId}/insights`, {
      metric: "page_views_total,page_engaged_users,page_impressions,page_post_engagements,page_impressions_organic",
      period,
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ── Facebook Conversions API (CAPI) helpers ───────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════════

  /** إرسال حدث تحويل إلى Meta CAPI */
  async sendCAPIEvent(
    pixelId: string,
    events: any[],
    testEventCode?: string
  ): Promise<{ success: boolean; error?: string }> {
    const payload: any = { data: events };
    if (testEventCode) payload.test_event_code = testEventCode;

    const res = await this.post(`${pixelId}/events`, payload);
    if (!res.ok) {
      return { success: false, error: res.error?.message ?? "خطأ غير معروف" };
    }
    return { success: true };
  }
}

/**
 * Instance وحيد (Singleton) يُستخدم في جميع أنحاء التطبيق.
 *
 * الاستيراد:
 *   import { meta } from '../MetaApiService';
 */
export const meta = new MetaApiService();
export default meta;
