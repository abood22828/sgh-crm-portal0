# WhatsApp Cloud API Integration - TODO

## ✅ المرحلة 1: التخطيط والتوثيق
- [x] إنشاء توثيق شامل للقوالب المطلوبة (WHATSAPP_TEMPLATES_REQUIRED.md)
- [x] تعديل خدمة whatsappIntegration.ts لاستخدام القوالب
- [x] إنشاء سكريبت إضافة القوالب (seed-whatsapp-templates.mjs)
- [x] إنشاء دليل تكامل Meta الرسمي (META_INTEGRATION_GUIDE.md)

## ⏳ المرحلة 2: إعداد Meta Business Manager
- [ ] إنشاء تطبيق Meta جديد
- [ ] الحصول على Access Token الدائم
- [ ] ربط رقم WhatsApp Business (+967...)
- [ ] التحقق من رقم الهاتف عبر SMS
- [ ] إعداد ملف الأعمال في Meta

## ⏳ المرحلة 3: إضافة القوالب إلى قاعدة البيانات
- [ ] تشغيل سكريبت seed-whatsapp-templates.mjs
- [ ] التحقق من إضافة جميع 16 قالب
- [ ] التحقق من البيانات في جدول whatsapp_templates

## ⏳ المرحلة 4: تسجيل القوالب في Meta
- [ ] تسجيل `appointment_confirmation_ar`
- [ ] تسجيل `camp_registration_confirmation_ar`
- [ ] تسجيل `offer_booking_confirmation_ar`
- [ ] تسجيل `appointment_reminder_24h_ar`
- [ ] تسجيل `appointment_reminder_1h_ar`
- [ ] تسجيل `appointment_status_confirmed_ar`
- [ ] تسجيل `appointment_status_cancelled_ar`
- [ ] تسجيل `appointment_status_rescheduled_ar`
- [ ] تسجيل `appointment_status_completed_ar`
- [ ] تسجيل `appointment_followup_ar`
- [ ] تسجيل `camp_followup_ar`
- [ ] تسجيل `camp_cancellation_ar`
- [ ] تسجيل `offer_cancellation_ar`
- [ ] تسجيل `welcome_message_ar`
- [ ] تسجيل `new_offer_announcement_ar`

## ⏳ المرحلة 5: انتظار موافقة Meta
- [ ] انتظار موافقة Meta على جميع القوالب (24-48 ساعة)
- [ ] مراقبة حالة القوالب في Meta Business Manager
- [ ] تسجيل أي رسائل خطأ أو رفض

## ⏳ المرحلة 6: تحديث حالة القوالب
- [ ] تحديث metaStatus إلى 'APPROVED' لجميع القوالب
- [ ] التحقق من تحديث قاعدة البيانات

## ⏳ المرحلة 7: إعداد Webhooks
- [ ] إعداد Webhook URL في Meta
- [ ] اختيار الأحداث المطلوبة
- [ ] اختبار استقبال الأحداث

## ⏳ المرحلة 8: الاختبار
- [ ] اختبار إرسال تأكيد موعد
- [ ] اختبار إرسال تأكيد مخيم
- [ ] اختبار إرسال تأكيد عرض
- [ ] اختبار إرسال تذكير 24 ساعة
- [ ] اختبار إرسال تذكير 1 ساعة
- [ ] اختبار تحديثات الحالة (تأكيد، إلغاء، إعادة جدولة، إكمال)
- [ ] اختبار المتابعة والإلغاء

## ⏳ المرحلة 9: المراقبة والإحصائيات
- [ ] إعداد لوحة تحكم للإحصائيات
- [ ] متابعة معدل النجاح
- [ ] متابعة معدل الفشل
- [ ] تحليل الأخطاء الشائعة

## ⏳ المرحلة 10: التحسينات المستقبلية
- [ ] إضافة قوالب إضافية حسب الحاجة
- [ ] تحسين جودة الرسائل
- [ ] إضافة دعم اللغة الإنجليزية
- [ ] تحسين معدل الاستجابة

---

## 📋 ملاحظات مهمة

### المتطلبات المسبقة
- حساب Meta Business Manager نشط
- رقم WhatsApp Business معتمد
- Access Token دائم من Meta

### المعايير المطلوبة
- جميع الرسائل يجب أن تستخدم قوالب معتمدة من Meta فقط
- عدم استخدام رسائل نصية عادية (sendTextMessage)
- الالتزام بسياسات Meta الرسمية

### الأمان
- لا تشارك META_ACCESS_TOKEN مع أحد
- استخدم متغيرات البيئة فقط
- قم بتدوير التوكن بانتظام

---

## 🔗 الموارد المرتبطة
- WHATSAPP_TEMPLATES_REQUIRED.md - توثيق القوالب
- META_INTEGRATION_GUIDE.md - دليل التكامل
- server/services/whatsappIntegration.ts - الخدمة الرئيسية
- scripts/seed-whatsapp-templates.mjs - سكريبت الإضافة

---

**آخر تحديث**: 2026-04-11
**الحالة**: جاهز للبدء
