# توثيق جداول القوالب - Template Tables Documentation

## نظرة عامة

يوجد جدولان للقوالب في قاعدة البيانات: `whatsappTemplates` و `messageTemplates`. لكل جدول غرض واستخدام مختلف.

---

## جدول whatsappTemplates

**الغرض:** تخزين قوالب WhatsApp العامة (القديمة/الأصلية)

**الحقول الرئيسية:**
- `id`: المعرف الفريد
- `name`: اسم القالب
- `category`: فئة القالب (MARKETING, UTILITY, AUTHENTICATION)
- `content`: محتوى القالب كنص كامل
- `variables`: متغيرات القالب (JSON array)
- `isActive`: هل القالب نشط
- `usageCount`: عدد مرات الاستخدام
- `createdBy`: معرف المستخدم الذي أنشأ القالب

**حقول Meta Business Manager:**
- `metaName`: اسم القالب في Meta (snake_case)
- `languageCode`: كود اللغة (مثال: "ar", "en_US")
- `metaStatus`: حالة القالب في Meta (APPROVED, PENDING, REJECTED)
- `metaCategory`: فئة القالب في Meta
- `metaTemplateId`: المعرف الداخلي للقالب في Meta
- `headerText`: نص الرأس (اختياري)
- `footerText`: نص التذييل (اختياري)

**الاستخدام:**
- تخزين القوالب القديمة
- قد يكون مستخدم في الميزات التي لم يتم تحديثها بعد

---

## جدول messageTemplates

**الغرض:** تخزين قوالب الرسائل المرتبطة بإعدادات الرسائل التلقائية

**الحقول الرئيسية:**
- `id`: المعرف الفريد
- `templateName`: اسم القالب في Meta (يجب أن يتطابق تماماً)
- `displayName`: اسم القالب بالعربية للواجهة
- `category`: فئة القالب في Meta (MARKETING, UTILITY, AUTHENTICATION)
- `languageCode`: كود اللغة (افتراضي: "ar")
- `status`: حالة القالب من Meta (PENDING, APPROVED, REJECTED, DISABLED)

**مكونات القالب:**
- `headerText`: نص الرأس
- `bodyText`: نص الجسم (مطلوب)
- `footerText`: نص التذييل
- `buttons`: تكوين الأزرار (JSON array)
- `variables`: متغيرات القالب (JSON array)

**الربط:**
- `metaTemplateId`: معرف القالب في Meta (إذا كان متوفراً)
- `linkedMessageType`: ربط مع message_settings (اختياري)

**تتبع الاستخدام:**
- `usageCount`: عدد مرات الاستخدام
- `lastUsedAt`: آخر وقت للاستخدام

**الاستخدام:**
- القوالب الجديدة المرتبطة بإعدادات الرسائل التلقائية
- تدعم مكونات مفصلة (header, body, footer, buttons)
- مرتبطة بنظام message_settings

---

## الفروق الرئيسية

| الميزة | whatsappTemplates | messageTemplates |
|--------|------------------|------------------|
| **الغرض** | قوالب عامة/قديمة | قوالب مرتبطة بإعدادات الرسائل |
| **اسم القالب** | `name` | `templateName` + `displayName` |
| **المحتوى** | `content` (نص كامل) | `headerText`, `bodyText`, `footerText` (مفصول) |
| **الأزرار** | غير مدعوم | مدعوم (JSON) |
| **الربط** | لا يوجد ربط | `linkedMessageType` مع message_settings |
| **تتبع الاستخدام** | `usageCount` فقط | `usageCount` + `lastUsedAt` |
| **الحالة** | `metaStatus` | `status` |
| **اللغة** | `languageCode` | `languageCode` (افتراضي: "ar") |

---

## التوصيات

### خيار 1: توحيد الجداول (موصى به للمستقبل)
- دمج الجدولين في جدول واحد
- إضافة جميع الحقول من كلا الجدولين
- ترحيل البيانات من `whatsappTemplates` إلى `messageTemplates`
- تحديث جميع الاستعلامات لاستخدام الجدول الموحد

### خيار 2: الحفاظ على الجدولين (الحالي)
- استخدام `messageTemplates` للميزات الجديدة
- استخدام `whatsappTemplates` للميزات القديمة
- إضافة تعليقات في الكود لتوضيح متى يستخدم كل جدول
- التخطيط للترحيل المستقبلي

### خيار 3: إهمال whatsappTemplates
- تعليم `whatsappTemplates` على أنه deprecated
- ترحيل جميع البيانات إلى `messageTemplates`
- إزالة الاستخدامات القديمة تدريجياً

---

## الحالة الحالية

- **الجدولان نشطان حالياً**
- `messageTemplates` هو الجدول المفضل للميزات الجديدة
- `whatsappTemplates` قد يستخدم في بعض الأماكن القديمة
- يوصى بمراجعة الاستخدامات وتوحيد الجداول في المستقبل
