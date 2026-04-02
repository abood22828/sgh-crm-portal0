# دليل تكامل WhatsApp Cloud API الشامل

## نظرة عامة

تم تطبيق تكامل شامل مع WhatsApp Cloud API يتضمن 4 مراحل متكاملة:

- **المرحلة 1:** الإعداد الأساسي (Configuration & Webhook)
- **المرحلة 2:** الميزات الأساسية (Basic Features)
- **المرحلة 3:** الميزات المتقدمة (Advanced Features)
- **المرحلة 4:** التكامل والأمان (Integration & Security)
- **المرحلة 5:** الجدولة والتحسينات (Scheduler & Optimization)

---

## المرحلة 1: الإعداد الأساسي

### الملفات المطبقة:
- `server/config/whatsapp.ts` - إعدادات Bot و Client
- `server/services/whatsappService.ts` - خدمات الإرسال الأساسية
- `server/webhooks/whatsappWebhook.ts` - معالج Webhook
- `server/queues/whatsappQueue.ts` - نظام Queue مع Bull و Redis

### الميزات:
- ✅ إعداد Bot و Client من @awadoc/whatsapp-cloud-api
- ✅ معالجة Webhook الواردة من Meta
- ✅ نظام Queue للرسائل مع Retry Logic
- ✅ معالجة الأخطاء الشاملة
- ✅ توحيد صيغ الأرقام (Normalization)

### الاستخدام:

```typescript
import { whatsappBot } from "@/server/config/whatsapp";

// إرسال رسالة نصية
const result = await whatsappBot.sendText("967777165305", "مرحباً");

// إرسال رسالة مع صورة
const result = await whatsappBot.sendImage(
  "967777165305",
  "https://example.com/image.jpg",
  "تعليق على الصورة"
);
```

---

## المرحلة 2: الميزات الأساسية

### الملفات المطبقة:
- `server/routers/whatsapp.ts` - tRPC Procedures (6 procedures)
- `client/src/pages/WhatsAppDashboard.tsx` - لوحة تحكم أساسية

### الـ Procedures:

| Procedure | النوع | الوصف |
|-----------|-------|-------|
| `sendSimpleText` | Mutation | إرسال رسالة نصية بسيطة |
| `sendWelcomeMsg` | Mutation | إرسال رسالة ترحيب |
| `sendBookingConfirmationMsg` | Mutation | إرسال تأكيد حجز |
| `health` | Query | فحص صحة الخدمة |
| `testConnection` | Query | اختبار الاتصال |
| `normalizePhone` | Query | توحيد صيغة الرقم |

### الاستخدام:

```typescript
// من الواجهة الأمامية
const result = await trpc.whatsapp.sendSimpleText.mutate({
  phone: "967777165305",
  message: "مرحباً بك",
});

// التحقق من الصحة
const health = await trpc.whatsapp.health.query();
```

---

## المرحلة 3: الميزات المتقدمة

### الملفات المطبقة:
- `server/services/whatsappTemplates.ts` - قوالب الرسائل
- `server/services/whatsappBroadcast.ts` - البث الجماعي
- `server/services/whatsappAutoReply.ts` - الرد التلقائي
- `client/src/pages/WhatsAppAnalytics.tsx` - لوحة تحكم متقدمة

### الـ Procedures (12 procedure):

#### القوالب (Templates):
- `sendTemplate` - إرسال قالب مع متغيرات
- `getTemplates` - قائمة القوالب المتاحة
- `getTemplateStatus` - حالة القالب

#### البث (Broadcast):
- `sendBroadcast` - إرسال رسالة جماعية
- `getBroadcastStatus` - حالة البث
- `getBroadcastStats` - إحصائيات البث
- `scheduleBroadcast` - جدولة البث

#### الرد التلقائي (Auto Reply):
- `addAutoReplyRule` - إضافة قاعدة رد تلقائي
- `deleteAutoReplyRule` - حذف قاعدة
- `getAutoReplyRules` - قائمة القواعد
- `processIncomingMessage` - معالجة الرسائل الواردة

### الاستخدام:

