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

### تحسين تجربة الجوال وإصلاح RTL 🔄 جاري العمل

#### المرحلة 1: إصلاح RTL والصفحة الرئيسية ✅
- [x] إضافة dir="rtl" في HomePage, Doctors, Offers, Camps
- [x] إصلاح محاذاة النصوص العربية (text-right)
- [x] عكس اتجاه الأيقونات (mr → ml + rotate-180)
- [x] تحسين HomePage: أحجام responsive (text-2xl sm:text-3xl md:text-5xl)
- [x] تحسين Hero section وService Cards

#### المرحلة 2: صفحات الأطباء ✅
- [x] تحسين Doctors.tsx: RTL + responsive text sizes
- [x] تحسين Doctor Cards: text-right للخبرة واللغات
- [x] تحسين Search input: text-right

#### المرحلة 3: العروض والمخيمات ✅
- [x] تحسين OffersListPage: RTL + responsive (text-2xl sm:text-3xl md:text-5xl)
- [x] تحسين CampsListPage: RTL + responsive + text-right للفقرات

#### المرحلة 4: نماذج الحجز ✅
- [x] تحسين DoctorAppointments: responsive text (text-2xl sm:text-3xl md:text-4xl)
- [x] تحسين Doctors Grid: grid-cols-2 sm:grid-cols-3 md:grid-cols-4
- [x] تحسين Doctor Cards: line-clamp للأسماء الطويلة
- [x] تحسين Form: text-xl sm:text-2xl md:text-3xl

### إصلاح PWA 404 بسبب Caching ✅ مكتمل
- [x] تحديث Service Worker CACHE_NAME: v2 → v3
- [x] تحديث RUNTIME_CACHE: v2 → v3
- [x] تغيير PRECACHE_URLS: /dashboard → /
- [x] activate event يحذف old caches تلقائياً
- [x] manifest.json صحيح: start_url="/", scope="/"

## إكمال تحسينات الجوال وتوحيد العملاء 🔄 جاري العمل

### المرحلة 1: زر تثبيت PWA ✅ مكتمل
- [x] إنشاء InstallPWAButton component متكامل
- [x] إضافة beforeinstallprompt event handling
- [x] إضافة الزر في HomePage, Doctors, Offers, Camps
- [x] تصميم زر عائم مع أيقونة Download
- [x] إخفاء الزر بعد التثبيت أو إذا لم يكن متاح

### المرحلة 2: تحسين باقي الصفحات
- [ ] تحسين DoctorDetailPage: RTL + responsive
- [ ] تحسين OfferDetailPage: RTL + responsive
- [ ] تحسين CampDetailPage: RTL + responsive
- [ ] تحسين VisitingDoctors: RTL + responsive
- [ ] تحسين Navbar للجوال (hamburger menu)
- [ ] تحسين Footer للجوال

### المرحلة 3: توحيد تبويب العملاء ✅ مكتمل
- [x] إنشاء getAllUnifiedLeads في db.ts (يدمج: appointments + offerLeads + campRegistrations)
- [x] إضافة unifiedList endpoint في leads router
- [x] تحديث AdminDashboard لاستخدام trpc.leads.unifiedList
- [x] إضافة عمود "نوع التسجيل" في الجدول
- [x] إضافة badges ملونة: أزرق (موعد طبيب) + بنفسجي (عرض) + أخضر (مخيم)
- [ ] إضافة فلترة حسب نوع التسجيل (اختياري)

## تحسينات جديدة 🔄 جاري العمل

### 1. تعديل موعد الحجز مع إشعار WhatsApp
- [ ] إضافة حقل appointmentDate في جدول appointments
- [ ] تحديث schema.ts وتطبيق migration
- [ ] إضافة نموذج تعديل الموعد في AdminDashboard
- [ ] تحديث appointments router لدعم تعديل الموعد
- [ ] إضافة دالة إرسال WhatsApp عند تأكيد الموعد
- [ ] تضمين تفاصيل الموعد في رسالة WhatsApp

