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

### إصلاح عاجل: getBySlug Query Errors ✅ مكتمل
- [x] إصلاح DoctorDetailPage - إضافة enabled condition
- [x] إصلاح OfferDetailPage - إضافة enabled condition
- [x] إصلاح CampDetailPage - إضافة enabled condition

### إصلاح وتحسين تسجيلات المخيمات ✅ مكتمل
- [x] إصلاح campRegistrations.list router - إضافة JOIN مع camps table
- [x] إصلاح عرض اسم المخيم في CampRegistrationsManagement (campTitle → campName)
- [x] إضافة فلترة حسب المخيم في CampRegistrationsManagement
- [x] إصلاح offerLeads.list router - إضافة JOIN مع offers table
- [x] إضافة فلترة حسب العرض في OfferLeadsManagement

### تحسين صفحة الأطباء وإدارتهم ✅ مكتمل
- [x] إنشاء doctors router منفصل مع CRUD procedures
- [x] إضافة create, update, delete, toggleAvailability procedures
- [x] إنشاء DoctorsManagement component مع CRUD كامل
- [x] إضافة بطاقات إحصائيات (إجمالي، متاح، غير متاح)
- [x] إضافة بحث وفلترة للأطباء
- [x] إضافة نموذج إضافة/تعديل طبيب مع auto-generate slug
- [x] إضافة dialog تأكيد الحذف
- [x] إضافة tab "إدارة الأطباء" في AdminDashboard

### تحسين SEO و Open Graph Meta Tags ✅ مكتمل
- [x] إنشاء SEO component لإدارة meta tags ديناميكياً
- [x] إضافة Open Graph tags للصفحة الرئيسية (HomePage)
- [x] إضافة meta tags ديناميكية لصفحة تفاصيل الطبيب (DoctorDetailPage)
- [x] إضافة meta tags ديناميكية لصفحات العروض (OfferDetailPage)
- [x] إضافة meta tags ديناميكية لصفحات المخيمات (CampDetailPage)
- [x] دعم Twitter Cards و WhatsApp preview

### إصلاح Open Graph Meta Tags ✅ مكتمل
- [x] إضافة meta tags ثابتة في index.html
- [x] إضافة og:image, og:title, og:description, og:url
- [x] إضافة Twitter Card meta tags
- [x] إضافة SEO meta tags (description, keywords, author)

### تحسين شامل لنظام حجز الأطباء 🔄 جاري العمل

#### المرحلة 1: تحديث Schema ✅
- [x] إضافة حقل `procedures` (الإجراءات) في doctors table
- [x] إضافة حقل `isVisiting` (طبيب زائر) في doctors table
- [x] إضافة حقول جديدة في appointments table: `age`, `procedure`, `additionalNotes`
- [x] إضافة حقل `staffNotes` في appointments table
- [x] تطبيق التغييرات على قاعدة البيانات

#### المرحلة 2: تحسين صفحة حجز الأطباء ✅
- [x] إنشاء صفحة Doctors.tsx جديدة
- [x] إضافة Navbar في الصفحة
- [x] إضافة بحث وفلترة حسب التخصص
- [x] جعل بطاقة الطبيب قابلة للنقر للانتقال لصفحة التفاصيل
- [x] إخفاء الأطباء غير المتاحين (available = 'no')
- [x] تحسين التصميم بنفس نمط باقي الصفحات
- [x] إضافة SEO meta tags

#### المرحلة 3: تحسين نموذج الحجز ✅
- [x] إضافة حقل العمر
- [x] إضافة dropdown للإجراءات (من procedures الطبيب)
- [x] جعل البريد الإلكتروني اختياري
- [x] إضافة مربع ملاحظات إضافية
- [x] تحديث validation
- [x] تحديث appointments router لدعم الحقول الجديدة

#### المرحلة 4: تحسين إدارة الحجوزات في لوحة التحكم ✅
- [x] إضافة إمكانية تعديل معلومات المريض
- [x] إضافة حقل ملاحظات الموظف
- [x] تحسين تغيير حالة الحجز
- [x] عرض جميع الحقول الجديدة (العمر، الإجراء، الملاحظات)
- [x] تحديث AdminDashboard لعرض الحقول الجديدة
- [x] تحديث getAllAppointments لجلب الحقول الجديدة
- [x] تحديث updateAppointmentStatus لدعم staffNotes