```typescript
// إرسال قالب
const result = await trpc.whatsapp.sendTemplate.mutate({
  phone: "967777165305",
  templateName: "appointment_confirmation",
  variables: ["أحمد", "د. علي", "2024-04-10"],
});

// إرسال بث جماعي
const broadcast = await trpc.whatsapp.sendBroadcast.mutate({
  phones: ["967777165305", "967771234567"],
  message: "عرض خاص لك",
  type: "text",
});

// إضافة قاعدة رد تلقائي
const rule = await trpc.whatsapp.addAutoReplyRule.mutate({
  trigger: "مرحبا",
  response: "أهلاً وسهلاً، كيف يمكننا مساعدتك؟",
  enabled: true,
});
```

---

## المرحلة 4: التكامل والأمان

### الملفات المطبقة:
- `server/services/whatsappAppointments.ts` - إدارة الحجوزات
- `server/services/whatsappAuditLog.ts` - سجل العمليات
- `server/services/whatsappSecurity.ts` - الأمان والامتثال
- `client/src/pages/WhatsAppCompliance.tsx` - لوحة الامتثال

### الـ Procedures (14 procedure):

#### الحجوزات (Appointments):
- `sendAppointmentConfirmation` - تأكيد الحجز
- `sendAppointmentReminder` - تذكير الحجز
- `sendAppointmentFollowup` - متابعة الحجز
- `checkAndSendReminders` - فحص وإرسال التذكيرات

#### سجل العمليات (Audit Log):
- `getAuditLogs` - استعلام السجل
- `getAuditStats` - إحصائيات العمليات
- `exportAuditLogs` - تصدير السجل (CSV)

#### الأمان والامتثال (Security):
- `blockPhone` - حظر رقم
- `unblockPhone` - إلغاء حظر
- `getBlockedPhones` - قائمة المحظورين
- `handleOptOutRequest` - معالجة طلب الإلغاء
- `getOptOutRequests` - قائمة طلبات الإلغاء
- `validateMetaCompliance` - فحص الامتثال
- `getSecurityStats` - إحصائيات الأمان

### الاستخدام:

```typescript
// إرسال تأكيد حجز
const confirmation = await trpc.whatsapp.sendAppointmentConfirmation.mutate({
  appointmentId: 1,
  phone: "967777165305",
  patientName: "أحمد محمد",
  doctorName: "علي الأحمري",
  appointmentTime: new Date("2024-04-10T10:00:00"),
  department: "القلب",
});

// فحص الامتثال
const compliance = await trpc.whatsapp.validateMetaCompliance.query({
  message: "مرحباً، هذا عرض خاص لك",
});

// حظر رقم
const blocked = await trpc.whatsapp.blockPhone.mutate({
  phone: "967777165305",
  reason: "opt_out",
});

// تصدير السجل
const audit = await trpc.whatsapp.exportAuditLogs.query({
  phone: "967777165305",
});
```

---

## المرحلة 5: الجدولة والتحسينات

### الملفات المطبقة:
- `server/services/whatsappScheduler.ts` - نظام الجدولة
- `client/src/pages/WhatsAppAppointments.tsx` - لوحة الحجوزات

### المهام المجدولة:

| المهمة | التكرار | الوصف |
|-------|---------|-------|
| `appointment_reminder_24h` | يومياً الساعة 10 صباحاً | تذكيرات الحجوزات (24 ساعة) |
| `appointment_reminder_1h` | كل ساعة | تذكيرات الحجوزات (1 ساعة) |
| `cleanup_audit_logs` | يومياً الساعة 2 صباحاً | تنظيف السجلات القديمة |
| `health_check` | كل 5 دقائق | فحص صحة النظام |

### الـ Procedures:
- `initializeScheduler` - تهيئة الجدولة
- `getScheduledTasks` - قائمة المهام
- `stopTask` - إيقاف مهمة
- `resumeTask` - استئناف مهمة
- `shutdownScheduler` - إيقاف الجدولة

### الاستخدام:

```typescript
// تهيئة الجدولة
const init = await trpc.whatsapp.initializeScheduler.mutate();

// الحصول على قائمة المهام
const tasks = await trpc.whatsapp.getScheduledTasks.query();

// إيقاف مهمة
const stopped = await trpc.whatsapp.stopTask.mutate({
  taskId: "appointment_reminder_24h",
});

// استئناف مهمة
const resumed = await trpc.whatsapp.resumeTask.mutate({
  taskId: "appointment_reminder_24h",
});
```

---

## البنية المعمارية

