# Project TODO

## تطبيق WhatsApp Cloud API - المرحلة 1: الإعداد الأساسي ✅ مكتمل

### تثبيت المكتبات والإعدادات الأساسية
- [x] تثبيت @awadoc/whatsapp-cloud-api
- [x] تثبيت @kapso/whatsapp-cloud-api
- [x] تثبيت bull (Queue system)
- [x] تثبيت redis (لـ Queue)
- [x] تثبيت zod (للـ validation)

### إنشاء ملفات الإعدادات
- [x] إنشاء server/config/whatsapp.ts
- [x] إنشاء server/services/whatsappService.ts
- [x] تحديث server/queues/whatsappQueue.ts
- [x] إنشاء server/webhooks/whatsappWebhook.ts
- [x] تحديث server/_core/env.ts بإضافة webhookVerifyToken

---

## تطبيق WhatsApp Cloud API - المرحلة 2: الميزات الأساسية ✅ مكتمل

### إنشاء tRPC Procedures
- [x] تحديث server/routers/whatsapp.ts
- [x] إضافة procedure لإرسال رسالة نصية (sendSimpleText)
- [x] إضافة procedure لإرسال رسالة ترحيب (sendWelcomeMsg)
- [x] إضافة procedure لإرسال تأكيد حجز (sendBookingConfirmationMsg)
- [x] إضافة procedure لحالة الخدمة (health)
- [x] إضافة procedure لاختبار الاتصال (testConnection)
- [x] إضافة procedure لتوحيد رقم الهاتف (normalizePhone)

### واجهة المستخدم الأساسية
- [x] إنشاء client/src/pages/WhatsAppDashboard.tsx
- [x] عرض إحصائيات الخدمة
- [x] عرض حالة الاتصال
- [x] إضافة زر إرسال رسالة اختبار
- [x] إضافة زر اختبار الاتصال
- [x] عرض توحيد رقم الهاتف

### دعم Marketing Messages API
- [x] إضافة دعم Message Templates (في whatsappService.ts)
- [x] إضافة دعم Interactive Messages (في whatsappService.ts)
- [x] إضافة دعم Media Messages (في whatsappService.ts)
- [x] إضافة دعم Buttons و Quick Replies (في whatsappService.ts)

### معالجة Webhooks الإضافية
- [x] معالجة message_template_status_update (في whatsappWebhook.ts)
- [x] معالجة account_alerts (في whatsappWebhook.ts)
- [x] معالجة delivery_status (في whatsappWebhook.ts)
- [x] معالجة read_receipts (في whatsappWebhook.ts)

### Rate Limiting و Validation
- [x] إضافة Zod validation للرسائل
- [x] معالجة الأخطاء الشاملة
- [x] إضافة logging مفصل
- [x] إضافة exponential backoff في Queue

---

## تطبيق WhatsApp Cloud API - المرحلة 3: الميزات المتقدمة ✅ مكتمل

### دعم Message Templates المتقدم
- [x] إنشاء server/services/whatsappTemplates.ts
- [x] procedure لإرسال قالب مع متغيرات (sendTemplate)
- [x] procedure لقائمة القوالب المتاحة (getTemplates)
- [x] procedure لحالة القالب (getTemplateStatus)
- [x] دعم الوسائط (صور، فيديو، مستندات، صوت)

### نظام Broadcast للرسائل الجماعية
- [x] إنشاء server/services/whatsappBroadcast.ts
- [x] procedure لإرسال رسالة جماعية (sendBroadcast)
- [x] procedure لتتبع حالة البث (getBroadcastStatus)
- [x] procedure لإحصائيات البث (getBroadcastStats)
- [x] دعم الجدولة المتقدمة (scheduleBroadcast)

### نظام Auto Replies
- [x] إنشاء server/services/whatsappAutoReply.ts
- [x] procedure لإضافة قاعدة auto reply (addAutoReplyRule)
- [x] procedure لحذف قاعدة auto reply (deleteAutoReplyRule)
- [x] procedure لقائمة القواعد (getAutoReplyRules)
- [x] معالجة الرسائل الواردة تلقائياً (processIncomingMessage)