#### المرحلة 5: قسم الأطباء الزائرين ✅
- [x] إضافة select "طبيب زائر" في نموذج إضافة/تعديل طبيب
- [x] إضافة حقل procedures في DoctorsManagement
- [x] إنشاء صفحة VisitingDoctors.tsx
- [x] إضافة route في App.tsx
- [x] إضافة link في Navbar
- [x] فلترة الأطباء الزائرين (isVisiting = 'yes') في الصفحة الجديدة

### إصلاح أخطاء قاعدة البيانات ✅ مكتمل
- [x] فحص حالة قاعدة البيانات والأعمدة الموجودة
- [x] تطبيق migration للأعمدة الجديدة في appointments (age, procedure, additionalNotes, staffNotes)
- [x] الأعمدة في doctors (procedures, isVisiting) موجودة مسبقاً
- [x] إصلاح خطأ "Campaign not found" - إنشاء campaign تلقائياً
- [x] إصلاح أخطاء TypeScript

### إصلاح حقل "طبيب زائر" ✅ مكتمل
- [x] فحص DoctorsManagement component وحقل isVisiting
- [x] فحص doctors.create و doctors.update في server/routers/doctors.ts
- [x] إضافة procedures و isVisiting إلى input schema
- [x] تغيير isVisiting في schema.ts من boolean إلى mysqlEnum
- [x] تحديث قاعدة البيانات (حذف وإعادة إضافة العمود)

### تحسين توافق لوحة التحكم للجوال ✅ مكتمل
- [x] فحص AdminDashboard وتحديد مشاكل العرض على الجوال
- [x] تحسين الجداول - إخفاء أعمدة غير ضرورية على الجوال
- [x] تحسين البطاقات الإحصائية - grid responsive وحجم نصوص
- [x] تحسين الحوارات - max-width و overflow للجوال
- [x] تحسين الأزرار - نص مختصر على الجوال
- [x] تحسين tabs - scrollable على الجوال

### تحسين شامل واحترافي للجوال ✅ مكتمل
- [x] تحويل جداول العملاء والمواعيد إلى بطاقات على الجوال
- [x] إنشاء LeadCard و AppointmentCard components
- [x] تحسين header - إخفاء عناصر غير ضرورية على الجوال
- [x] تحسين tabs - نصوص مختصرة على الجوال وscrollable
- [x] تحسين حقول البحث - أصغر وأكثر ملاءمة
- [x] إضافة CardSkeleton component
- [x] تحسين spacing وpadding للبطاقات

### تحسينات إضافية للجوال والميزات الجديدة ✅ مكتمل

#### حجوزات العروض والمخيمات
- [x] إنشاء OfferLeadCard component لحجوزات العروض
- [x] إنشاء CampRegistrationCard component لتسجيلات المخيمات
- [x] تطبيق عرض البطاقات في OfferLeadsManagement
- [x] تطبيق عرض البطاقات في CampRegistrationsManagement

#### إدارة العروض والمخيمات
- [x] جداول إدارة العروض والمخيمات موجودة في AdminDashboard
- [x] نماذج الإضافة/التعديل responsive مسبقاً

#### إدارة الأطباء
- [x] إضافة 3 بطاقات إحصائية للأطباء الزائرين (إجمالي، متاح، غير متاح)
- [x] جدول الأطباء موجود في DoctorsManagement
- [x] نماذج إضافة/تعديل الأطباء responsive مسبقاً

#### أزرار الاتصال والواتساب
- [x] إضافة أزرار الاتصال والواتساب في LeadCard
- [x] إضافة أزرار الاتصال والواتساب في AppointmentCard
- [x] إضافة أزرار الاتصال والواتساب في OfferLeadCard
- [x] إضافة أزرار الاتصال والواتساب في CampRegistrationCard
- [x] أزرار الواتساب موجودة في عرض الجداول (desktop)

#### الشريط أعلى الصفحة
- [x] header محسّن مسبقاً في التحديث السابق

