# تقرير تحليلي شامل: خدمات WhatsApp Business Platform
## المستشفى السعودي الألماني - منصة CRM

**تاريخ التقرير:** أبريل 2026  
**المرجع الرئيسي:** [وثائق Meta الرسمية لـ WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp/)

---

## 1. نظرة عامة على الهيكلة الحالية

يتكون نظام WhatsApp في المنصة من **17 ملفاً** موزعة على 4 طبقات:

| الطبقة | الملفات | الأسطر الإجمالية |
|--------|---------|-----------------|
| Routers (4 ملفات) | whatsapp.ts, messageSettings.ts, whatsappTemplateTest.ts, metaSync.ts | 1,070 سطر |
| Services (9 ملفات) | whatsappService, whatsappIntegration, metaTemplateSync, whatsappAppointments, whatsappAutoReply, whatsappBroadcast, whatsappScheduler, whatsappSecurity, whatsappAuditLog | 2,869 سطر |
| Core Files (3 ملفات) | whatsappCloudAPI.ts, whatsapp.ts, whatsappSse.ts | 431 سطر |
| Webhooks (1 ملف) | whatsappWebhook.ts | 166 سطر |

---

## 2. تحليل كل ملف: المحتوى والمشاكل

### 2.1 `whatsappCloudAPI.ts` - واجهة Meta API الرئيسية

**المحتوى الحالي:**
- دالة `formatPhoneNumber()` لتنسيق الأرقام اليمنية
- دالة `getWhatsAppAPIStatus()` للتحقق من حالة الاتصال
- معالجة أخطاء محدودة (6 أكواد خطأ فقط)
- دالة `sendWhatsAppTextMessage()` للرسائل النصية
- دالة `sendWhatsAppTemplateMessage()` لرسائل القوالب

**المشاكل المكتشفة:**

**المشكلة 1: إصدار API قديم**
```typescript
// الكود الحالي - خاطئ
apiVersion: "v21.0"
```
وفقاً لوثائق Meta الرسمية، الإصدار الحالي هو `v23.0` (ديسمبر 2025). استخدام إصدار قديم يعني فقدان الميزات الجديدة وخطر إيقاف الدعم.

**المشكلة 2: نقص في أكواد الخطأ**
الكود الحالي يعالج 6 أكواد خطأ فقط، بينما توثّق Meta أكثر من 50 كود خطأ محتمل. الأكواد المفقودة تشمل:
- `131000` - خطأ في المصادقة
- `131005` - صلاحية الوصول غير كافية
- `131008` - معامل مطلوب مفقود
- `131009` - معامل غير صحيح
- `131021` - رقم الهاتف غير مسجل في WhatsApp
- `131031` - حساب Business غير متاح
- `130429` - تجاوز حد معدل الإرسال (Rate Limit)

**المشكلة 3: عدم دعم الرسائل التفاعلية**
لا يوجد دعم لـ:
- رسائل القوائم التفاعلية (`list messages`)
- رسائل الأزرار (`button messages`)
- رسائل الموقع (`location messages`)
- رسائل الوسائط (صور، مستندات، فيديو)

---

### 2.2 `whatsappWebhook.ts` - استقبال الأحداث

**المحتوى الحالي:**
- التحقق من رمز Webhook
- معالجة الرسائل الواردة
- معالجة تحديثات حالة الرسائل
- رد تلقائي بسيط

**المشاكل المكتشفة:**

**المشكلة 1: الرد التلقائي يستخدم `whatsappBot` القديم**
```typescript
// الكود الحالي - خاطئ
if (type === "text" && text && whatsappBot) {
  await whatsappBot.sendText(from, autoReplyMessage);
}
```
`whatsappBot` هو مكتبة قديمة غير رسمية. يجب استخدام `sendWhatsAppTextMessage()` من `whatsappCloudAPI.ts`.

**المشكلة 2: عدم معالجة أحداث Webhook الحرجة**
وفقاً لوثائق Meta، الـ Webhook يدعم 18 نوع حدث. الكود الحالي يعالج فقط:
- ✅ `messages` - الرسائل الواردة
- ✅ `statuses` - حالة الرسائل
- ✅ `template_status_update` - تحديث حالة القوالب (تسجيل فقط)
- ✅ `account_alerts` - تنبيهات الحساب (تسجيل فقط)

