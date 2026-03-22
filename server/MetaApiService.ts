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
const GRAPH_API_VERSION = "v21.0";
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
   * بناء URL كامل مع إضافة access_token تلقائياً في query string
   * (بعض نقاط النهاية تتطلب التوكن في URL وليس في Header)
   */
  buildUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${GRAPH_API_BASE}/${endpoint.replace(/^\//, "")}`);
    url.searchParams.set("access_token", this.accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /**
   * طلب GET عام
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
        headers: { "Content-Type": "application/json" },
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
      return { success: false, error: res.error?.message ?? "خطأ غير معروف" };
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

    const res = await this.post(`${phoneNumberId}/messages`, payload);
    if (!res.ok) {
      return { success: false, error: res.error?.message ?? "خطأ غير معروف" };
    }
    return { success: true, messageId: res.data?.messages?.[0]?.id };
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