### 2. تحسين RTL للصفحات المتبقية
- [ ] VisitingDoctors: dir="rtl" + text-right
- [ ] DoctorDetailPage: RTL للنصوص والأيقونات
- [ ] OfferDetailPage: RTL للنماذج
- [ ] CampDetailPage: RTL للنماذج
- [ ] DoctorAppointments: RTL للنموذج
- [ ] جميع النماذج الأخرى

### 3. تصغير بطاقات الإحصائيات
- [ ] تقليل padding من p-6 إلى p-4
- [ ] تصغير الأيقونات من h-8 w-8 إلى h-6 w-6
- [ ] تصغير النصوص (text-3xl → text-2xl)
- [ ] تطبيق على جميع stat cards في Dashboard

### 4. تحسين بطاقات الأطباء للجوال
- [ ] تحسين grid: grid-cols-1 sm:grid-cols-2 md:grid-cols-3
- [ ] تصغير صور الأطباء
- [ ] تحسين spacing وpadding
- [ ] تطبيق في Doctors.tsx و DoctorAppointments.tsx

## تحسينات نهائية 🔄 جاري العمل

### 1. تحسين RTL للصفحات الفردية ✅
- [x] DoctorDetailPage: dir="rtl"
- [x] OfferDetailPage: dir="rtl"
- [x] CampDetailPage: dir="rtl"

### 2. تصغير stat cards للجوال ✅
- [x] OfferLeadsManagement: grid-cols-2 على الجوال
- [x] CampRegistrationsManagement: grid-cols-2 على الجوال
- [x] DoctorsManagement: grid-cols-2 على الجوال

### 3. تكبير صور الأطباء ✅
- [x] زيادة أحجام الصور: w-24 sm:w-28 md:w-32

### 4. إضافة زر offline ✅
- [x] إضافة زر WifiOff في header لوحة التحكم

### 5. إنشاء صفحة الإعدادات ✅
- [x] إنشاء SettingsPage.tsx مع تصميم "قيد التطوير"
- [x] إضافة زر Settings icon في header لوحة التحكم
- [x] إضافة route /settings في App.tsx
- [x] عرض الميزات القادمة في الصفحة

## إعادة هيكلة لوحة التحكم 🔄 جاري العمل

### 1. إنشاء Navigation Sidebar ✅
- [x] إنشاء DashboardSidebar component
- [x] إضافة 7 أقسام رئيسية مع أيقونات
- [x] Desktop: collapsible sidebar (w-64 / w-20)
- [x] Mobile: bottom navigation (4 أقسام رئيسية)

### 2. إنشاء صفحة الإدارة ✅
- [x] إنشاء ManagementPage.tsx مع Sidebar
- [x] نقل 3 components (العروض، المخيمات، الأطباء)
- [x] إضافة Tabs component للتنقل
- [x] إضافة route /dashboard/management

### 3. إنشاء الصفحات "قيد التطوير" ✅
- [x] إنشاء UnderDevelopmentPage template
- [x] PublishingPage.tsx (5 ميزات قادمة)
- [x] WhatsAppPage.tsx (5 ميزات قادمة)
- [x] MessagesPage.tsx (5 ميزات قادمة)
- [x] ReportsPage.tsx (5 ميزات قادمة)
- [x] AnalyticsPage.tsx (5 ميزات قادمة)
- [x] إضافة routes في App.tsx

### 4. تحسين لوحة التحكم الرئيسية ✅
- [x] إضافة DashboardSidebar في AdminDashboard
- [x] نقل زر ManualRegistrationForm بجانب تبويب العملاء
- [x] إزالة 3 تبويبات إدارة (العروض، المخيمات، الأطباء)
- [x] إزالة 3 components من AdminDashboard
- [x] تحديث layout: flex + sidebar + main content

## إصلاحات عاجلة 🔄 جاري العمل

### 1. إصلاح صفحة الإدارة
- [ ] استبدال OfferLeadsManagement بـ OffersManagement في ManagementPage
- [ ] استبدال CampRegistrationsManagement بـ CampsManagement في ManagementPage
- [ ] التأكد من أن التسجيلات تبقى في لوحة التحكم الرئيسية