**الأحداث المفقودة:**
- ❌ `message_template_status_update` - لا يُحدّث قاعدة البيانات عند تغيير حالة القالب
- ❌ `message_template_quality_update` - لا يتابع جودة القوالب
- ❌ `phone_number_quality_update` - لا يتابع جودة رقم الهاتف
- ❌ `account_review_update` - لا يتابع مراجعة الحساب
- ❌ `business_capability_update` - لا يتابع حدود الإرسال

**المشكلة 3: عدم التحقق من توقيع الطلب (Signature Verification)**
وفقاً لوثائق Meta الرسمية، يجب التحقق من توقيع كل طلب Webhook باستخدام `X-Hub-Signature-256`:
```typescript
// مطلوب وفق وثائق Meta - غير موجود في الكود الحالي
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = crypto
  .createHmac('sha256', APP_SECRET)
  .update(rawBody)
  .digest('hex');
if (`sha256=${expectedSignature}` !== signature) {
  return res.status(403).send('Invalid signature');
}
```
هذه ثغرة أمنية خطيرة تسمح لأي طرف ثالث بإرسال أحداث مزيفة.

**المشكلة 4: عدم حفظ الرسائل الواردة في قاعدة البيانات**
الرسائل الواردة تُعالج فقط في الذاكرة ولا تُحفظ في قاعدة البيانات، مما يعني فقدان سجل المحادثات.

---

### 2.3 `whatsappService.ts` - الخدمة الرئيسية

**المحتوى الحالي:**
- إرسال رسائل نصية عبر `whatsappBot` القديم
- رسائل ترحيب وتأكيد حجز نصية
- فحص صحة الخدمة

**المشكلة الجوهرية: استخدام مكتبة غير رسمية**
```typescript
// الكود الحالي - خاطئ تماماً
import { whatsappBot } from "../config/whatsapp";
await whatsappBot.sendText(normalizedPhone, message);
```
هذا يعتمد على `whatsappBot` الذي يبدو أنه مكتبة غير رسمية (مثل `whatsapp-web.js`). وفقاً لسياسة Meta، استخدام مكتبات غير رسمية يُعرّض الحساب للحظر الدائم.

**المشكلة الثانية: الرسائل النصية خارج نافذة الخدمة**
وفقاً لوثائق Meta، لا يمكن إرسال رسائل نصية حرة إلى المستخدمين إلا خلال نافذة 24 ساعة بعد آخر رسالة منهم. خارج هذه النافذة، يجب استخدام القوالب المعتمدة فقط.

---

### 2.4 `whatsappAutoReply.ts` - الرد التلقائي

**المحتوى الحالي:**
- قواعد رد تلقائي محفوظة في الذاكرة (Map)
- معالجة الرسائل الواردة

**المشاكل المكتشفة:**

**المشكلة 1: البيانات تُفقد عند إعادة تشغيل الخادم**
```typescript
// الكود الحالي - خاطئ
const autoReplyRules: Map<string, AutoReplyRule> = new Map();
```
القواعد محفوظة في الذاكرة فقط، وتُفقد عند إعادة تشغيل الخادم. يجب حفظها في قاعدة البيانات.

**المشكلة 2: استخدام `whatsappBot` القديم**
```typescript
await whatsappBot.sendText(normalizedPhone, rule.response);
```
نفس المشكلة السابقة - يجب استخدام Cloud API الرسمي.

**المشكلة 3: لا يدعم القوالب في الرد التلقائي**
وفقاً لمتطلبات Meta، الردود خارج نافذة 24 ساعة يجب أن تكون قوالب معتمدة.

---

### 2.5 `whatsappBroadcast.ts` - الرسائل الجماعية

**المحتوى الحالي:**
- إرسال رسائل جماعية متسلسل
- حالة الإرسال وإحصائيات وهمية (placeholder)

**المشاكل المكتشفة:**

**المشكلة 1: استخدام `whatsappBot` القديم**
```typescript
await whatsappBot.sendText(phone, params.message);
```

**المشكلة 2: الإحصائيات وهمية**
```typescript
// الكود الحالي - بيانات مزيفة
return {
  success: true,
  stats: {
    totalBroadcasts: 10,      // ← بيانات وهمية!
    completedBroadcasts: 8,   // ← بيانات وهمية!
    totalMessagesSent: 500,   // ← بيانات وهمية!
  }
}
```

