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
const GRAPH_API_VERSION = "v25.0"; // ✅ أحدث إصدار من Meta (2026)
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/** إعدادات Retry Logic لمعالجة Rate Limiting وانقطاع الاتصال */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryOnCodes: [429, 500, 502, 503, 504], // Rate limit + Server errors
};

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
   * تأخير مع Exponential Backoff لمعالجة Rate Limiting
   */
  private async _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * تنفيذ طلب مع Retry Logic تلقائي
   */
  private async _fetchWithRetry(
    url: string,
    options: RequestInit,
    endpoint: string
  ): Promise<{ res: Response; body: any }> {
    let lastError: any;
    let delay = RETRY_CONFIG.initialDelayMs;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        const res = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
        const body = await res.json();

        // معالجة Rate Limiting (429) - انتظر وأعد المحاولة
        if (res.status === 429 || (body.error?.code === 4 || body.error?.code === 80007)) {
          const retryAfter = res.headers.get('Retry-After');
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          console.warn(`[MetaApiService] Rate limited on ${endpoint}. Waiting ${waitMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
          if (attempt < RETRY_CONFIG.maxRetries) {
            await this._delay(Math.min(waitMs, RETRY_CONFIG.maxDelayMs));
            delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
            continue;
          }
        }

        // إعادة المحاولة على أخطاء الخادم
        if (RETRY_CONFIG.retryOnCodes.includes(res.status) && res.status !== 429 && attempt < RETRY_CONFIG.maxRetries) {
          console.warn(`[MetaApiService] Server error ${res.status} on ${endpoint}. Retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
          await this._delay(delay);
          delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
          continue;
        }

        return { res, body };
      } catch (err) {
        lastError = err;
        if (attempt < RETRY_CONFIG.maxRetries) {
          console.warn(`[MetaApiService] Network error on ${endpoint}. Retrying in ${delay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries}):`, err);
          await this._delay(delay);
          delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelayMs);
        }
      }
    }
    throw lastError || new Error(`فشل الطلب بعد ${RETRY_CONFIG.maxRetries} محاولات`);
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
      const { res, body } = await this._fetchWithRetry(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`,
        },
      }, endpoint);
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] GET ${endpoint} failed after retries:`, msg);
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
      const { res, body } = await this._fetchWithRetry(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      }, endpoint);
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] POST ${endpoint} failed after retries:`, msg);
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
      const { res, body } = await this._fetchWithRetry(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${this.accessToken}` },
      }, endpoint);
      return {
        data: body,
        error: body.error,
        status: res.status,
        ok: res.ok && !body.error,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[MetaApiService] DELETE ${endpoint} failed after retries:`, msg);
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
    limit = 250
  ): Promise<{ success: boolean; templates?: any[]; error?: string; rawError?: any }> {
    // وفق وثائق Meta v25.0: GET /{whatsapp-business-account-id}/message_templates
    // الحقول المتاحة: id, name, status, category, language, components, quality_score, rejected_reason
    const res = await this.get(`${wabaId}/message_templates`, {
      fields: "id,name,status,category,language,components,quality_score,rejected_reason",
      limit: String(limit),
    });
    if (!res.ok) {
      const errMsg = this._formatMetaError(res.error);
      console.error(`[MetaApiService] getWhatsAppTemplates failed for WABA ${wabaId}:`, JSON.stringify(res.error));
      return { success: false, error: errMsg, rawError: res.error };
    }
    const templates = res.data?.data ?? [];
    console.log(`[MetaApiService] Fetched ${templates.length} templates from WABA ${wabaId}`);
    return { success: true, templates };
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