### 2. إزالة زر تسجيل يدوي
- [ ] إزالة ManualRegistrationForm من جانب تبويب العملاء في AdminDashboard

### 3. تحسين responsive design
- [ ] تحسين header للوحة التحكم للجوال
- [ ] تحسين stat cards للجوال
- [ ] تحسين tables للجوال
- [ ] تحسين Sidebar للجوال
- [ ] تحسين spacing وpadding عام

### إصلاح صفحة الإدارة ✅ مكتمل
- [x] نقل OffersManagement من AdminDashboard.tsx إلى ملف منفصل (/components/OffersManagement.tsx)
- [x] نقل CampsManagement من AdminDashboard.tsx إلى ملف منفصل (/components/CampsManagement.tsx)
- [x] تحديث ManagementPage.tsx لاستيراد المكونات الجديدة
- [x] إزالة زر "تسجيل يدوي" من جانب تبويب العملاء المسجلين
- [x] تحسين زر "تسجيل يدوي" في header (responsive: نص كامل على الديسكتوب، نص مختصر على الجوال)
- [x] التحقق من عمل جميع الميزات بشكل صحيح

### تحسينات شاملة للمنصة - تجربة المستخدم والتوافق 🔄 جاري العمل

#### المرحلة 1: تحديث أيقونة التطبيق وإنشاء PWA icons
- [ ] نسخ الشعار الجديد إلى مجلد public
- [ ] توليد أيقونات PWA بجميع الأحجام (72-512px) من الشعار الجديد
- [ ] تحديث manifest.json بالأيقونات الجديدة
- [ ] تحديث favicon.ico و apple-touch-icon.png
- [ ] تحديث index.html بالأيقونات الجديدة

#### المرحلة 2: تحسين RTL في جميع صفحات لوحة التحكم
- [ ] إضافة dir="rtl" في AdminDashboard.tsx
- [ ] إضافة dir="rtl" في ManagementPage.tsx
- [ ] إضافة dir="rtl" في جميع صفحات Dashboard الأخرى
- [ ] تحسين محاذاة النصوص (text-right للعربية)
- [ ] عكس اتجاه الأيقونات (rotate-180 للأسهم)
- [ ] إصلاح spacing (mr → ml حيث لزم)

#### المرحلة 3: تحسين responsive design للوحة التحكم
- [ ] تحسين AdminDashboard للجوال (tabs، header، content)
- [ ] تحسين ManagementPage للجوال
- [ ] تحسين DashboardSidebar للجوال (bottom navigation)
- [ ] تحسين جميع الجداول (responsive columns)
- [ ] تحسين جميع النماذج (dialogs، inputs)
- [ ] تحسين البطاقات الإحصائية (grid responsive)

#### المرحلة 4: تحسين تجربة المستخدم على الهواتف للمنصة كاملة
- [ ] تحسين الصفحة الرئيسية (HomePage)
- [ ] تحسين صفحات الأطباء (Doctors، DoctorDetailPage)
- [ ] تحسين صفحات العروض (OffersListPage، OfferDetailPage)
- [ ] تحسين صفحات المخيمات (CampsListPage، CampDetailPage)
- [ ] تحسين Navbar للجوال
- [ ] تحسين Footer للجوال
- [ ] تحسين نماذج الحجز للجوال

#### المرحلة 5: اختبار شامل وحفظ checkpoint نهائي
- [ ] اختبار جميع الصفحات على الجوال
- [ ] اختبار جميع الصفحات على التابلت
- [ ] اختبار جميع الصفحات على الديسكتوب
- [ ] التأكد من عدم وجود أخطاء TypeScript
- [ ] التأكد من عمل PWA بشكل صحيح
- [ ] حفظ checkpoint نهائي

### تحسينات شاملة للمنصة - تجربة المستخدم والتوافق ✅ مكتمل

#### المرحلة 1: تحديث أيقونة التطبيق وإنشاء PWA icons ✅
- [x] نسخ الشعار الجديد إلى مجلد public
- [x] توليد أيقونات PWA بجميع الأحجام (72-512px) من الشعار الجديد
- [x] تحديث manifest.json بالأيقونات الجديدة
- [x] تحديث favicon.ico و apple-touch-icon.png
- [x] تحديث جميع الصفحات لاستخدام الشعار الجديد