```
server/
├── config/
│   └── whatsapp.ts                    # إعدادات Bot و Client
├── services/
│   ├── whatsappService.ts             # خدمات الإرسال الأساسية
│   ├── whatsappTemplates.ts           # قوالب الرسائل
│   ├── whatsappBroadcast.ts           # البث الجماعي
│   ├── whatsappAutoReply.ts           # الرد التلقائي
│   ├── whatsappAppointments.ts        # إدارة الحجوزات
│   ├── whatsappAuditLog.ts            # سجل العمليات
│   ├── whatsappSecurity.ts            # الأمان والامتثال
│   └── whatsappScheduler.ts           # نظام الجدولة
├── webhooks/
│   └── whatsappWebhook.ts             # معالج Webhook
├── queues/
│   └── whatsappQueue.ts               # نظام Queue
└── routers/
    └── whatsapp.ts                    # tRPC Procedures

client/src/pages/
├── WhatsAppDashboard.tsx              # لوحة التحكم الأساسية
├── WhatsAppAnalytics.tsx              # لوحة التحليلات
├── WhatsAppCompliance.tsx             # لوحة الامتثال
└── WhatsAppAppointments.tsx           # لوحة الحجوزات
```

---

## متطلبات البيئة

```env
# WhatsApp Cloud API
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_ACCESS_TOKEN=your_meta_access_token
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# Database
DATABASE_URL=mysql://user:password@host/database

# Redis (للـ Queue)
REDIS_URL=redis://localhost:6379

# Encryption
ENCRYPTION_KEY=your_encryption_key_min_32_chars
```

---

## أفضل الممارسات

### 1. معالجة الأخطاء
```typescript
try {
  const result = await whatsappBot.sendText(phone, message);
  if (!result.success) {
    // معالجة الفشل
    await logError({ phone, error: result.error });
  }
} catch (error) {
  // معالجة الاستثناءات
  console.error("WhatsApp error:", error);
}
```

### 2. التحقق من الامتثال
```typescript
const compliance = await validateMetaCompliance(message);
if (!compliance.compliant) {
  console.warn("Message not compliant:", compliance.issues);
  // عدم إرسال الرسالة
  return;
}
```

### 3. استخدام Queue للرسائل المهمة
```typescript
// بدلاً من الإرسال المباشر
await whatsappQueue.add("send_message", {
  phone,
  message,
  priority: "high",
});
```

### 4. تسجيل العمليات
```typescript
await logMessageSent({
  phone,
  message,
  messageId,
  type: "template",
  userId: currentUser.id,
});
```

### 5. معالجة opt-out
```typescript
if (message.includes("STOP")) {
  await handleOptOutRequest({
    phone: message.from,
    reason: "User requested",
  });
}
```

---

## استكشاف الأخطاء

### المشكلة: الرسائل لا تُرسل
**الحل:**
1. تحقق من صحة رقم الهاتف (يجب أن يكون بصيغة دولية)
2. تحقق من حالة الـ Queue والـ Redis
3. تحقق من صلاحيات الـ Meta Access Token
4. راجع سجل العمليات (Audit Log)

### المشكلة: Webhook لا يستقبل الرسائل
**الحل:**
1. تحقق من صحة Webhook URL
2. تحقق من Verify Token
3. تحقق من firewall والـ Network
4. اختبر الـ Webhook من Meta Dashboard

### المشكلة: معدل الفشل مرتفع
**الحل:**
1. تحقق من معدل الإرسال (Rate Limiting)
2. تحقق من جودة الرسائل
3. تحقق من حالة الحساب لدى Meta
4. استخدم Retry Logic مع backoff

---

## الخطوات التالية

1. **ربط مع نظام الحجوزات:** دمج مع جدول appointments الموجود
2. **تطبيق Flows:** استخدام WhatsApp Flows للتفاعل المتقدم
3. **التكامل مع Conversion API:** تتبع التحويلات
4. **لوحة تحكم متقدمة:** إضافة مزيد من الرسوم البيانية والتقارير
5. **اختبارات شاملة:** كتابة unit و integration tests

---

## المراجع

- [Meta WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [@awadoc/whatsapp-cloud-api](https://www.npmjs.com/package/@awadoc/whatsapp-cloud-api)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Cron Job Documentation](https://www.npmjs.com/package/cron)

---

**آخر تحديث:** 2024-04-03
**الإصدار:** 1.0.0