### تحويل المنصة إلى PWA ✅ مكتمل
- [x] إنشاء manifest.json مع البيانات الأساسية (name, icons, theme_color, shortcuts)
- [x] إنشاء أيقونات PWA بأحجام مختلفة (72-512px)
- [x] إنشاء favicon.ico و apple-touch-icon.png
- [x] إنشاء Service Worker (sw.js) لدعم offline caching
- [x] إضافة استراتيجية cache-first للملفات الثابتة
- [x] إضافة network-first للصفحات
- [x] إضافة دعم Push Notifications API
- [x] إضافة notification click handler
- [x] تحديث index.html بـ PWA meta tags و manifest link
- [x] إنشاء PWAManager component
- [x] إضافة زر تثبيت عائم (floating button)
- [x] إضافة dialog للتثبيت بعد 30 ثانية
- [x] إضافة زر تفعيل الإشعارات
- [x] دمج PWAManager في App.tsx

### تحسينات شاملة للوحة التحكم 🔄 جاري العمل

#### 1. إصلاح header لوحة التحكم للجوال ✅
- [x] إصلاح تنسيق header - إضافة truncate و flex-shrink-0
- [x] تحسين ترتيب العناصر وresponsive breakpoints
- [x] إظهار جميع الأزرار بشكل مناسب

#### 2. تحسين بطاقات الإحصائيات وأزرار الإدارة ✅
- [x] بطاقات الأطباء الزائرين موجودة مسبقاً
- [x] إضافة 3 بطاقات إحصائية في إدارة العروض (إجمالي، نشطة، غير نشطة)
- [x] إضافة 3 بطاقات إحصائية في إدارة المخيمات (إجمالي، نشطة، غير نشطة)
- [x] تحسين زر الإضافة responsive (w-full sm:w-auto)

#### 3. تعديل تبويب العملاء المسجلين ❌ ملغى
- [x] تم الاستغناء عن الدمج - الفلترة أفضل للتنظيم

#### 4. إضافة فلترة متقدمة ✅ مكتمل
- [x] إضافة فلترة بالطبيب في مواعيد الأطباء
- [x] إضافة فلترة بالتاريخ (اليوم، الأسبوع، الشهر) في تبويب العملاء
- [x] إضافة فلترة بالتاريخ في حجوزات العروض
- [x] إضافة فلترة بالتاريخ في تسجيلات المخيمات
- [x] إضافة فلترة بالتاريخ في مواعيد الأطباء
- [x] تحديث filteredAppointments لدعم فلترة الطبيب + التاريخ
- [x] تحديث filteredLeads لدعم فلترة التاريخ
- [x] تحديث filteredOfferLeads لدعم فلترة التاريخ
- [x] تحديث filteredCampRegistrations لدعم فلترة التاريخ

#### 5. تخصيص PWA للوحة التحكم ✅ مكتمل
- [x] تخصيص PWAManager ليعمل فقط في /dashboard
- [x] توليد أيقونات PWA من شعار المستشفى الفعلي (72-512px)
- [x] توليد favicon.ico و apple-touch-icon.png
- [x] تحديث manifest.json (الاسم، start_url، scope، theme_color، shortcuts)

#### 6. Offline Experience متقدمة ✅ مكتمل
- [x] إنشاء صفحة OfflinePage.tsx متكاملة
- [x] عرض المواعيد المحفوظة محلياً من IndexedDB
- [x] دعم IndexedDB لحفظ المواعيد والحجوزات pending
- [x] تطبيق background sync في Service Worker
- [x] تحديث Service Worker لدعم offline caching أفضل
- [x] إضافة route /offline في App.tsx
- [x] عرض حالة الاتصال (online/offline) في الصفحة

### إصلاح Vite WebSocket HMR ✅ مكتمل
- [x] تحديث vite.config.ts لإصلاح WebSocket connection في sandbox
- [x] إضافة server.hmr configuration (protocol: wss, clientPort: 443)
- [x] إعادة تشغيل dev server وتطبيق الإعدادات الجديدة

### إصلاح PWA 404 عند فتح التطبيق ✅ مكتمل
- [x] تحليل المشكلة: start_url=/dashboard يتطلب تسجيل دخول → 404
- [x] تغيير start_url في manifest.json من /dashboard إلى /
- [x] تغيير scope في manifest.json من /dashboard إلى /
- [x] تحديث اسم ووصف التطبيق ليكون عام (منصة الحجز)
- [x] إضافة auto-redirect في HomePage: إذا admin مسجل دخول → /dashboard
- [x] إضافة loading state أثناء فحص المصادقة