#### المرحلة 2: تحسين RTL في جميع صفحات لوحة التحكم ✅
- [x] إضافة dir="rtl" في AdminDashboard.tsx (كان موجوداً مسبقاً)
- [x] إضافة dir="rtl" في ManagementPage.tsx (كان موجوداً مسبقاً)
- [x] إضافة dir="rtl" في SocialMediaReports.tsx
- [x] إضافة dir="rtl" في SettingsPage.tsx (كان موجوداً مسبقاً)

#### المرحلة 3: تحسين responsive design للوحة التحكم ✅
- [x] تحسين DashboardSidebar للجوال (bottom navigation مع scroll أفقي)
- [x] عرض جميع عناصر التنقل (7 عناصر) بدلاً من 4 فقط
- [x] إضافة min-w-max للتمرير الأفقي السلس

#### المرحلة 4: تحسين تجربة المستخدم على الهواتف للمنصة كاملة ✅
- [x] تحديث Navbar لاستخدام الشعار الجديد
- [x] تحديث HomePage لاستخدام الشعار الجديد
- [x] تحديث جميع الصفحات (11 صفحة) لاستخدام الشعار الجديد
- [x] التأكد من responsive design في جميع الصفحات

#### المرحلة 5: اختبار شامل ✅
- [x] فحص حالة المشروع (TypeScript: 0 errors ✅)
- [x] فحص LSP (No errors ✅)
- [x] فحص Dev server (running ✅)
- [x] اختبار الشعار الجديد على الصفحة الرئيسية ✅

### تحسين شامل لتوافق النصوص العربية 🔄 جاري العمل

#### المرحلة 1: فحص وتحسين RTL في جميع الصفحات العامة
- [ ] فحص HomePage
- [ ] فحص Doctors pages (DoctorsListPage, DoctorDetailPage)
- [ ] فحص Offers pages (OffersListPage, OfferDetailPage)
- [ ] فحص Camps pages (CampsListPage, CampDetailPage)
- [ ] فحص Navbar و Footer
- [ ] إضافة dir="rtl" حيث لزم

#### المرحلة 2: فحص وتحسين محاذاة النصوص والعناصر
- [ ] فحص text-alignment في جميع الصفحات
- [ ] تحسين flex justify-content و items-center
- [ ] إصلاح spacing (mr/ml) للعربية
- [ ] تحسين padding و margin للعناصر

#### المرحلة 3: فحص وتحسين اتجاه الأيقونات والأسهم
- [ ] عكس اتجاه الأسهم (ArrowLeft → ArrowRight)
- [ ] تحسين rotate للأيقونات
- [ ] إصلاح ChevronLeft/Right في الأزرار
- [ ] تحسين أيقونات التنقل

#### المرحلة 4: فحص وتحسين النماذج والحقول
- [ ] فحص input fields و text-alignment
- [ ] تحسين placeholder alignment
- [ ] فحص label positioning
- [ ] تحسين error messages alignment
- [ ] فحص select و dropdown alignment

#### المرحلة 5: اختبار شامل وحفظ checkpoint
- [ ] اختبار جميع الصفحات
- [ ] التأكد من عدم وجود مشاكل RTL
- [ ] حفظ checkpoint نهائي

### تحسين شامل لتوافق النصوص العربية ✅ مكتمل

#### المرحلة 1: فحص وتحسين RTL في جميع الصفحات العامة ✅
- [x] فحص HomePage (dir="rtl" موجود ✓)
- [x] فحص Doctors pages (dir="rtl" موجود ✓)
- [x] فحص Offers pages (dir="rtl" موجود ✓)
- [x] فحص Camps pages (dir="rtl" موجود ✓)
- [x] جميع الصفحات العامة تحتوي على dir="rtl"

