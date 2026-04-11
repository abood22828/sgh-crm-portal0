# دليل تكامل Meta الرسمي - WhatsApp Cloud API

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تكامل منصة المستشفى السعودي الألماني مع Meta Platforms لاستخدام WhatsApp Cloud API بشكل كامل ومعتمد.

---

## 🔐 المتطلبات الأساسية

### 1. حسابات Meta المطلوبة
- ✅ حساب Meta Business Manager
- ✅ تطبيق Meta (Facebook App)
- ✅ حساب WhatsApp Business
- ✅ رقم هاتف WhatsApp Business معتمد

### 2. البيانات المطلوبة
- `META_ACCESS_TOKEN`: توكن الوصول الدائم
- `WHATSAPP_BUSINESS_ACCOUNT_ID`: معرف حساب WhatsApp Business
- `WHATSAPP_PHONE_NUMBER_ID`: معرف رقم الهاتف المعتمد

---

## 🚀 خطوات التكامل

### المرحلة 1: إعداد Meta Business Manager

#### 1.1 إنشاء تطبيق Meta
1. اذهب إلى [Meta Developers](https://developers.facebook.com)
2. انقر على "My Apps" → "Create App"
3. اختر "Business" كنوع التطبيق
4. ملء البيانات:
   - **App Name**: SGH CRM Portal
   - **App Purpose**: Business
   - **App Contact Email**: contact@sgh.com

#### 1.2 إضافة WhatsApp
1. في لوحة التحكم، ابحث عن "WhatsApp"
2. انقر على "Set Up"
3. اختر "WhatsApp Business API"

#### 1.3 الحصول على Access Token
1. اذهب إلى Settings → Basic
2. انسخ **App ID** و **App Secret**
3. اذهب إلى Tools → Access Token Generator
4. اختر التطبيق الخاص بك
5. اختر الصلاحيات:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. انسخ التوكن الناتج

---

### المرحلة 2: إعداد WhatsApp Business Account

#### 2.1 ربط رقم الهاتف
1. اذهب إلى Meta Business Manager
2. اختر "WhatsApp" → "Getting Started"
3. اتبع خطوات التحقق من الهاتف
4. أدخل رقم الهاتف: **+967 (رقم المستشفى)**
5. تحقق من الرمز المرسل عبر SMS

#### 2.2 إعداد ملف الأعمال
1. اذهب إلى "Account Settings"
2. ملء المعلومات:
   - **Business Name**: المستشفى السعودي الألماني
   - **Business Category**: Healthcare
   - **Business Address**: شارع الستين الشمالي - صنعاء
   - **Phone**: 8000018

---

### المرحلة 3: إنشاء وتسجيل القوالب

#### 3.1 إضافة القوالب إلى قاعدة البيانات
```bash
cd /home/ubuntu/sgh-crm-portal
node scripts/seed-whatsapp-templates.mjs
```

هذا سيضيف 16 قالب معتمد من Meta إلى قاعدة البيانات.

#### 3.2 تسجيل القوالب في Meta
1. اذهب إلى Meta Business Manager
2. اختر "WhatsApp" → "Message Templates"
3. انقر على "Create Template"
4. لكل قالب من القوالب التالية:

**القالب الأول: تأكيد الموعد الطبي**
- **Template Name**: `appointment_confirmation_ar`
- **Category**: UTILITY
- **Language**: Arabic
- **Content**:
```
مرحباً {{1}},

تم تأكيد موعدك الطبي بنجاح ✅

📋 التفاصيل:
• الطبيب: {{2}}
• التخصص: {{3}}
• التاريخ: {{4}}
• الوقت: {{5}}
• الموقع: شارع الستين الشمالي - صنعاء

شكراً لاختيارك المستشفى السعودي الألماني
```

**ملاحظة**: تكرر هذه الخطوة لجميع 16 قالب الموجودة في `WHATSAPP_TEMPLATES_REQUIRED.md`

#### 3.3 انتظار الموافقة
- عادة تستغرق 24-48 ساعة
- يمكنك متابعة الحالة في Meta Business Manager
- بعد الموافقة، ستظهر حالة "APPROVED"

---

### المرحلة 4: تحديث حالة القوالب

بعد موافقة Meta على القوالب، قم بتحديث حالتها في قاعدة البيانات:

```sql
UPDATE whatsapp_templates 
SET metaStatus = 'APPROVED' 
WHERE metaName IN (
  'appointment_confirmation_ar',
  'camp_registration_confirmation_ar',
  'offer_booking_confirmation_ar',
  'appointment_reminder_24h_ar',
  'appointment_reminder_1h_ar',
  'appointment_status_confirmed_ar',
  'appointment_status_cancelled_ar',
  'appointment_status_rescheduled_ar',
  'appointment_status_completed_ar',
  'appointment_followup_ar',
  'camp_followup_ar',
  'camp_cancellation_ar',
  'offer_cancellation_ar',
  'welcome_message_ar',
  'new_offer_announcement_ar'
);
```

---

### المرحلة 5: تفعيل Webhooks

#### 5.1 إعداد Webhook URL
1. اذهب إلى تطبيقك في Meta Developers
2. اختر "Settings" → "Basic"
3. ابحث عن "Webhooks"
4. انقر على "Add Subscriptions"
5. أدخل:
   - **Callback URL**: `https://your-domain.com/api/webhooks/whatsapp`
   - **Verify Token**: أي كلمة سرية قوية

#### 5.2 التحقق من Webhook
Meta سترسل طلب GET للتحقق. تأكد من أن الـ webhook يرد بـ:
```json
{
  "hub.challenge": "token_value"
}
```

#### 5.3 اختيار الأحداث
اختر الأحداث التالية:
- `messages` - استقبال الرسائل
- `message_template_status_update` - تحديثات حالة القوالب
- `message_template_quality_update` - تحديثات جودة القوالب

---

## 📊 معايير Meta الرسمية

### معايير الرسائل
1. **الطول**: الحد الأقصى 1024 حرف
2. **المتغيرات**: استخدم {{1}}, {{2}}, إلخ (الحد الأقصى 60)
3. **الروابط**: استخدم روابط كاملة فقط (لا روابط مختصرة)
4. **الكلمات المحظورة**: تجنب الكلمات المحظورة من Meta

### فئات القوالب
- **UTILITY**: تأكيدات، تذكيرات، تحديثات (بدون قيود على الوقت)
- **MARKETING**: عروض وإعلانات (مقيدة بساعات العمل)
- **AUTHENTICATION**: رموز التحقق

### معايير الجودة
- **الموافقة**: يجب أن يكون القالب معتمداً قبل الاستخدام
- **معدل الرفض**: إذا تم رفض القالب، ستظهر رسالة الخطأ
- **إعادة المحاولة**: يمكنك تعديل القالب وإعادة تقديمه

---

## 🔧 استخدام الـ API

### إرسال رسالة باستخدام قالب معتمد

```typescript
import { sendTemplateMessage } from "./services/whatsappTemplates";

// إرسال تأكيد موعد
const result = await sendTemplateMessage({
  phone: "+967771234567",
  templateName: "appointment_confirmation_ar",
  language: "ar",
  parameters: [
    { type: "text", value: "أحمد محمد" },           // {{1}} - الاسم
    { type: "text", value: "د. علي الأحمدي" },      // {{2}} - الطبيب
    { type: "text", value: "أسنان" },               // {{3}} - التخصص
    { type: "text", value: "2026-04-15" },          // {{4}} - التاريخ
    { type: "text", value: "02:00 PM" },            // {{5}} - الوقت
  ],
});
```

### التكامل التلقائي مع التسجيلات

عند تسجيل موعد جديد:

```typescript
// سيتم إرسال التأكيد تلقائياً
await sendAppointmentConfirmation(appointmentId);

// سيتم جدولة التذكيرات تلقائياً
await scheduleAppointmentReminder24h(appointmentId);
await scheduleAppointmentReminder1h(appointmentId);
```

---

## 📈 المراقبة والإحصائيات

### تتبع الرسائل
- جميع الرسائل المرسلة تُحفظ في جدول `whatsapp_messages`
- يمكنك متابعة:
  - عدد الرسائل المرسلة
  - معدل النجاح
  - معدل الفشل
  - أسباب الفشل

### تقارير Meta
1. اذهب إلى Meta Business Manager
2. اختر "WhatsApp" → "Analytics"
3. ستجد:
   - عدد الرسائل المرسلة
   - عدد الرسائل المستقبلة
   - معدل الاستجابة
   - جودة الحساب

---

## ⚠️ معالجة الأخطاء الشائعة

### خطأ: "Template not found"
**الحل**: تأكد من أن القالب مسجل في Meta وحالته "APPROVED"

### خطأ: "Invalid phone number"
**الحل**: تأكد من أن رقم الهاتف بصيغة دولية (+967...)

### خطأ: "Rate limit exceeded"
**الحل**: استخدم نظام الـ Queue لتأخير الرسائل

### خطأ: "Invalid parameter"
**الحل**: تأكد من عدد المتغيرات يطابق عدد {{}} في القالب

---

## 🔒 الأمان والامتثال

### حماية البيانات
- لا تشارك `META_ACCESS_TOKEN` مع أحد
- استخدم متغيرات البيئة فقط
- قم بتدوير التوكن بانتظام

### الامتثال
- التزم بسياسات Meta
- احترم خصوصية المستخدمين
- لا ترسل رسائل غير مرغوبة
- احترم ساعات العمل للرسائل التسويقية

---

## 📞 الدعم والمساعدة

### موارد Meta الرسمية
- [Meta Developers](https://developers.facebook.com)
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [WhatsApp Business Platform](https://www.whatsapp.com/business)

### الدعم الفني
- البريد الإلكتروني: support@meta.com
- منتدى المطورين: https://developers.facebook.com/community

---

## ✅ قائمة التحقق

- [ ] إنشاء تطبيق Meta
- [ ] الحصول على Access Token
- [ ] ربط رقم WhatsApp Business
- [ ] تشغيل سكريبت إضافة القوالب
- [ ] تسجيل جميع 16 قالب في Meta
- [ ] انتظار موافقة Meta (24-48 ساعة)
- [ ] تحديث حالة القوالب إلى APPROVED
- [ ] إعداد Webhooks
- [ ] اختبار إرسال رسالة تجريبية
- [ ] تفعيل التذكيرات المجدولة
- [ ] مراقبة الإحصائيات

---

## 📝 ملاحظات مهمة

1. **الامتثال**: جميع الرسائل يجب أن تستخدم قوالب معتمدة من Meta فقط
2. **الجودة**: حافظ على جودة الحساب بعدم إرسال رسائل غير مرغوبة
3. **التوثيق**: احتفظ بنسخة من جميع القوالب المعتمدة
4. **التحديثات**: تابع تحديثات Meta الرسمية

---

**آخر تحديث**: 2026-04-11
**الإصدار**: 1.0
