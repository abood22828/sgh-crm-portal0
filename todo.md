# مهام المشروع - منصة الحجز

## الميزات المدمجة من المبرمج علي

- [x] إضافة جدول العروض (offers) في قاعدة البيانات
- [x] إضافة جدول المخيمات (camps) في قاعدة البيانات
- [x] إنشاء offers router مع CRUD كامل
- [x] إنشاء camps router مع CRUD كامل
- [x] إنشاء صفحة العروض العامة (/offers)
- [x] إنشاء صفحة المخيمات العامة (/camps)
- [x] إضافة إدارة العروض في لوحة التحكم
- [x] إضافة إدارة المخيمات في لوحة التحكم

## إعادة هيكلة المنصة - 4 مراحل

### المرحلة 1: الصفحات الفردية ✅ جاري العمل
- [x] إنشاء صفحة رئيسية جديدة
- [x] إنشاء Navbar موحد
- [x] إنشاء Footer موحد
- [x] إضافة حقول slug, experience, languages, consultationFee إلى جدول doctors
- [x] إضافة getBySlug procedure في doctors router
- [x] إنشاء صفحة فردية للطبيب (DoctorDetailPage.tsx)
- [x] إنشاء صفحة فردية للعرض (OfferDetailPage.tsx)
- [x] إنشاء صفحة فردية للمخيم (CampDetailPage.tsx)
- [x] إضافة slug routing في App.tsx
- [x] التحقق من وجود حقل slug في جداول offers و camps

### المرحلة 2: صفحات القوائم والهوية
- [ ] تطوير صفحة قائمة الأطباء مع بطاقات جذابة
- [ ] تطوير صفحة قائمة العروض مع بطاقات
- [ ] تطوير صفحة قائمة المخيمات مع نبذة
- [ ] توحيد الألوان (أخضر وأزرق)
- [ ] إضافة زر الرجوع في كل صفحة

### المرحلة 3: لوحة التحكم المتقدمة
- [ ] إضافة سجل حجوزات الأطباء مع فلترة
- [ ] إضافة سجل طلبات العروض مع فلترة
- [ ] إضافة سجل تسجيلات المخيمات (لكل مخيم)
- [ ] إضافة بحث متقدم في كل سجل
- [ ] تحسين واجهة لوحة التحكم

### المرحلة 4: التكاملات والتقارير
- [ ] إضافة زر إرسال واتساب في السجلات
- [ ] إضافة صفحة تقارير Meta Pixel
- [ ] إضافة نموذج التسجيل اليدوي للحجوزات
- [ ] اختبار شامل لجميع الميزات


### المرحلة 3: لوحة التحكم المتقدمة ✅ مكتمل
- [x] إضافة جدول offerLeads لحجوزات العروض
- [x] إضافة جدول campRegistrations لتسجيلات المخيمات
- [x] إضافة offerLeadsRouter لإدارة حجوزات العروض
- [x] إضافة campRegistrationsRouter لإدارة تسجيلات المخيمات
- [x] ربط الـ routers الجديدة في appRouter
- [x] إنشاء مكون OfferLeadsManagement مع إحصائيات وفلترة
- [x] إنشاء مكون CampRegistrationsManagement مع إحصائيات وفلترة
- [x] تحديث AdminDashboard بسجلات منفصلة للعروض
- [x] تحديث AdminDashboard بسجلات منفصلة للمخيمات
- [x] إضافة فلترة متقدمة (حسب الاسم، الهاتف، البريد)
- [x] إضافة إحصائيات لكل نوع حجز

### المرحلة 4: التكاملات والتقارير ✅ مكتمل
- [x] إضافة أزرار WhatsApp في جميع السجلات (leads, appointments, offerLeads, campRegistrations)
- [x] إنشاء نموذج تسجيل يدوي للحجوزات الهاتفية
- [x] إضافة تصدير Excel لجميع أنواع الحجوزات

### المرحلة 5: إشعارات Telegram وتقارير السوشيال ميديا ✅ مكتمل
- [x] إيقاف إرسال البيانات إلى Meta (Facebook Conversion API)
- [x] إضافة إشعارات Telegram للحجوزات الجديدة (@abood22828)
- [x] إنشاء صفحة تقارير شاملة لأداء Instagram و Facebook
- [x] إضافة زر التقارير في header لوحة التحكم

### المرحلة 6: ربط تقارير حقيقية من Meta Graph API ✅ مكتمل
- [x] إنشاء Meta Graph API helper للتواصل مع Instagram و Facebook
- [x] إضافة tRPC procedures لجلب البيانات (Instagram Insights, Facebook Page Insights)
- [x] تحديث صفحة التقارير لاستخدام البيانات الحقيقية بدلاً من الأمثلة
- [x] إضافة loading states و error handling
- [x] زر تحديث البيانات يدوياً

### إصلاح عاجل: نماذج التسجيل ✅ مكتمل
- [x] فحص نموذج تسجيل العروض (OfferDetailPage)
- [x] فحص نموذج تسجيل المخيمات (CampDetailPage)
- [x] إصلاح مشكلة إرسال النماذج
- [x] تحديث OfferDetailPage لاستخدام offerLeads.submit
- [x] تحديث CampDetailPage لاستخدام campRegistrations.submit

### إصلاح عاجل: Nested Anchor Tags ✅ مكتمل
- [x] إصلاح nested `<a>` tags في Navbar - Logo
- [x] إصلاح nested `<a>` tags في Navbar - Desktop Navigation
- [x] إصلاح nested `<a>` tags في Navbar - Mobile Navigation