#### المرحلة 2: فحص وتحسين محاذاة النصوص والعناصر ✅
- [x] فحص استخدام ml/mr في جميع الصفحات
- [x] استبدال 49 استخدام لـ ml- بـ mr- في الصفحات العامة
- [x] استبدال 6 استخدامات لـ ml- بـ mr- في مكونات لوحة التحكم
- [x] التحقق: 0 استخدام متبقي لـ ml- ✓

#### المرحلة 3: فحص وتحسين اتجاه الأيقونات والأسهم ✅
- [x] فحص استخدام ArrowLeft بدون rotate-180
- [x] إضافة rotate-180 لجميع ArrowLeft في CampsListPage
- [x] إضافة rotate-180 لجميع ArrowLeft في OffersListPage
- [x] جميع الأسهم الآن متوافقة مع RTL ✓

#### المرحلة 4: فحص وتحسين النماذج والحقول ✅
- [x] فحص text-alignment في نماذج الحجز
- [x] جميع النماذج تستخدم text-right بشكل صحيح ✓
- [x] Labels محاذاة من اليمين ✓
- [x] Input fields محاذاة من اليمين ✓

#### المرحلة 5: اختبار شامل ✅
- [x] فحص حالة المشروع (TypeScript: 0 errors ✅)
- [x] فحص LSP (No errors ✅)
- [x] فحص Dev server (running ✅)
- [x] اختبار الصفحة الرئيسية ✅

### تحسينات وتعديلات جديدة 🔄 جاري العمل

#### المرحلة 1: تحسين RTL في صفحة الإدارة (التبويبات الثلاثة)
- [ ] تحسين تنسيق RTL في إدارة المخيمات (CampsManagement)
- [ ] تحسين تنسيق RTL في إدارة العروض (OffersManagement)
- [ ] تحسين تنسيق RTL في إدارة الأطباء (DoctorsManagement)

#### المرحلة 2: تحسين نموذج المخيمات (العمر + الإجراءات)
- [ ] إضافة حقل العمر في نموذج التسجيل
- [ ] إضافة اختيار الإجراءات (متعدد) في نموذج التسجيل
- [ ] تحديث schema في drizzle/schema.ts
- [ ] تشغيل db:push لتطبيق التغييرات

#### المرحلة 3: تطوير إدارة المخيمات (وصف + عروض + إجراءات + صور)
- [ ] إضافة حقل "عن المخيم" (description)
- [ ] إضافة حقل "عروض المخيم" (offers)
- [ ] إضافة حقل "الإجراءات المتاحة" (procedures - متعدد)
- [ ] إضافة إمكانية رفع صور إضافية (gallery)
- [ ] تحديث schema و db:push

#### المرحلة 4: نقل زر طلبات التصريح للشريط العلوي
- [ ] نقل الزر من DashboardSidebar
- [ ] إضافته للشريط العلوي في AdminDashboard
- [ ] تحويله إلى أيقونة فقط

#### المرحلة 5: إضافة صفحة إدارة المحتوى
- [ ] إنشاء ContentManagementPage.tsx
- [ ] إضافتها للشريط الجانبي (DashboardSidebar)
- [ ] جعلها "قيد التطوير" (UnderDevelopment)
- [ ] إضافة route في App.tsx

#### المرحلة 6: إضافة فلترة حسب الحالة في جميع التبويبات
- [ ] إضافة فلتر في مواعيد الأطباء
- [ ] إضافة فلتر في تسجيلات المخيمات
- [ ] إضافة فلتر في حجوزات العروض
- [ ] إضافة فلتر في العملاء المسجلين

#### المرحلة 7: اختبار شامل وحفظ checkpoint
- [ ] اختبار جميع التحسينات
- [ ] التأكد من عدم وجود أخطاء
- [ ] حفظ checkpoint نهائي

### تحسينات وتعديلات جديدة - يناير 2026 ✅ مكتمل
- [x] تحسين RTL في صفحة الإدارة (التبويبات الثلاثة)
- [x] تحسين نموذج المخيمات (إضافة العمر + الإجراءات)
- [ ] تطوير إدارة المخيمات (وصف + عروض + إجراءات + صور) - مؤجلة
- [x] نقل زر طلبات التصريح للشريط العلوي
- [x] إضافة صفحة إدارة المحتوى
- [x] إضافة فلترة حسب الحالة في جميع التبويبات

