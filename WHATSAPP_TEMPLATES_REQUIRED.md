# قوالب WhatsApp المطلوبة - المستشفى السعودي الألماني

## معايير Meta الرسمية
- جميع القوالب يجب أن تكون معتمدة من Meta
- الفئة: UTILITY (للتأكيدات والتذكيرات) أو MARKETING (للعروض)
- اللغة: ar (العربية)
- المتغيرات: استخدام {{1}}, {{2}}, {{3}} إلخ

---

## 1. قوالب تأكيدات الحجوزات (CONFIRMATION)

### 1.1 تأكيد موعد طبي
**Template Name:** `appointment_confirmation_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
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

**Variables:** [name, doctor_name, specialty, date, time]

---

### 1.2 تأكيد تسجيل مخيم طبي
**Template Name:** `camp_registration_confirmation_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

تم تأكيد تسجيلك في المخيم الطبي بنجاح ✅

🏥 المخيم: {{2}}
📅 التاريخ: {{3}} - {{4}}
📍 الموقع: {{5}}
👥 الفئة: {{6}}

شكراً لمشاركتك معنا!
```

**Variables:** [name, camp_name, start_date, end_date, location, category]

---

### 1.3 تأكيد حجز عرض خاص
**Template Name:** `offer_booking_confirmation_ar`
**Category:** MARKETING
**Language:** ar
**Content:**
```
مرحباً {{1}},

شكراً لاهتمامك بعرضنا الخاص! 🎁

💰 العرض: {{2}}
📝 التفاصيل: {{3}}
⏰ صلاحية العرض: {{4}}

سيتواصل معك فريقنا قريباً لتأكيد التفاصيل.

شكراً لاختيارك المستشفى السعودي الألماني
```

**Variables:** [name, offer_title, offer_details, expiry_date]

---

## 2. قوالب التذكيرات (REMINDER)

### 2.1 تذكير قبل الموعد (24 ساعة)
**Template Name:** `appointment_reminder_24h_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

تذكير: لديك موعد طبي غداً! ⏰

📋 التفاصيل:
• الطبيب: {{2}}
• الوقت: {{3}}
• الموقع: شارع الستين الشمالي - صنعاء

الرجاء التأكد من وصولك قبل الموعد بـ 15 دقيقة.
```

**Variables:** [name, doctor_name, time]

---

### 2.2 تذكير قبل الموعد (1 ساعة)
**Template Name:** `appointment_reminder_1h_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

تذكير: موعدك الطبي بعد ساعة واحدة! ⏰

الرجاء التأكد من وصولك الآن.

📍 الموقع: شارع الستين الشمالي - صنعاء
📞 للاستفسارات: {{2}}
```

**Variables:** [name, phone_number]

---

## 3. قوالب تحديثات الحالة (STATUS_UPDATE)

### 3.1 تحديث حالة الموعد - تأكيد
**Template Name:** `appointment_status_confirmed_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

✅ تم تأكيد موعدك الطبي بنجاح

📅 الموعد: {{2}}
⏰ الوقت: {{3}}
👨‍⚕️ الطبيب: {{4}}

شكراً لاختيارك المستشفى السعودي الألماني
```

**Variables:** [name, date, time, doctor_name]

---

### 3.2 تحديث حالة الموعد - إلغاء
**Template Name:** `appointment_status_cancelled_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

❌ تم إلغاء موعدك الطبي

📅 الموعد: {{2}}
📝 السبب: {{3}}

للحجز مرة أخرى، يرجى التواصل معنا:
📞 {{4}}
```

**Variables:** [name, date, reason, phone_number]

---

### 3.3 تحديث حالة الموعد - إعادة جدولة
**Template Name:** `appointment_status_rescheduled_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

📅 تم إعادة جدولة موعدك الطبي

الموعد الجديد:
📅 التاريخ: {{2}}
⏰ الوقت: {{3}}
👨‍⚕️ الطبيب: {{4}}

شكراً لتفهمك
```

**Variables:** [name, new_date, new_time, doctor_name]

---

### 3.4 تحديث حالة الموعد - إكمال
**Template Name:** `appointment_status_completed_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

✨ شكراً لزيارتك!

