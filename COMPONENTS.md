# دليل المكونات والـ Hooks - منصة الحجز SGH

> **ملاحظة**: يتم تحديث هذا الملف تلقائياً عند إضافة أو تعديل أي مكون أو hook في المشروع.

---

## 📋 جدول المحتويات

1. [المكونات المشتركة](#المكونات-المشتركة)
2. [مكونات الإدارة](#مكونات-الإدارة)
3. [مكونات الصفحات](#مكونات-الصفحات)
4. [مكونات UI الأساسية](#مكونات-ui-الأساسية)
5. [مكونات الرسوم المتحركة](#مكونات-الرسوم-المتحركة)
6. [Hooks المخصصة](#hooks-المخصصة)
7. [دليل الاستخدام](#دليل-الاستخدام)

---

## المكونات المشتركة

### DataTableWrapper
**الوصف**: مكون مشترك يغلف الجداول ويوفر واجهة موحدة لجميع جداول الإدارة

**المحتوى**:
- شريط أدوات موحد (تصدير، طباعة، إدارة أعمدة، فلاتر محفوظة)
- شريط بحث وفلاتر
- حالة التحميل (skeleton)
- حالة فارغة (empty state)
- ترقيم الصفحات (pagination)
- عرض عدد النتائج المفلترة

**أماكن التطبيق**:
- `OfferLeadsManagement` - إدارة حجوزات العروض
- `CampRegistrationsManagement` - إدارة تسجيلات المخيمات
- `LeadsManagementPage` - إدارة العملاء المحتملين

**المسار**: `client/src/components/DataTableWrapper.tsx`

---

### DataTableToolbar
**الوصف**: شريط أدوات مشترك للجداول يوفر أزرار التصدير والطباعة وإدارة الأعمدة

**المحتوى**:
- أزرار التصدير (Excel, CSV, PDF)
- زر الطباعة
- إدارة الأعمدة (Column Visibility)
- الفلاتر المحفوظة (Saved Filters)
- أزرار مخصصة إضافية

**أماكن التطبيق**:
- `DataTableWrapper` - يُستخدم داخلياً
- جميع صفحات الإدارة التي تستخدم DataTableWrapper

**المسار**: `client/src/components/DataTableToolbar.tsx`

---

### FilterPresets
**الوصف**: مكون مشترك لحفظ واستدعاء مجموعات الفلاتر المستخدمة بكثرة

**المحتوى**:
- حفظ مجموعات الفلاتر المخصصة
- استدعاء الفلاتر المحفوظة بنقرة واحدة
- حذف الفلاتر المحفوظة
- فلاتر سريعة مُعرّفة مسبقاً (Quick Presets)
- دعم الفلاتر المشتركة للمدراء

**أماكن التطبيق**:
- (قيد التطبيق) `LeadsManagementPage`
- (قيد التطبيق) `AppointmentsManagementPage`
- (قيد التطبيق) `OfferLeadsManagement`
- (قيد التطبيق) `CampRegistrationsManagement`

**المسار**: `client/src/components/FilterPresets.tsx`

---

### ColumnVisibility
**الوصف**: مكون لإدارة رؤية الأعمدة وترتيبها وحفظ القوالب

**المحتوى**:
- إظهار/إخفاء الأعمدة
- إعادة ترتيب الأعمدة (drag & drop)
- حفظ قوالب الأعمدة
- تثبيت الأعمدة (frozen columns)
- دعم القوالب المشتركة للمدراء

**أماكن التطبيق**:
- `DataTableToolbar` - يُستخدم داخلياً
- `OfferLeadsManagement`
- `CampRegistrationsManagement`
- `LeadsManagementPage`

**المسار**: `client/src/components/ColumnVisibility.tsx`

---

### SavedFilters
**الوصف**: مكون لحفظ واستدعاء مجموعات الفلاتر

**المحتوى**:
- حفظ الفلاتر الحالية
- استدعاء الفلاتر المحفوظة
- حذف الفلاتر
- دعم الفلاتر المشتركة

**أماكن التطبيق**:
- `DataTableToolbar` - يُستخدم داخلياً
- صفحات الإدارة المختلفة

**المسار**: `client/src/components/SavedFilters.tsx`

---

### ResizableTable
**الوصف**: جدول قابل لتغيير حجم الأعمدة

**المحتوى**:
- تغيير حجم الأعمدة بالسحب
- حفظ أحجام الأعمدة
- دعم الأعمدة المثبتة

**أماكن التطبيق**:
- `OfferLeadsManagement`
- `CampRegistrationsManagement`
- جميع الجداول التي تستخدم useTableFeatures

**المسار**: `client/src/components/ResizableTable.tsx`

---

### Pagination
**الوصف**: مكون ترقيم الصفحات مع خيارات تخصيص عدد العناصر

**المحتوى**:
- أزرار التنقل (السابق/التالي)
- اختيار عدد العناصر في الصفحة (10, 25, 50, 100)
- عرض إجمالي العناصر
- دعم RTL

**أماكن التطبيق**:
- `DataTableWrapper` - يُستخدم داخلياً
- جميع صفحات الإدارة

**المسار**: `client/src/components/Pagination.tsx`

---

### EmptyState
**الوصف**: مكون لعرض حالة فارغة مع أيقونة ونص ورابط اختياري

**المحتوى**:
- أيقونة قابلة للتخصيص
- عنوان ووصف
- زر إجراء اختياري

**أماكن التطبيق**:
- `DataTableWrapper`
- جميع الجداول عند عدم وجود بيانات

**المسار**: `client/src/components/EmptyState.tsx`

---

### TableSkeleton
**الوصف**: skeleton loader للجداول أثناء التحميل

**المحتوى**:
- صفوف وأعمدة skeleton
- عدد قابل للتخصيص

**أماكن التطبيق**:
- `DataTableWrapper`
- جميع الجداول أثناء التحميل

**المسار**: `client/src/components/TableSkeleton.tsx`

---

### QuickFilters
**الوصف**: فلاتر سريعة للحالات الشائعة

**المحتوى**:
- أزرار فلترة سريعة
- عداد لكل فلتر
- تصميم responsive

**أماكن التطبيق**:
- `LeadsManagementPage`
- `AppointmentsManagementPage`

**المسار**: `client/src/components/QuickFilters.tsx`

---

## مكونات الإدارة

### LeadsManagementPage
**الوصف**: صفحة إدارة العملاء المحتملين (تم تقسيمها إلى 5 مكونات منفصلة)

**المكونات الفرعية**:
1. `LeadFilters` - فلاتر البحث والتصفية
2. `LeadTableDesktop` - جدول سطح المكتب
3. `LeadStatusDialog` - حوار تحديث الحالة
4. `LeadMobileCards` - بطاقات الجوال
5. `LeadsManagementPage` (orchestrator) - المنسق الرئيسي

**المسار**: `client/src/pages/LeadsManagementPage.tsx`
**المكونات الفرعية**: `client/src/components/leads/`

---

### OfferLeadsManagement
**الوصف**: إدارة حجوزات العروض (تم تطبيق DataTableWrapper)

**المكونات الفرعية**:
1. `OfferLeadsFilters` - فلاتر حجوزات العروض
2. `OfferLeadsTable` - جدول حجوزات العروض
3. `OfferLeadsCards` - بطاقات الجوال

**المسار**: `client/src/components/OfferLeadsManagement.tsx`
**المكونات الفرعية**: `client/src/components/offers/`

---

### CampRegistrationsManagement
**الوصف**: إدارة تسجيلات المخيمات (تم تطبيق DataTableWrapper)

**المكونات الفرعية**:
1. `CampRegistrationsFilters` - فلاتر تسجيلات المخيمات
2. `CampRegistrationsTable` - جدول تسجيلات المخيمات
3. `CampRegistrationsCards` - بطاقات الجوال

**المسار**: `client/src/components/CampRegistrationsManagement.tsx`
**المكونات الفرعية**: `client/src/components/camps/`

---

### AppointmentsManagementPage
**الوصف**: إدارة مواعيد الأطباء

**المكونات الفرعية**:
1. `AppointmentFilters` - فلاتر المواعيد
2. `AppointmentTableDesktop` - جدول سطح المكتب
3. `AppointmentCard` - بطاقة الموعد للجوال

**المسار**: `client/src/pages/AppointmentsManagementPage.tsx`

---

### DoctorsManagement
**الوصف**: إدارة الأطباء (CRUD كامل)

**المحتوى**:
- إضافة/تعديل/حذف الأطباء
- بطاقات إحصائيات (إجمالي، متاح، غير متاح)
- فلترة وبحث
- auto-generate slug

**المسار**: `client/src/components/DoctorsManagement.tsx`

---

### OffersManagement
**الوصف**: إدارة العروض (CRUD كامل)

**المحتوى**:
- إضافة/تعديل/حذف العروض
- بطاقات إحصائيات (إجمالي، نشطة، غير نشطة)
- فلترة وبحث

**المسار**: `client/src/components/OffersManagement.tsx`

---

### CampsManagement
**الوصف**: إدارة المخيمات (CRUD كامل)

**المحتوى**:
- إضافة/تعديل/حذف المخيمات
- بطاقات إحصائيات (إجمالي، نشطة، غير نشطة)
- فلترة وبحث

**المسار**: `client/src/components/CampsManagement.tsx`

---

## مكونات الصفحات

### DashboardLayout
**الوصف**: تخطيط لوحة التحكم مع sidebar وheader

**المحتوى**:
- Sidebar navigation
- Header مع user profile
- Auth handling
- Responsive design

**أماكن التطبيق**:
- جميع صفحات لوحة التحكم

**المسار**: `client/src/components/DashboardLayout.tsx`

---

### Navbar
**الوصف**: شريط التنقل للواجهة العامة

**المحتوى**:
- روابط التنقل
- زر تسجيل الدخول
- Responsive menu
- RTL support

**أماكن التطبيق**:
- `HomePage`
- `Doctors`
- `Offers`
- `Camps`
- جميع الصفحات العامة

**المسار**: `client/src/components/Navbar.tsx`

---

### Footer
**الوصف**: تذييل الصفحة للواجهة العامة

**المحتوى**:
- معلومات الاتصال
- روابط التواصل الاجتماعي
- حقوق النشر

**أماكن التطبيق**:
- جميع الصفحات العامة

**المسار**: `client/src/components/Footer.tsx`

---

### SEO
**الوصف**: مكون لإدارة meta tags ديناميكياً

**المحتوى**:
- Open Graph tags
- Twitter Cards
- SEO meta tags

**أماكن التطبيق**:
- `HomePage`
- `DoctorDetailPage`
- `OfferDetailPage`
- `CampDetailPage`

**المسار**: `client/src/components/SEO.tsx`

---

## مكونات UI الأساسية

### LeadCard
**الوصف**: بطاقة عرض بيانات العميل المحتمل على الجوال

**المحتوى**:
- معلومات العميل
- أزرار الاتصال والواتساب
- حالة العميل
- تاريخ التسجيل

**أماكن التطبيق**:
- `LeadsManagementPage` (عرض الجوال)

**المسار**: `client/src/components/LeadCard.tsx`

---

### AppointmentCard
**الوصف**: بطاقة عرض بيانات الموعد على الجوال

**المحتوى**:
- معلومات المريض
- معلومات الطبيب
- أزرار الاتصال والواتساب
- حالة الموعد

**أماكن التطبيق**:
- `AppointmentsManagementPage` (عرض الجوال)

**المسار**: `client/src/components/AppointmentCard.tsx`

---

### OfferLeadCard
**الوصف**: بطاقة عرض بيانات حجز العرض على الجوال

**المحتوى**:
- معلومات العميل
- معلومات العرض
- أزرار الاتصال والواتساب
- حالة الحجز

**أماكن التطبيق**:
- `OfferLeadsManagement` (عرض الجوال)

**المسار**: `client/src/components/OfferLeadCard.tsx`

---

### CampRegistrationCard
**الوصف**: بطاقة عرض بيانات تسجيل المخيم على الجوال

**المحتوى**:
- معلومات المسجل
- معلومات المخيم
- أزرار الاتصال والواتساب
- حالة التسجيل

**أماكن التطبيق**:
- `CampRegistrationsManagement` (عرض الجوال)

**المسار**: `client/src/components/CampRegistrationCard.tsx`

---

### LeadStatsCards
**الوصف**: بطاقات إحصائيات العملاء المحتملين

**المحتوى**:
- إجمالي العملاء
- عملاء جدد
- قيد المتابعة
- محولين

**أماكن التطبيق**:
- `LeadsManagementPage`

**المسار**: `client/src/components/LeadStatsCards.tsx`

---

### CardSkeleton
**الوصف**: skeleton loader للبطاقات أثناء التحميل

**أماكن التطبيق**:
- جميع البطاقات أثناء التحميل

**المسار**: `client/src/components/CardSkeleton.tsx`

---

### SourceBadge
**الوصف**: badge لعرض مصدر التسجيل

**المحتوى**:
- ألوان مختلفة حسب المصدر
- أيقونات مخصصة

**أماكن التطبيق**:
- جميع الجداول والبطاقات

**المسار**: `client/src/components/SourceBadge.tsx`

---

### InlineStatusEditor
**الوصف**: محرر الحالة المضمن في الجداول

**المحتوى**:
- تحديث الحالة مباشرة
- dropdown مع الحالات المتاحة
- ألوان مختلفة حسب الحالة

**أماكن التطبيق**:
- جميع الجداول

**المسار**: `client/src/components/InlineStatusEditor.tsx`

---

### BulkUpdateDialog
**الوصف**: حوار التحديث الجماعي

**المحتوى**:
- تحديث حالة متعددة
- تحديث مصدر متعدد
- عرض عدد العناصر المحددة

**أماكن التطبيق**:
- `OfferLeadsManagement`
- `CampRegistrationsManagement`
- `AppointmentsManagementPage`

**المسار**: `client/src/components/BulkUpdateDialog.tsx`

---

### ManualRegistrationForm
**الوصف**: نموذج التسجيل اليدوي للحجوزات الهاتفية

**المحتوى**:
- حقول معلومات العميل
- اختيار نوع التسجيل
- validation

**أماكن التطبيق**:
- `AdminDashboard`

**المسار**: `client/src/components/ManualRegistrationForm.tsx`

---

### GlobalSearch
**الوصف**: بحث عام في جميع البيانات

**المحتوى**:
- بحث في العملاء
- بحث في المواعيد
- بحث في الحجوزات
- نتائج مصنفة

**أماكن التطبيق**:
- `DashboardLayout` header

**المسار**: `client/src/components/GlobalSearch.tsx`

---

### QuickPatientSearch
**الوصف**: بحث سريع عن المرضى

**المحتوى**:
- بحث بالاسم أو الهاتف
- نتائج فورية
- اختيار المريض

**أماكن التطبيق**:
- `ManualRegistrationForm`

**المسار**: `client/src/components/QuickPatientSearch.tsx`

---

### ImageUpload
**الوصف**: مكون رفع الصور

**المحتوى**:
- drag & drop
- معاينة الصورة
- حذف الصورة
- validation

**أماكن التطبيق**:
- `DoctorsManagement`
- `OffersManagement`
- `CampsManagement`

**المسار**: `client/src/components/ImageUpload.tsx`

---

### NotificationCenter
**الوصف**: مركز الإشعارات

**المحتوى**:
- عرض الإشعارات
- تمييز الجديدة
- حذف الإشعارات

**أماكن التطبيق**:
- `DashboardLayout` header

**المسار**: `client/src/components/NotificationCenter.tsx`

---

### PWAManager
**الوصف**: إدارة PWA (تثبيت، إشعارات)

**المحتوى**:
- زر تثبيت عائم
- dialog التثبيت
- تفعيل الإشعارات

**أماكن التطبيق**:
- `App.tsx` (لوحة التحكم فقط)

**المسار**: `client/src/components/PWAManager.tsx`

---

### InstallPWAButton
**الوصف**: زر تثبيت PWA موحد يدعم كلا التطبيقين (العام والإدارة)

**المحتوى**:
- دعم `appType: 'public' | 'admin'` لتحديد التطبيق
- ثلاثة أوضاع: `compact` (Navbar) | `sidebar` (شريط جانبي) | `banner` (بانر كامل)
- دعم iOS بتعليمات يدوية
- تتبع عمليات التثبيت في قاعدة البيانات
- إخفاء ذكي بعد التثبيت أو الرفض

**الاستخدام**:
```tsx
// في Navbar الواجهة العامة
<InstallPWAButton appType="public" variant="compact" />

// في TopNavbar لوحة التحكم
<InstallPWAButton appType="admin" variant="compact" />

// في الشريط الجانبي
<InstallPWAButton appType="admin" variant="sidebar" />
```

**أماكن التطبيق**:
- `Navbar` (الواجهة العامة) - `appType="public"`
- `TopNavbar` (لوحة التحكم) - `appType="admin"`
- `DashboardSidebarV2` (شريط جانبي) - `appType="admin"`

**المسار**: `client/src/components/InstallPWAButton.tsx`

---

### OfflineIndicator
**الوصف**: مؤشر حالة الاتصال

**المحتوى**:
- عرض حالة online/offline
- تحديث تلقائي

**أماكن التطبيق**:
- `App.tsx`

**المسار**: `client/src/components/OfflineIndicator.tsx`

---

### PendingRequestsNotification
**الوصف**: إشعار الطلبات المعلقة (offline)

**المحتوى**:
- عرض عدد الطلبات المعلقة
- زر المزامنة

**أماكن التطبيق**:
- `DashboardLayout`

**المسار**: `client/src/components/PendingRequestsNotification.tsx`

---

### MetaPixel
**الوصف**: Meta Pixel tracking

**المحتوى**:
- تتبع الأحداث
- تتبع التحويلات

**أماكن التطبيق**:
- `App.tsx`

**المسار**: `client/src/components/MetaPixel.tsx`

---

### PrintReceipt
**الوصف**: طباعة إيصال الحجز

**المحتوى**:
- معلومات الحجز
- QR code
- تنسيق للطباعة

**أماكن التطبيق**:
- جميع صفحات الإدارة

**المسار**: `client/src/components/PrintReceipt.tsx`

---

### SourceAnalytics
**الوصف**: تحليلات المصادر

**المحتوى**:
- رسم بياني للمصادر
- إحصائيات مفصلة

**أماكن التطبيق**:
- `AdminDashboard`

**المسار**: `client/src/components/SourceAnalytics.tsx`

---

### RecentActivity
**الوصف**: النشاط الأخير

**المحتوى**:
- آخر الحجوزات
- آخر التحديثات
- timeline

**أماكن التطبيق**:
- `AdminDashboard`

**المسار**: `client/src/components/RecentActivity.tsx`

---

### TasksSection
**الوصف**: قسم المهام

**المحتوى**:
- قائمة المهام
- إضافة مهمة
- تمييز المكتملة

**أماكن التطبيق**:
- `AdminDashboard`

**المسار**: `client/src/components/TasksSection.tsx`

---

### TaskCount
**الوصف**: عداد المهام

**المحتوى**:
- عدد المهام المعلقة
- badge

**أماكن التطبيق**:
- `DashboardLayout` sidebar

**المسار**: `client/src/components/TaskCount.tsx`

---

### MultiSelect
**الوصف**: اختيار متعدد مع بحث

**المحتوى**:
- بحث في الخيارات
- اختيار متعدد
- badges للمحددة

**أماكن التطبيق**:
- `DoctorsManagement` (procedures)

**المسار**: `client/src/components/MultiSelect.tsx`

---

### ResponsiveDialog
**الوصف**: dialog responsive (sheet على الجوال)

**المحتوى**:
- dialog على سطح المكتب
- sheet على الجوال
- تبديل تلقائي

**أماكن التطبيق**:
- جميع الحوارات

**المسار**: `client/src/components/ResponsiveDialog.tsx`

---

### ManusDialog
**الوصف**: dialog مخصص مع تصميم موحد

**المحتوى**:
- header مخصص
- footer مخصص
- أزرار موحدة

**أماكن التطبيق**:
- جميع الحوارات

**المسار**: `client/src/components/ManusDialog.tsx`

---

### ErrorBoundary
**الوصف**: معالج الأخطاء

**المحتوى**:
- catch errors
- عرض رسالة خطأ
- زر إعادة المحاولة

**أماكن التطبيق**:
- `App.tsx` (يغلف التطبيق بالكامل)

**المسار**: `client/src/components/ErrorBoundary.tsx`

---

### UnderDevelopmentPage
**الوصف**: صفحة قيد التطوير

**المحتوى**:
- رسالة "قيد التطوير"
- أيقونة
- زر الرجوع

**أماكن التطبيق**:
- الصفحات قيد التطوير

**المسار**: `client/src/components/UnderDevelopmentPage.tsx`

---

## مكونات الرسوم المتحركة

### AnimatedCounter
**الوصف**: عداد متحرك

**المحتوى**:
- تحريك الأرقام
- duration قابل للتخصيص

**أماكن التطبيق**:
- بطاقات الإحصائيات

**المسار**: `client/src/components/animations/AnimatedCounter.tsx`

---

### AnimatedBadge
**الوصف**: badge متحرك

**المحتوى**:
- fade in animation
- scale animation

**أماكن التطبيق**:
- badges الحالة

**المسار**: `client/src/components/animations/AnimatedBadge.tsx`

---

### AnimatedProgressBar
**الوصف**: شريط تقدم متحرك

**المحتوى**:
- تحريك التقدم
- ألوان مخصصة

**أماكن التطبيق**:
- `SourceAnalytics`

**المسار**: `client/src/components/animations/AnimatedProgressBar.tsx`

---

### FadeIn
**الوصف**: تأثير fade in

**المحتوى**:
- fade in animation
- delay قابل للتخصيص

**أماكن التطبيق**:
- جميع العناصر التي تحتاج fade in

**المسار**: `client/src/components/animations/FadeIn.tsx`

---

### FlashUpdate
**الوصف**: تأثير flash عند التحديث

**المحتوى**:
- flash animation
- لون قابل للتخصيص

**أماكن التطبيق**:
- الجداول عند التحديث

**المسار**: `client/src/components/animations/FlashUpdate.tsx`

---

## Hooks المخصصة

### usePagination
**الوصف**: hook لإدارة حالة الترقيم

**المحتوى**:
```typescript
interface UsePaginationReturn {
  currentPage: number;
  pageSize: PageSizeValue;
  totalPages: number;
  paginatedData: T[];
  handlePageChange: (page: number) => void;
  handlePageSizeChange: (size: PageSizeValue) => void;
  resetPagination: () => void;
}
```

**أماكن الاستخدام**:
- `LeadsManagementPage`
- `AppointmentsManagementPage`
- جميع الصفحات التي تحتاج pagination

**المسار**: `client/src/hooks/usePagination.ts`

---

### useTableFeatures
**الوصف**: hook شامل لميزات الجداول

**المحتوى**:
```typescript
interface UseTableFeaturesReturn {
  visibleColumns: Record<string, boolean>;
  columnOrder: string[];
  columnWidths: Record<string, number>;
  frozenColumns: string[];
  templates: ColumnTemplate[];
  activeTemplateId: string | null;
  // ... وظائف الإدارة
}
```

**أماكن الاستخدام**:
- `OfferLeadsManagement`
- `CampRegistrationsManagement`
- جميع الجداول المتقدمة

**المسار**: `client/src/hooks/useTableFeatures.ts`

---

### useExportUtils
**الوصف**: hook لتصدير البيانات

**المحتوى**:
```typescript
interface UseExportUtilsReturn {
  exportToExcel: (data: any[], filename: string) => void;
  exportToCSV: (data: any[], filename: string) => void;
  exportToPDF: (data: any[], columns: any[], title: string) => void;
  buildActiveFilters: (filters: any) => Record<string, any>;
}
```

**أماكن الاستخدام**:
- جميع صفحات الإدارة

**المسار**: `client/src/hooks/useExportUtils.ts`

---

### useFilterUtils
**الوصف**: hook لإدارة الفلاتر

**المحتوى**:
```typescript
interface UseFilterUtilsReturn {
  applyFilters: (data: any[], filters: any) => any[];
  hasActiveFilters: (filters: any) => boolean;
  clearFilters: () => void;
}
```

**أماكن الاستخدام**:
- جميع صفحات الإدارة

**المسار**: `client/src/hooks/useFilterUtils.ts`

---

### useFormatDate
**الوصف**: hook لتنسيق التواريخ

**المحتوى**:
```typescript
const formatDate = (date: Date | string, format?: string) => string;
const formatRelativeTime = (date: Date | string) => string;
```

**أماكن الاستخدام**:
- جميع المكونات التي تعرض تواريخ

**المسار**: `client/src/hooks/useFormatDate.ts`

---

### usePhoneFormat
**الوصف**: hook لتنسيق أرقام الهواتف

**المحتوى**:
```typescript
const formatPhone = (phone: string) => string;
const validatePhone = (phone: string) => boolean;
```

**أماكن الاستخدام**:
- جميع النماذج والجداول

**المسار**: `client/src/hooks/usePhoneFormat.ts`

---

### useStatusLabels
**الوصف**: hook للحصول على تسميات الحالات

**المحتوى**:
```typescript
const getStatusLabel = (status: string) => string;
const getStatusColor = (status: string) => string;
const getStatusIcon = (status: string) => ReactNode;
```

**أماكن الاستخدام**:
- جميع المكونات التي تعرض حالات

**المسار**: `client/src/hooks/useStatusLabels.ts`

---

### useDebounce
**الوصف**: hook لتأخير تنفيذ دالة

**المحتوى**:
```typescript
const debouncedValue = useDebounce(value, delay);
```

**أماكن الاستخدام**:
- حقول البحث
- الفلاتر

**المسار**: `client/src/hooks/useDebounce.ts`

---

### useMobile
**الوصف**: hook للكشف عن الجوال

**المحتوى**:
```typescript
const isMobile = useMobile();
```

**أماكن الاستخدام**:
- جميع المكونات responsive

**المسار**: `client/src/hooks/useMobile.tsx`

---

### useConfirmDialog
**الوصف**: hook لحوار التأكيد

**المحتوى**:
```typescript
const { confirm, ConfirmDialog } = useConfirmDialog();
```

**أماكن الاستخدام**:
- عمليات الحذف
- العمليات الحرجة

**المسار**: `client/src/hooks/useConfirmDialog.ts`

---

### useImageUpload
**الوصف**: hook لرفع الصور

**المحتوى**:
```typescript
interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string>;
  isUploading: boolean;
  error: string | null;
}
```

**أماكن الاستخدام**:
- `ImageUpload` component
- نماذج الإضافة/التعديل

**المسار**: `client/src/hooks/useImageUpload.ts`

---

### useSlugGenerator
**الوصف**: hook لتوليد slug تلقائياً

**المحتوى**:
```typescript
const generateSlug = (text: string) => string;
```

**أماكن الاستخدام**:
- `DoctorsManagement`
- `OffersManagement`
- `CampsManagement`

**المسار**: `client/src/hooks/useSlugGenerator.ts`

---

### useFormValidation
**الوصف**: hook للتحقق من صحة النماذج

**المحتوى**:
```typescript
interface UseFormValidationReturn {
  errors: Record<string, string>;
  validate: (field: string, value: any) => boolean;
  validateAll: (data: any) => boolean;
  clearErrors: () => void;
}
```

**أماكن الاستخدام**:
- جميع النماذج

**المسار**: `client/src/hooks/useFormValidation.ts`

---

### useNotificationSound
**الوصف**: hook لتشغيل أصوات الإشعارات

**المحتوى**:
```typescript
const playNotificationSound = (type: 'success' | 'error' | 'info') => void;
```

**أماكن الاستخدام**:
- `NotificationCenter`
- العمليات الناجحة/الفاشلة

**المسار**: `client/src/hooks/useNotificationSound.ts`

---

### useComposition
**الوصف**: hook لدعم الكتابة بالعربية

**المحتوى**:
```typescript
const { isComposing, compositionProps } = useComposition();
```

**أماكن الاستخدام**:
- حقول الإدخال العربية

**المسار**: `client/src/hooks/useComposition.ts`

---

### usePersistFn
**الوصف**: hook لحفظ دالة في الذاكرة

**المحتوى**:
```typescript
const persistedFn = usePersistFn(fn);
```

**أماكن الاستخدام**:
- الدوال التي تُمرر كـ props

**المسار**: `client/src/hooks/usePersistFn.ts`

---

### usePWAInstall
**الوصف**: Hook موحد لإدارة تثبيت PWA لكلا التطبيقين (العام والإدارة)

**المحتوى**:
```typescript
export type PWAAppType = 'public' | 'admin';

const {
  canInstall,      // هل يمكن تثبيت التطبيق
  isInstalled,     // هل التطبيق مثبت بالفعل (standalone mode)
  isIOS,           // هل الجهاز iOS (يحتاج تعليمات يدوية)
  isPWASupported,  // هل يدعم المتصفح PWA
  isInstalling,    // هل عملية التثبيت جارية
  isDismissed,     // هل تم رفض الطلب من قبل
  installApp,      // دالة: تشغيل عملية التثبيت
  dismissPrompt,   // دالة: إخفاء زر التثبيت مؤقتاً (7 أيام)
} = usePWAInstall('public'); // أو 'admin'
```

**الميزات**:
- تسجيل Service Worker المناسب (`/sw.js` للعام، `/sw-admin.js` للإدارة)
- تتبع عمليات التثبيت في قاعدة البيانات عبر `trpc.pwa.trackInstall`
- دعم iOS بتعليمات يدوية
- إعادة عرض الزر بعد 7 أيام من الرفض
- مفتاح تخزين مستقل لكل تطبيق

**أماكن الاستخدام**:
- `InstallPWAButton` - مكون زر التثبيت

**المسار**: `client/src/hooks/usePWAInstall.ts`

---

## دليل الاستخدام

### كيفية استخدام DataTableWrapper

```tsx
import DataTableWrapper from "@/components/DataTableWrapper";
import { usePagination } from "@/hooks/usePagination";

function MyManagementPage() {
  const { data, isLoading } = trpc.myData.list.useQuery();
  const {
    currentPage,
    pageSize,
    totalPages,
    paginatedData,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination(filteredData, 25);

  return (
    <DataTableWrapper
      isLoading={isLoading}
      isEmpty={paginatedData.length === 0}
      filteredCount={filteredData.length}
      totalCount={data?.length || 0}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      pageSize={pageSize}
      onPageSizeChange={handlePageSizeChange}
      itemsPerPage={paginatedData.length}
      onExport={handleExport}
      onPrint={handlePrint}
      showColumnVisibility
      showSavedFilters
      columnVisibilityProps={columnVisibilityProps}
      savedFiltersProps={savedFiltersProps}
    >
      {/* محتوى الجدول */}
      <MyTable data={paginatedData} />
    </DataTableWrapper>
  );
}
```

---

### كيفية استخدام FilterPresets

```tsx
import FilterPresets from "@/components/FilterPresets";

function MyManagementPage() {
  const [filters, setFilters] = useState({});

  const quickPresets = [
    {
      id: "today-pending",
      name: "مواعيد اليوم - قيد الانتظار",
      filters: { dateFilter: "today", status: "pending" },
    },
    {
      id: "week-confirmed",
      name: "حجوزات الأسبوع - مؤكدة",
      filters: { dateFilter: "week", status: "confirmed" },
    },
  ];

  return (
    <div>
      <FilterPresets
        pageKey="appointments"
        currentFilters={filters}
        onApplyFilters={setFilters}
        quickPresets={quickPresets}
        isAdmin={user?.role === "admin"}
      />
    </div>
  );
}
```

---

### كيفية استخدام useTableFeatures

```tsx
import { useTableFeatures } from "@/hooks/useTableFeatures";

function MyTable() {
  const {
    visibleColumns,
    columnOrder,
    columnWidths,
    frozenColumns,
    templates,
    activeTemplateId,
    handleVisibilityChange,
    handleColumnOrderChange,
    handleColumnWidthChange,
    handleToggleFrozen,
    handleSaveTemplate,
    handleApplyTemplate,
    handleDeleteTemplate,
    handleReset,
  } = useTableFeatures({
    tableKey: "my-table",
    defaultColumns: columns,
    defaultWidths: { name: 200, phone: 150 },
  });

  return (
    <ResizableTable
      columns={columns}
      data={data}
      visibleColumns={visibleColumns}
      columnOrder={columnOrder}
      columnWidths={columnWidths}
      frozenColumns={frozenColumns}
      onColumnWidthChange={handleColumnWidthChange}
    />
  );
}
```

---

## ملاحظات مهمة

### قواعد التحديث
1. **عند إضافة مكون جديد**: أضف قسماً جديداً في الفئة المناسبة مع الوصف والمحتوى وأماكن التطبيق
2. **عند تعديل مكون**: حدّث الوصف والمحتوى في القسم المقابل
3. **عند تطبيق مكون في مكان جديد**: أضف المكان الجديد إلى قائمة "أماكن التطبيق"
4. **عند حذف مكون**: احذف القسم المقابل من الملف

### معايير التوثيق
- **الوصف**: جملة واحدة توضح الغرض من المكون
- **المحتوى**: قائمة بالميزات الرئيسية أو الواجهة البرمجية
- **أماكن التطبيق**: قائمة بجميع الأماكن التي يُستخدم فيها المكون
- **المسار**: المسار الكامل للملف من جذر المشروع

---

**آخر تحديث**: 2026-02-24
**عدد المكونات**: 120+
**عدد الـ Hooks**: 15+