### تطوير إدارة المخيمات المتقدمة ✅ مكتمل
- [x] إضافة حقول جديدة في schema (campOffers, availableProcedures, galleryImages)
- [x] تطبيق migration على قاعدة البيانات
- [x] تحديث camps router لدعم الحقول الجديدة
- [x] تحديث CampsManagement - إضافة textarea للعروض
- [x] تحديث CampsManagement - إضافة textarea للإجراءات
- [x] تحديث CampsManagement - إضافة textarea لروابط الصور
- [x] تحديث CampDetailPage - عرض عروض المخيم
- [x] تحديث CampDetailPage - عرض معرض الصور
- [x] تحديث نموذج التسجيل - عرض الإجراءات من availableProcedures

### إضافات وتعديلات شاملة جديدة 🚀
- [x] إضافة حقل source (مصدر التسجيل) في جميع الجداول
- [x] تعديل campOffers لينقسم إلى freeOffers و discountedOffers
- [x] إنشاء نظام إدارة المستخدمين والأدوار (schema + backend)
- [x] إنشاء صفحة إدارة المستخدمين والأدوار (UI)
- [ ] تحسين نموذج التسجيل اليدوي (dynamic form based on booking type)
- [ ] إنشاء صفحة Thank You (/thank-you)
- [ ] إضافة ميزة إلغاء التنشيط التلقائي للعروض والمخيمات
- [ ] إنشاء صفحة تقارير إحصائية للمخيمات
- [ ] تطبيق نظام Offline Support مع مزامنة تلقائية

## التعديلات والتحسينات الجديدة

- [x] إصلاح عرض اسم المخيم في نموذج التسجيل اليدوي (Select component)
- [x] تعديل نظام إلغاء التنشيط للعروض والمخيمات (deactivate فقط بدون حذف)
- [x] إضافة قسمين للمخيمات في الواجهة (جارية/منتهية)
- [x] إخفاء نموذج الحجز في المخيمات المنتهية
- [x] تحسين عرض الإجراءات في نموذج حجز المخيمات (checkboxes مثل الأطباء)
- [x] إضافة القائمة الجانبية لصفحة CampStatsPage
- [x] إضافة زر العودة لصفحة CampStatsPage
- [x] إظهار مصدر الحجز في جداول العروض
- [x] إظهار مصدر الحجز في جداول المخيمات
- [x] إظهار مصدر الحجز في جداول الأطباء
- [x] تحسين التوافق مع الهواتف للوحة التحكم وجميع صفحاتها

## التحسينات والتعديلات الجديدة (الدفعة الثانية)

- [x] إصلاح dialog تحديث الحالة لعرض جميع معلومات التسجيل
- [x] إصلاح تداخل أيقونات العملاء والمواعيد في إصدار الهاتف
- [x] إضافة DashboardLayout لصفحة إدارة المستخدمين
- [x] إضافة الأقسام الرئيسية وزر العودة لصفحة إدارة المستخدمين
- [x] نقل زر طلبات التصريح من لوحة التحكم إلى صفحة إدارة المستخدمين
- [x] إضافة ميزة "عرض المزيد" للعروض المجانية في صفحة المخيم
- [x] إضافة ميزة "عرض المزيد" للعروض المخفضة في صفحة المخيم
- [x] تحسين نموذج التسجيل للمخيم - إضافة زر اختيار الإجراء
- [x] تلوين الحجوزات والتسجيلات غير المحدثة
- [x] إضافة badge أحمر فوق التبويب مع عدد الحجوزات غير المحدثة
- [x] إضافة فلترة حسب مصدر التسجيل في جميع قوائم الحجوزات

## المهام الجديدة - إعادة هيكلة لوحة التحكم

### المرحلة 1: إنشاء صفحة إدارة الحجوزات
- [x] إنشاء صفحة BookingsManagementPage جديدة
- [x] نقل التبويبات الأربعة من AdminDashboard (العملاء، المواعيد، العروض، المخيمات)
- [x] نسخ زر التسجيل اليدوي إلى صفحة إدارة الحجوزات
- [x] إضافة صفحة إدارة الحجوزات للقائمة الجانبية