**المشكلة 3: لا يستخدم القوالب المعتمدة**
وفقاً لمتطلبات Meta، الرسائل الجماعية (Business-Initiated) يجب أن تستخدم قوالب معتمدة، وليس رسائل نصية حرة.

**المشكلة 4: لا يحترم حدود الإرسال**
Meta تفرض حدوداً صارمة على معدل الإرسال:
- الطبقة 1: 1,000 محادثة فريدة/24 ساعة
- الطبقة 2: 10,000 محادثة فريدة/24 ساعة
- الطبقة 3: 100,000 محادثة فريدة/24 ساعة

الكود الحالي لا يتحقق من هذه الحدود.

---

### 2.6 `whatsappScheduler.ts` - جدولة الرسائل

**المحتوى الحالي:**
- مهام مجدولة بـ CronJob
- تذكيرات المواعيد (24 ساعة و1 ساعة)
- تنظيف سجلات التدقيق
- فحص صحة النظام

**المشاكل المكتشفة:**

**المشكلة 1: يعتمد على `whatsappBot` القديم**
دوال إرسال التذكيرات تستخدم المكتبة غير الرسمية.

**المشكلة 2: لا يستخدم قوالب معتمدة للتذكيرات**
التذكيرات رسائل نصية حرة، وهذا مخالف لسياسة Meta خارج نافذة 24 ساعة.

---

### 2.7 `whatsappSecurity.ts` - الأمان

**المحتوى الحالي:**
- قائمة الأرقام المحظورة في الذاكرة
- طلبات إلغاء الاشتراك (Opt-Out)
- إحصائيات الأمان

**المشاكل المكتشفة:**

**المشكلة 1: البيانات تُفقد عند إعادة تشغيل الخادم**
```typescript
const blockedNumbers: Map<string, BlockedNumber> = new Map();
const optOutRequests: Map<string, OptOutRequest> = new Map();
```

**المشكلة 2: لا يعالج Opt-Out تلقائياً**
وفقاً لسياسة Meta، عندما يرسل المستخدم كلمة "STOP" أو "إلغاء"، يجب إيقاف الرسائل فوراً وتسجيل الطلب. الكود الحالي لا يعالج هذا تلقائياً من الـ Webhook.

---

### 2.8 `metaTemplateSync.ts` - مزامنة القوالب

**المحتوى الحالي:**
- جلب القوالب من Meta
- دفع قوالب جديدة
- تحديث حالة القوالب

**المشاكل المكتشفة:**

**المشكلة 1: استخدام نقطة API خاطئة**
```typescript
// الكود الحالي - خاطئ
const META_API_BASE = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;
```
نقطة API الصحيحة وفقاً لوثائق Meta هي:
```
https://graph.facebook.com/v23.0/
```
وليس `graph.instagram.com`!

**المشكلة 2: إصدار API قديم**
```typescript
const META_GRAPH_API_VERSION = "v18.0";
```
الإصدار الحالي هو `v23.0`.

**المشكلة 3: عدم دعم `parameter_format` الجديد**
وفقاً لوثائق Meta الجديدة، القوالب تدعم الآن `named parameters` (معاملات مسماة) بدلاً من `positional` فقط. الكود الحالي لا يدعم هذا.

**المشكلة 4: عدم معالجة `message_template_status_update` من Webhook**
عند موافقة Meta على قالب أو رفضه، يُرسل Webhook تلقائياً. الكود الحالي لا يعالج هذا الحدث لتحديث قاعدة البيانات.

---

### 2.9 `whatsappIntegration.ts` - التكامل مع الحجوزات

**المحتوى الحالي:**
- إرسال تأكيدات الحجوزات باستخدام القوالب
- ربط المخيمات والمواعيد والعروض

**المشاكل المكتشفة:**

**المشكلة 1: `import` مفقود لـ `eq` و `and`**
```typescript
// الكود الحالي - خطأ TypeScript
.where(
  and(
    eq(whatsappTemplates.metaName, "appointment_confirmation_ar"),
    eq(whatsappTemplates.metaStatus, "APPROVED")
  )
)
```
لا يوجد `import { eq, and } from "drizzle-orm"` في بداية الملف.