نتمنى لك الشفاء العاجل وتحسن صحتك.

إذا كنت بحاجة لموعد متابعة أو لديك أي استفسارات:
📞 {{2}}

شكراً لاختيارك المستشفى السعودي الألماني
```

**Variables:** [name, phone_number]

---

## 4. قوالب المتابعة (FOLLOW_UP)

### 4.1 متابعة بعد الموعد
**Template Name:** `appointment_followup_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

نتمنى أن تكون قد استفدت من زيارتك! 😊

📋 هل تحتاج إلى:
• موعد متابعة؟
• استشارة أخرى؟
• معلومات إضافية؟

تواصل معنا:
📞 {{2}}
💬 WhatsApp: {{3}}
```

**Variables:** [name, phone_number, whatsapp_number]

---

### 4.2 متابعة تسجيل مخيم
**Template Name:** `camp_followup_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

شكراً لمشاركتك في المخيم الطبي! 🏥

نتمنى أن تكون قد استفدت من الخدمات المقدمة.

هل لديك أي استفسارات أو تحتاج إلى:
📞 {{2}}
💬 WhatsApp: {{3}}
```

**Variables:** [name, phone_number, whatsapp_number]

---

## 5. قوالب الإلغاء (CANCELLATION)

### 5.1 إلغاء تسجيل مخيم
**Template Name:** `camp_cancellation_ar`
**Category:** UTILITY
**Language:** ar
**Content:**
```
مرحباً {{1}},

تم إلغاء تسجيلك في المخيم الطبي.

📅 المخيم: {{2}}
📝 السبب: {{3}}

للمزيد من المعلومات:
📞 {{4}}
```

**Variables:** [name, camp_name, reason, phone_number]

---

### 5.2 إلغاء عرض خاص
**Template Name:** `offer_cancellation_ar`
**Category:** MARKETING
**Language:** ar
**Content:**
```
مرحباً {{1}},

❌ انتهت صلاحية العرض الخاص

🎁 العرض: {{2}}
⏰ انتهى في: {{3}}

تابع معنا للحصول على عروض جديدة!
📞 {{4}}
```

**Variables:** [name, offer_title, expiry_date, phone_number]

---

## 6. قوالب الترحيب والتسويق (MARKETING)

### 6.1 رسالة ترحيب من المستشفى
**Template Name:** `welcome_message_ar`
**Category:** MARKETING
**Language:** ar
**Content:**
```
مرحباً {{1}},

أهلاً وسهلاً بك في المستشفى السعودي الألماني بصنعاء! 👋

🏥 نقدم لك:
• خدمات طبية متقدمة
• فريق طبي متخصص
• رعاية صحية شاملة

📞 للحجز والاستفسارات:
{{2}}

شارع الستين الشمالي - صنعاء
```

**Variables:** [name, phone_number]

---

### 6.2 عرض خاص جديد
**Template Name:** `new_offer_announcement_ar`
**Category:** MARKETING
**Language:** ar
**Content:**
```
مرحباً {{1}},

🎁 عرض خاص جديد!

{{2}}

💰 السعر: {{3}}
⏰ صلاحية العرض: {{4}}

احجز الآن:
📞 {{5}}
```

**Variables:** [name, offer_description, price, expiry_date, phone_number]

---

## ملاحظات مهمة:

1. **معايير Meta:**
   - كل قالب يجب أن يكون معتمداً من Meta قبل الاستخدام
   - المتغيرات يجب أن تكون بصيغة {{1}}, {{2}}, إلخ
   - الحد الأدنى للمتغيرات: 1، الحد الأقصى: 60

2. **الامتثال:**
   - لا تستخدم روابط مختصرة (URL shorteners)
   - لا تستخدم كلمات محظورة من Meta
   - تأكد من الامتثال لسياسات Meta

3. **التطبيق:**
   - يجب إنشاء جميع هذه القوالب في Meta Business Manager أولاً
   - بعد الموافقة، يتم مزامنتها مع النظام
   - استخدم `sendTemplateMessage` بدلاً من `sendTextMessage`

4. **الأولويات:**
   - الأساسية: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1-3.4
   - مهمة: 4.1, 4.2, 5.1, 5.2
   - اختيارية: 6.1, 6.2