### لوحة تحكم متقدمة
- [x] إنشاء client/src/pages/WhatsAppAnalytics.tsx
- [x] عرض إحصائيات الرسائل (مرسلة، مستقبلة، فشلت)
- [x] رسوم بيانية للاتجاهات (Line Chart)
- [x] عرض أنواع الرسائل (Pie Chart)
- [x] إرسال بث جماعي من الواجهة
- [x] إدارة قواعس الرد التلقائي

### المهام المتبقية (المرحلة 4):
- [ ] تكامل مع نظام الحجوزات
- [ ] إرسال تأكيد تلقائي عند الحجز
- [ ] إرسال تذكير قبل الموعد
- [ ] إرسال رسالة بعد الموعد
- [ ] تتبع رد العميل
- [ ] تشفير الرسائل الحساسة
- [ ] تسجيل جميع العمليات (audit log)
- [ ] التحقق من الامتثال لـ Meta guidelines
- [ ] معالجة opt-out requests
- [ ] إدارة قائمة المحظورين

---

## ملاحظات عامة:
- Redis غير متصل حالياً (اختياري - يمكن إرسال الرسائل مباشرة)
- جميع الـ procedures محمية بـ protectedProcedure
- التحقق من صحة البيانات مع Zod
- معالجة الأخطاء الشاملة
- تم اختبار الاتصال الأساسي


## تطبيق WhatsApp Cloud API - المرحلة 4: التكامل والأمان 🔒 جاري التطبيق

### تكامل مع نظام الحجوزات (Appointments)
- [ ] إنشاء server/services/whatsappAppointments.ts
- [ ] procedure لإرسال تأكيد حجز تلقائي
- [ ] procedure لإرسال تذكير قبل الموعد (24 ساعة)
- [ ] procedure لإرسال تذكير قبل الموعد (1 ساعة)
- [ ] procedure لإرسال رسالة بعد الموعد (متابعة)
- [ ] تتبع رد العميل على الرسائل
- [ ] إدارة حالة الحجز بناءً على رد العميل

### نظام Audit Log والتسجيل
- [ ] إنشاء server/services/whatsappAuditLog.ts
- [ ] تسجيل جميع الرسائل المرسلة
- [ ] تسجيل جميع الرسائل الواردة
- [ ] تسجيل الأخطاء والمشاكل
- [ ] تسجيل تغييرات الحالة
- [ ] procedure لاستعلام سجل العمليات
- [ ] procedure لتصدير التقارير

### الأمان والامتثال (Security & Compliance)
- [ ] إنشاء server/services/whatsappSecurity.ts
- [ ] تشفير الرسائل الحساسة (OTP، كلمات مرور)
- [ ] معالجة opt-out requests
- [ ] إدارة قائمة المحظورين
- [ ] التحقق من Meta guidelines
- [ ] معالجة الرسائل المحظورة
- [ ] تطبيق Rate Limiting
- [ ] معالجة الأخطاء الأمنية

### لوحة تحكم الحجوزات
- [ ] إنشاء client/src/pages/WhatsAppAppointments.tsx
- [ ] عرض الحجوزات المنتظرة الرسائل
- [ ] عرض الحجوزات المؤكدة
- [ ] عرض الحجوزات الملغاة
- [ ] إرسال تذكيرات يدوية
- [ ] إعادة إرسال الرسائل الفاشلة

### لوحة تحكم الأمان والامتثال
- [ ] إنشاء client/src/pages/WhatsAppCompliance.tsx
- [ ] عرض سجل العمليات (Audit Log)
- [ ] عرض الأخطاء والمشاكل
- [ ] عرض قائمة المحظورين
- [ ] إدارة opt-out requests
- [ ] إحصائيات الامتثال

### اختبارات شاملة
- [ ] اختبار تكامل الحجوزات
- [ ] اختبار الرسائل المجدولة
- [ ] اختبار معالجة الأخطاء
- [ ] اختبار الأمان
- [ ] اختبار الامتثال
- [ ] اختبار الأداء تحت الحمل