### المرحلة 2: تحويل لوحة التحكم إلى الصفحة الرئيسية
- [ ] تغيير اسم "لوحة التحكم" إلى "الصفحة الرئيسية"
- [ ] إضافة شريط البحث العالمي (Command Bar)
- [ ] إضافة بطاقة المريض السريعة مع خيارات (تحديث، اتصال، تفاصيل، واتساب)

### المرحلة 3: مركز الإشعارات الذكية
- [ ] إضافة تنبيه تسجيلات المخيمات قيد الانتظار
- [ ] إضافة تنبيه مواعيد الأطباء قيد الانتظار
- [ ] إضافة تنبيه حجوزات العروض قيد الانتظار

### المرحلة 4: تحليلات المصادر وتتبع النشاط
- [ ] إضافة قسم تحليلات المصادر (Lead Source Tracking)
- [ ] إضافة شريط تتبع النشاط الحي (Recent Activity Feed)

## إصلاح مشاكل التنسيق والتجربة

### المشاكل المكتشفة:
- [x] إصلاح التنسيق RTL في صفحة إدارة الحجوزات
- [x] إصلاح التنسيق RTL في صفحة إدارة المستخدمين
- [x] توحيد الشريط الجانبي ليكون نفس تصميم AdminDashboard
- [x] تحسين responsive design للجوال في صفحة إدارة الحجوزات
- [x] تحسين responsive design للجوال في صفحة إدارة المستخدمين
- [x] تحسين عرض التبويبات في الجوال
- [x] تحسين عرض الجداول في الجوال
- [x] تحسين عرض البطاقات في الجوال

## توحيد الشريط الجانبي

- [x] قراءة وتحليل الشريط الجانبي في AdminDashboard
- [x] نسخ جميع الأقسام من AdminDashboard إلى DashboardLayout
- [x] التأكد من توافق العرض مع الهاتف (mobile responsive)
- [x] اختبار التنقل بين جميع الأقسام

## تحسينات صفحة إدارة الحجوزات

- [x] إضافة الشريط العلوي مع الشعار (مثل AdminDashboard)
- [x] حذف زر "العودة إلى الصفحة الرئيسية"
- [x] تحسين ظهور الدائرة الحمراء (badge) مع عدد الحجوزات غير المحدثة
- [x] إصلاح ميزة التلوين لتظهر في الهاتف
- [x] تحسين responsive لتبويب تسجيلات العملاء
- [x] تحسين responsive لتبويب مواعيد الأطباء
- [x] تحسين عرض الجداول في الهاتف (بطاقات بدلاً من الجداول)
- [x] تحسين عرض الفلاتر في الهاتف (grid responsive)

## تحويل AdminDashboard إلى صفحة رئيسية ذكية

### المرحلة 1: شريط البحث العالمي
- [x] إضافة شريط بحث في header الصفحة الرئيسية
- [x] البحث في جميع الحجوزات (عملاء، مواعيد، عروض، مخيمات)
- [x] عرض النتائج في dropdown منظم حسب النوع
- [x] إضافة اختصار لوحة المفاتيح (Ctrl+K)

### المرحلة 2: مركز الإشعارات الذكية
- [x] إضافة أيقونة الإشعارات في header
- [x] عرض الحجوزات الجديدة (pending/new) كإشعارات
- [x] إضافة badge بعدد الإشعارات غير المقروءة
- [x] إمكانية وضع علامة "مقروء" على الإشعارات
- [x] عرض آخر 10 إشعارات

### المرحلة 3: تحليلات مصادر التسجيل
- [x] إضافة قسم تحليلات المصادر في الصفحة الرئيسية
- [x] رسم بياني بشريط التقدم (Progress Bars) لتوزيع المصادر
- [x] بطاقات إحصائية لكل مصدر (موقع، هاتف، يدوي)
- [x] إضافة نصائح ذكية حسب المصدر الأكثر استخداماً

