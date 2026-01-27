# مراجعة وثائق WhatsApp Business API - نتائج البحث

**التاريخ:** 27 يناير 2026  
**الهدف:** مراجعة شاملة لوثائق Meta لتطبيق أفضل الممارسات

---

## الصفحات المراجعة

### 1. الصفحة الرئيسية
- **الرابط:** https://developers.facebook.com/documentation/business-messaging/whatsapp/overview
- **الحالة:** قيد المراجعة

---

## الملاحظات والنتائج

(سيتم تحديث هذا الملف أثناء المراجعة)


## 1. Marketing Messages API for WhatsApp

**الرابط:** https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/overview  
**تاريخ التحديث:** 18 نوفمبر 2025  
**الحالة:** متاح الآن (General Availability)

### الميزات الرئيسية:

#### 1. **Boost and measure business results**
- **Automatic delivery optimizations**: الوصول إلى المزيد من الأشخاص الذين سيجدون الرسائل قيّمة
- **Performance benchmarks**: فهم أداء الرسالة مقارنة بالأعمال المماثلة
- **Tailored recommendations**: توصيات مخصصة لتحسين أداء الحملات

#### 2. **Enhance customer experience**
- **Automatic creative optimizations** (قيد الاختبار): معالجات إبداعية مثل تحريك الصور والفلترة
- **Richer media formats**: دعم GIFs
- **Time-to-live**: تجنب تسليم الرسائل غير ذات الصلة أو المتأخرة للحملات الحساسة للوقت

#### 3. **Upgrade easily**
- نفس البنية التقنية (schema) مثل Cloud API
- نفس نموذج الفوترة
- إمكانية استخدام أرقام الهواتف والقوالب الموجودة

### **نقطة مهمة جداً:**
> **إرسال جميع الرسائل التسويقية إلى `/marketing_messages` endpoint** للتوجيه التلقائي للرسائل المؤهلة

### الإحصائيات:
- اختبار A/B على ~12 مليون رسالة تسويقية في الهند (يناير 2025)
- تحسين كبير في معدلات القراءة والنقرات مقارنة بـ Cloud API العادي
- مستوى ثقة 95%

---


## 2. Get Started - Marketing Messages API

**الرابط:** https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/get-started  
**تاريخ التحديث:** 4 ديسمبر 2025

### المتطلبات الأساسية:
1. حساب WhatsApp Business نشط في دولة مؤهلة
2. قالب رسالة تسويقية معتمد
3. الاشتراك في webhook للرسائل

### خطوات التفعيل:

#### **Step 1: قبول شروط الخدمة**
- الانتقال إلى App Dashboard > WhatsApp > Quickstart
- البحث عن "Improve ROI with marketing messages with optimizations"
- النقر على "Get started" وقبول Terms of Service

#### **Step 2: إرسال رسالة تسويقية**
**نقطة حرجة:** استخدام `/marketing_messages` endpoint وليس `/messages`

```bash
curl 'https://graph.facebook.com/<API_VERSION>/<PHONE_NUMBER_ID>/marketing_messages' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "<USER_PHONE>",
    "type": "template",
    "template": {
      "name": "<TEMPLATE_NAME>",
      "language": {"code": "<LANG_CODE>"},
      "components": [...]
    }
  }'
```

#### **Step 3: التحقق من Webhook**
عند إرسال رسالة عبر MM API، سيحتوي webhook payload على:
```json
{
  "conversation": {
    "origin": {"type": "marketing_lite"}
  },
  "pricing": {
    "category": "marketing_lite"
  }
}
```

### القيود الجغرافية المهمة:

| المنطقة | القيود |
|---------|--------|
| **EEA, UK, Japan, South Korea** | ❌ لا توجد تحسينات تلقائية للتسليم<br>❌ لا توجد تقارير نقرات/تحويلات |
| **United States** | ⚠️ **اعتباراً من 1 أبريل 2025: لا يمكن إرسال رسائل تسويقية للمستخدمين في الولايات المتحدة** (error code 131049)<br>✅ يمكن للشركات الأمريكية إرسال رسائل لخارج الولايات المتحدة |
| **Cuba, Iran, North Korea, Syria, Ukraine (Crimea, Donetsk, Luhansk)** | ❌ غير مؤهلة تماماً |
| **Russia** | ⚠️ اعتباراً من 20 يونيو 2025:<br>❌ لا توجد تحسينات تلقائية<br>❌ لا توجد تقارير نقرات/تحويلات |

### **تحذير مهم للمستشفى السعودي الألماني:**
✅ اليمن غير مذكورة في القيود، لذا يمكن استخدام جميع الميزات بالكامل

---


## 3. Templates Overview

**الرابط:** https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview  
**تاريخ التحديث:** 5 ديسمبر 2025

### نقاط رئيسية:

#### **1. الاستخدام:**
- القوالب هي الطريقة الوحيدة لإرسال رسائل خارج نافذة خدمة العملاء (24 ساعة)
- تُستخدم عادة للرسائل الجماعية أو عندما لا توجد نافذة خدمة عملاء مفتوحة

#### **2. الإنشاء:**
- **الحد الأقصى:** 100 قالب في الساعة لكل WhatsApp Business Account
- يمكن الإنشاء عبر API أو WhatsApp Manager