**المشكلة 2: لا يُسجّل نتائج الإرسال في قاعدة البيانات**
عند إرسال رسالة تأكيد، لا يُسجّل `messageId` أو حالة الإرسال في قاعدة البيانات لمتابعة لاحقة.

---

### 2.10 `whatsappSse.ts` - الإشعارات الفورية

**المحتوى الحالي:**
- 3 مسارات SSE: محادثة، مستخدم، عالمي
- Keep-alive كل 15 ثانية

**المشاكل المكتشفة:**

**المشكلة 1: لا يُفعَّل من الـ Webhook**
الـ SSE جاهز لكن الـ Webhook لا يُرسل أحداثاً إليه عند وصول رسائل جديدة. الاتصال منقطع بين الطبقتين.

---

## 3. الفجوات الكبرى مقارنة بوثائق Meta

| الميزة | متطلب Meta | الحالة الحالية |
|--------|-----------|---------------|
| التحقق من توقيع Webhook (`X-Hub-Signature-256`) | **إلزامي** | ❌ غير موجود |
| إصدار API الحالي (`v23.0`) | **مطلوب** | ❌ يستخدم v21.0 و v18.0 |
| نقطة API الصحيحة (`graph.facebook.com`) | **إلزامي** | ❌ يستخدم `graph.instagram.com` |
| القوالب للرسائل خارج 24 ساعة | **إلزامي** | ⚠️ جزئي |
| معالجة `message_template_status_update` | **مهم** | ❌ غير موجود |
| معالجة Opt-Out تلقائياً | **إلزامي بموجب السياسة** | ❌ غير موجود |
| حفظ الرسائل الواردة في DB | **موصى به** | ❌ غير موجود |
| دعم `named parameters` في القوالب | **جديد** | ❌ غير موجود |
| احترام حدود معدل الإرسال | **إلزامي** | ❌ غير موجود |
| حفظ بيانات الأمان في DB | **مهم** | ❌ في الذاكرة فقط |
| الرسائل التفاعلية (أزرار، قوائم) | **موصى به** | ❌ غير موجود |
| تسجيل messageId في DB | **مهم للمتابعة** | ❌ غير موجود |

---

## 4. خطة الإصلاح والتحسين

### المرحلة الأولى: إصلاحات حرجة (أمان وامتثال) - أولوية عالية

#### 4.1 إصلاح الثغرة الأمنية في Webhook
```typescript
// يجب إضافة التحقق من التوقيع في whatsappWebhook.ts
import crypto from 'crypto';

function verifyWebhookSignature(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  const appSecret = process.env.META_APP_SECRET;
  
  if (!signature || !appSecret) return false;
  
  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

#### 4.2 تحديث إصدار API إلى v23.0
```typescript
// في whatsappCloudAPI.ts و metaTemplateSync.ts
const META_API_VERSION = "v23.0";
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;
```

#### 4.3 إصلاح نقطة API في metaTemplateSync.ts
```typescript
// تغيير من:
const META_API_BASE = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;
// إلى:
const META_API_BASE = `https://graph.facebook.com/v23.0`;
```

#### 4.4 إزالة استخدام `whatsappBot` القديم
استبدال جميع استخدامات `whatsappBot.sendText()` بـ `sendWhatsAppTextMessage()` من `whatsappCloudAPI.ts`.

---

### المرحلة الثانية: معالجة أحداث Webhook المفقودة - أولوية عالية

#### 4.5 معالجة `message_template_status_update`
```typescript
// في whatsappWebhook.ts
if (value.message_template_status_update) {
  const { message_template_id, event, reason } = value.message_template_status_update;
  
  // تحديث حالة القالب في قاعدة البيانات
  await db.update(whatsappTemplates)
    .set({ 
      metaStatus: event === 'APPROVED' ? 'APPROVED' : 'REJECTED',
      updatedAt: new Date()
    })
    .where(eq(whatsappTemplates.metaTemplateId, message_template_id));
}
```

#### 4.6 معالجة Opt-Out تلقائياً
```typescript
// في handleIncomingMessage
const OPT_OUT_KEYWORDS = ['stop', 'إلغاء', 'إيقاف', 'لا أريد', 'unsubscribe'];