### المرحلة 4: تتبع النشاط الحي
- [x] إضافة قسم "النشاط الأخير" في الصفحة الرئيسية
- [x] عرض آخر 8 حجوزات/تسجيلات
- [x] إضافة timestamp نسبي (منذ 5 دقائق، منذ ساعة)
- [x] عرض حالة كل نشاط ببادج ملون

## إصلاح خطأ المفاتيح المتكررة ✅ مكتمل
- [x] فحص صفحة BookingsManagementPage للبحث عن المفاتيح المتكررة (ID: 270001)
- [x] إصلاح المفاتيح في قوائم العملاء والمواعيد (إضافة prefix: lead- و appointment-)
- [x] التأكد من استخدام مفاتيح فريدة لكل عنصر

## إصلاحات صفحة إدارة الحجوزات
- [x] إظهار جميع تفاصيل التسجيل في المخيم في بطاقة عرض التفاصيل
- [x] إصلاح ميزة التلوين في تبويب تسجيلات المخيمات (استبدال 'new' بـ 'pending')
- [x] إلغاء عرض بيانات الحجوزات (العروض، المواعيد، المخيمات) في تبويب العملاء المسجلين (استبدال unifiedList بـ list)
- [x] إصلاح الدوائر الحمراء فوق التبويبات (إضافة padding-top: pt-3)

## إصلاحات إضافية لصفحة إدارة الحجوزات
- [x] إضافة الإجراءات (procedures) في dialog تفاصيل تسجيل المخيم
- [x] إصلاح التلوين في نسخة الهاتف (Mobile Cards) لتسجيلات المخيمات (إضافة pending في statusColors وتلوين Card)

## تحسينات نظام تسجيلات المخيمات
- [x] إضافة حقل "موعد الحضور" في dialog تحديث الحالة
- [x] إضافة إمكانية تعديل الاسم والرقم عند تحديث الحالة (للحضور أو التأكيد)
- [x] تعديل مصادر التسجيل من (موقع، هاتف، يدوي) إلى (فيسبوك، إنستغرام، تيليجرام، يدوي)
- [x] تحديث schema في قاعدة البيانات لإضافة حقل attendanceDate و gender
- [x] تحديث backend procedures لحفظ موعد الحضور والبيانات المعدلة

## نظام تتبع المصادر التلقائي عبر UTM Parameters
- [x] إنشاء utility function لقراءة utm_source من URL
- [x] حفظ المصدر في localStorage عند فتح الصفحة
- [ ] تحديث نماذج التسجيل (CampRegistrationForm, OfferLeadForm, AppointmentForm) لإرسال المصدر تلقائياً
- [ ] إزالة dropdown اختيار المصدر من النماذج
- [ ] تحديث CampStatsPage لعرض جميع المصادر ديناميكياً (بدون قائمة ثابتة)
- [ ] إضافة مصدر "direct" للزوار المباشرين (بدون utm_source)
- [ ] الحفاظ على "manual" للتسجيلات اليدوية من لوحة التحكم


### نظام تتبع UTM التلقائي ✅ مكتمل
- [x] إنشاء trackingUtils.ts لالتقاط معاملات UTM من URL
- [x] حفظ المصدر في sessionStorage
- [x] توفير دالة getRegistrationSource() لاسترجاع المصدر
- [x] تحديث DoctorDetailPage لإرسال المصدر تلقائياً
- [x] تحديث CampDetailPage لإرسال المصدر تلقائياً (تم مسبقاً)
- [x] تحديث OfferDetailPage لإرسال المصدر تلقائياً (تم مسبقاً)
- [x] تحديث CampsPage لإرسال المصدر تلقائياً
- [x] تحديث OffersPage لإرسال المصدر تلقائياً
- [x] التحقق من ManualRegistrationForm يرسل "manual" (تم مسبقاً)
- [x] تحديث appointments.submit router لقبول source
- [x] تحديث leads.submit router لقبول source
- [x] تحديث CampStatsPage لعرض المصادر ديناميكياً
- [x] تحديث SourceAnalytics component لعرض المصادر ديناميكياً
- [x] إنشاء اختبار tracking.test.ts
- [x] تحديث vitest.config لدعم اختبارات client