#### **3. تسمية القوالب:**
- الأسماء ليست فريدة (يمكن تكرار نفس الاسم بلغات مختلفة)
- الحد الأقصى: 512 حرف
- **مهم:** lowercase alphanumeric + underscores فقط

#### **4. الفئات (Categories):**
- **AUTHENTICATION**: رسائل المصادقة (OTP، رموز التحقق)
- **MARKETING**: رسائل تسويقية (عروض، حملات)
- **UTILITY**: رسائل خدمية (تأكيدات، إشعارات)
- **تحذير:** التصنيف الخاطئ قد يؤدي لرفض القالب أو تعليق الحساب

#### **5. المتغيرات (Parameters):**

##### **Named Parameters** (موصى به):
```
{{first_name}} {{order_number}}
```
- يمكن ترتيبها بأي شكل عند الإرسال
- أسماء فريدة، lowercase + underscores

##### **Positional Parameters** (افتراضي):
```
{{1}} {{2}} {{3}}
```
- يجب ترتيبها بنفس الترتيب في النص
- تبدأ من 1 وليس 0

#### **6. اللغات:**
- يجب تحديد لغة عند الإنشاء
- Meta لا تترجم تلقائياً - المسؤولية على المطور
- كل قالب بلغة مختلفة يُحسب ضمن الحد الأقصى

#### **7. الوسائط (Media):**
- يمكن إضافة صور/فيديو/مستندات في header
- **مهم:** يجب استخدام Resumable Upload API للحصول على asset handle أولاً

#### **8. المراجعة (Review):**
- جميع القوالب تُراجع تلقائياً عند الإنشاء أو التعديل
- الحالة يجب أن تكون `APPROVED` قبل الإرسال
- يمكن رفض القوالب لأسباب متعددة (محتوى مضلل، انتهاك سياسات، إلخ)

#### **9. حالة القالب (Status):**
- `APPROVED`: جاهز للإرسال ✅
- `PENDING`: قيد المراجعة ⏳
- `REJECTED`: مرفوض ❌
- `PAUSED`: متوقف مؤقتاً (بسبب جودة منخفضة) ⚠️
- `DISABLED`: معطّل (انتهاك سياسات) 🚫

#### **10. التقييم (Quality Rating):**
- **GREEN**: جودة عالية ✅
- **YELLOW**: جودة متوسطة ⚠️
- **RED**: جودة منخفضة ❌ (قد يتم إيقاف القالب)
- يعتمد على: معدلات الحظر، الإبلاغ، عدم القراءة

#### **11. Time-to-Live (TTL):**
- مدة صلاحية الرسالة قبل انتهائها
- مفيد للرسائل الحساسة للوقت (عروض محدودة، OTP)

---


## 4. Webhooks Overview

**الرابط:** https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview/  
**تاريخ التحديث:** 2 ديسمبر 2025

### التعريف:
Webhooks هي طلبات HTTP تحتوي على JSON payloads ترسل من خوادم Meta إلى الخادم الخاص بك. تستخدم للإبلاغ عن الرسائل الواردة، حالة الرسائل الصادرة، وتغييرات مهمة أخرى.

### الصلاحيات المطلوبة:
- **whatsapp_business_messaging**: لـ messages webhooks
- **whatsapp_business_management**: لجميع الـ webhooks الأخرى

### أهم Webhook Fields للمنصة:

| Field | الوصف | الأولوية |
|-------|--------|----------|
| **messages** | رسائل واردة من المستخدمين + حالة الرسائل الصادرة | ⭐⭐⭐ عالية جداً |
| **message_template_status_update** | تغييرات في حالة القوالب (معتمد/مرفوض/متوقف) | ⭐⭐⭐ عالية جداً |
| **message_template_quality_update** | تغييرات في جودة القوالب (أخضر/أصفر/أحمر) | ⭐⭐ متوسطة |
| **account_alerts** | تغييرات في حدود الإرسال أو الملف التجاري | ⭐⭐ متوسطة |
| **business_capability_update** | تغييرات في قدرات الحساب (حدود الرسائل/الأرقام) | ⭐⭐ متوسطة |
| **user_preferences** | تغييرات في تفضيلات المستخدم للرسائل التسويقية | ⭐ منخفضة |

### معلومات تقنية مهمة:

#### **1. حجم Payload:**
- الحد الأقصى: **3 MB**

#### **2. إعادة المحاولة عند الفشل:**
- إذا لم يرجع الخادم HTTP 200، سيعيد Meta المحاولة لمدة **7 أيام**
- **تحذير:** قد يؤدي لتكرار الإشعارات

#### **3. الأمان (mTLS):**
- يدعم Mutual TLS لأمان إضافي
- موصى به بدلاً من تقييد IP addresses (لأن Meta تغير IPs بشكل دوري)

#### **4. هيكل Webhook للرسائل:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "...",
          "phone_number_id": "..."
        },
        "contacts": [...],
        "messages": [...]
      },
      "field": "messages"
    }]
  }]
}
```

#### **5. التحقق من Webhook:**
- يجب أن يرد endpoint على GET request مع `hub.challenge` للتحقق
- يجب أن يتحقق من `hub.verify_token` للأمان

#### **6. استكشاف الأخطاء:**
- تأكد من أن endpoint يقبل الطلبات
- أرسل test payload من App Dashboard
- تأكد من أن التطبيق في Live mode (بعض webhooks لا ترسل في Dev mode)
- استخدم test webhook endpoint للتأكد من المشكلة

---
