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


---

## مهام إضافية - تحسينات الواجهة والتنقل

### استرجاع واجهة الدردشة وتحسينات التنقل
- [ ] استرجاع واجهة الدردشة الأصلية في WhatsAppPage
- [ ] تعديل اسم لوحة التحكم الرئيسية إلى "الرسائل والمحادثات"
- [ ] تطبيق DashboardLayout على جميع صفحات WhatsApp الجديدة
- [ ] إضافة قائمة جانبية موحدة لجميع صفحات WhatsApp
- [ ] إضافة شريط تنقل علوي موحد لجميع صفحات WhatsApp
- [ ] إضافة صفحات WhatsApp الجديدة إلى قائمة الأدوات الجانبية
- [ ] إضافة أيقونات مناسبة لكل صفحة WhatsApp
- [ ] اختبار التنقل بين جميع صفحات WhatsApp


---

## ربط التسجيلات والحجوزات مع WhatsApp Cloud API 🔗

### ربط تسجيلات المخيمات
- [ ] إنشاء trigger عند إنشاء تسجيل مخيم جديد
- [ ] إرسال رسالة تأكيد الحجز تلقائياً
- [ ] إرسال تفاصيل المخيم (الموقع، الوقت، الطبيب)
- [ ] إرسال رابط إلغاء الحجز
- [ ] تحديث حالة التسجيل عند استقبال رد من العميل

### ربط مواعيد الأطباء
- [ ] إنشاء trigger عند إنشاء موعد طبيب جديد
- [ ] إرسال رسالة تأكيد الموعد تلقائياً
- [ ] إرسال تفاصيل الطبيب والعيادة والوقت
- [ ] إرسال تذكير قبل 24 ساعة من الموعد
- [ ] إرسال تذكير قبل 1 ساعة من الموعد
- [ ] إرسال رسالة بعد انتهاء الموعد (طلب تقييم)

### ربط حجز العروض
- [ ] إنشاء trigger عند إنشاء حجز عرض جديد
- [ ] إرسال رسالة تأكيد الحجز تلقائياً
- [ ] إرسال تفاصيل العرض والسعر والخصم
- [ ] إرسال رابط الدفع (إن وجد)
- [ ] إرسال تحديثات حالة الحجز

### تحديثات حالة الحجز
- [ ] إرسال رسالة عند تأكيد الحجز من الإدارة
- [ ] إرسال رسالة عند إلغاء الحجز
- [ ] إرسال رسالة عند تأجيل الحجز
- [ ] إرسال رسالة عند اكتمال الخدمة
- [ ] إرسال رسالة عند حدوث مشكلة في الحجز

### قاعدة البيانات
- [ ] إضافة جدول whatsapp_notifications لتتبع الرسائل المرسلة
- [ ] إضافة حقل whatsapp_status في جداول التسجيلات والمواعيد والحجوزات
- [ ] إضافة حقل whatsapp_message_id لتتبع معرف الرسالة
- [ ] إضافة حقل last_whatsapp_notification_at لتتبع آخر رسالة

### الـ Procedures
- [ ] إنشاء procedure لإرسال تأكيد المخيم
- [ ] إنشاء procedure لإرسال تأكيد الموعد الطبي
- [ ] إنشاء procedure لإرسال تأكيد العرض
- [ ] إنشاء procedure لإرسال التحديثات
- [ ] إنشاء procedure لتتبع حالة الرسائل

### الواجهات الأمامية
- [ ] إضافة شارة في صفحة المخيمات تظهر حالة إرسال الرسالة
- [ ] إضافة شارة في صفحة الأطباء تظهر حالة إرسال الرسالة
- [ ] إضافة شارة في صفحة العروض تظهر حالة إرسال الرسالة
- [ ] إضافة زر لإعادة إرسال الرسالة يدوياً
- [ ] إضافة سجل بجميع الرسائل المرسلة

### الاختبار
- [ ] اختبار إرسال تأكيد المخيم
- [ ] اختبار إرسال تأكيد الموعد الطبي
- [ ] اختبار إرسال تأكيد العرض
- [ ] اختبار التذكيرات المجدولة
- [ ] اختبار التحديثات التلقائية


---

## ✅ المرحلة الرابعة المنجزة - إصلاحات Meta API وتكامل الإشعارات

### إصلاح مزامنة قوالب WhatsApp مع Meta
- [x] إصلاح دالة syncTemplatesFromMeta لتحفظ القوالب في DB (كانت لا تحفظ شيئاً)
- [x] تصحيح هيكل استجابة Meta: response.data.data بدلاً من response.data
- [x] تحديث فئات القوالب إلى MARKETING/UTILITY/AUTHENTICATION
- [x] تحديث 22 قالب موجود في DB من الفئات القديمة
- [x] إصلاح category: "custom" في metaTemplateSync.ts
- [x] تحديث dropdowns الفئات في WhatsAppTemplatesPage.tsx

### تكامل الإشعارات مع قاعدة البيانات
- [x] إضافة جدول whatsapp_notifications في schema.ts
- [x] إضافة جدول whatsapp_blocked_numbers في schema.ts
- [x] إعادة كتابة whatsappAppointments.ts لاستخدام DB
- [x] إعادة كتابة whatsappSecurity.ts لاستخدام DB
- [x] إضافة دوال getNotificationLogs وgetNotificationStats
- [x] إضافة procedures getNotificationLogs وgetNotificationStats في whatsapp router

### ربط التسجيلات والمواعيد والعروض مع WhatsApp
- [x] إضافة trigger تلقائي في appointments.ts عند إنشاء موعد
- [x] إضافة trigger تلقائي في campRegistrations.ts عند التسجيل
- [x] إضافة trigger تلقائي في offerLeads.ts عند حجز عرض

### تحديث الواجهات
- [x] إعادة كتابة WhatsAppAppointments.tsx لتجلب البيانات الحقيقية من DB
- [x] إضافة إحصائيات الإشعارات (إجمالي، مرسلة، قيد الانتظار، فشل)
- [x] إضافة فلترة حسب نوع الكيان والحالة
- [x] إضافة pagination للسجلات
- [x] تحديث اسم "حجوزات واتساب" إلى "سجل الإشعارات" في الشريط الجانبي