if (OPT_OUT_KEYWORDS.some(kw => text?.body?.toLowerCase().includes(kw))) {
  await blockPhone({ phone: from, reason: 'opt_out' });
  // حفظ في قاعدة البيانات
}
```

---

### المرحلة الثالثة: حفظ البيانات في قاعدة البيانات - أولوية متوسطة

#### 4.7 إضافة جدول `whatsappMessages` في schema
```typescript
export const whatsappMessages = mysqlTable("whatsapp_messages", {
  id: int("id").autoincrement().primaryKey(),
  messageId: varchar("messageId", { length: 100 }).unique(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // text, template, image
  content: text("content"),
  templateName: varchar("templateName", { length: 100 }),
  status: mysqlEnum("status", ["sent", "delivered", "read", "failed"]).default("sent"),
  errorCode: int("errorCode"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### 4.8 حفظ الأرقام المحظورة في قاعدة البيانات
إضافة جدول `whatsappBlockedNumbers` لحفظ الأرقام المحظورة بدلاً من الذاكرة.

#### 4.9 حفظ قواعد الرد التلقائي في قاعدة البيانات
إضافة جدول `whatsappAutoReplyRules` لحفظ القواعد بشكل دائم.

---

### المرحلة الرابعة: تحسينات الميزات - أولوية متوسطة

#### 4.10 دعم `named parameters` في القوالب
```typescript
// دعم المعاملات المسماة الجديدة من Meta
{
  "type": "body",
  "parameters": [
    {
      "type": "text",
      "parameter_name": "patient_name",  // ← معامل مسمى
      "text": "محمد أحمد"
    }
  ]
}
```

#### 4.11 إضافة الرسائل التفاعلية
```typescript
// إضافة دعم لرسائل الأزرار
export async function sendButtonMessage(phone: string, params: {
  body: string;
  buttons: Array<{ id: string; title: string }>;
}): Promise<{ success: boolean; messageId?: string }> {
  // ...
}
```

#### 4.12 ربط SSE بالـ Webhook
```typescript
// في handleIncomingMessage - إرسال حدث SSE عند وصول رسالة جديدة
import { publish, channelForConversation, GLOBAL_CHANNEL } from '../_core/pubsub';

publish(GLOBAL_CHANNEL, 'new_message', { phone: from, messageId, type });
```

---

### المرحلة الخامسة: إحصائيات حقيقية - أولوية منخفضة

#### 4.13 استبدال البيانات الوهمية بإحصائيات حقيقية
استبدال جميع البيانات الوهمية في `whatsappBroadcast.ts` و `whatsappSecurity.ts` بإحصائيات حقيقية من قاعدة البيانات.

---

## 5. ملخص الأولويات

| الأولوية | الإصلاح | التأثير |
|---------|---------|--------|
| 🔴 حرجة | إصلاح التحقق من توقيع Webhook | أمان - منع الهجمات |
| 🔴 حرجة | إصلاح نقطة API في metaTemplateSync | الخدمة لا تعمل حالياً |
| 🔴 حرجة | تحديث إصدار API إلى v23.0 | امتثال Meta |
| 🔴 حرجة | إزالة `whatsappBot` القديم | منع حظر الحساب |
| 🟠 عالية | معالجة `message_template_status_update` | مزامنة القوالب تلقائياً |
| 🟠 عالية | معالجة Opt-Out تلقائياً | امتثال سياسة Meta |
| 🟡 متوسطة | حفظ الرسائل في قاعدة البيانات | سجل المحادثات |
| 🟡 متوسطة | حفظ بيانات الأمان في DB | استمرارية البيانات |
| 🟡 متوسطة | ربط SSE بالـ Webhook | الإشعارات الفورية |
| 🟢 منخفضة | دعم named parameters | ميزة جديدة |
| 🟢 منخفضة | الرسائل التفاعلية | تحسين تجربة المستخدم |
| 🟢 منخفضة | إحصائيات حقيقية | دقة البيانات |

---

## 6. المراجع

[1] [WhatsApp Business Platform - Webhooks Overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/)  
[2] [WhatsApp Business Platform - Templates Overview](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)  
[3] [WhatsApp Business Platform - Messages API](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages)  
[4] [WhatsApp Business Platform - Error Codes](https://developers.facebook.com/documentation/business-messaging/whatsapp/error-codes)  
[5] [WhatsApp Business Messaging Policy](https://business.whatsapp.com/policy)  
[6] [Meta Graph API - Current Version](https://developers.facebook.com/docs/graph-api/changelog)  
[7] [WhatsApp Cloud API - Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)
