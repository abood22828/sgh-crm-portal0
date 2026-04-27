# دليل التثبيت والتشغيل

## المتطلبات الأساسية

قبل تشغيل المشروع، يجب تثبيت البرامج التالية:

### 1. تثبيت Node.js
1. قم بتحميل Node.js من الموقع الرسمي: https://nodejs.org/
2. يُنصح بتثبيت أحدث إصدار LTS (Long Term Support)
3. بعد التثبيت، تأكد من عمله بالأمر:
   ```bash
   node --version
   npm --version
   ```

### 2. تثبيت pnpm
بعد تثبيت Node.js، قم بتثبيت pnpm:
```bash
npm install -g pnpm
```

تأكد من التثبيت:
```bash
pnpm --version
```

## خطوات التثبيت

### 1. تثبيت التبعيات
```bash
cd c:\Users\IDEA\Documents\GitHub\sgh-crm-portal0
pnpm install
```

### 2. ترحيل قاعدة البيانات
بعد تعديل Schema لإضافة أنواع الرسائل الجديدة، يجب تشغيل الترحيل:
```bash
pnpm db:push
```

أو يدوياً:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. إعداد متغيرات البيئة
تأكد من وجود ملف `.env` في جذر المشروع يحتوي على:
```
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=sgh_crm_webhook_2024
DATABASE_URL=mysql://user:password@localhost:3306/database_name
```

### 4. تشغيل المشروع
```bash
# للتطوير
pnpm dev

# للإنتاج
pnpm build
pnpm start
```

## التغييرات الأخيرة

### دعم أنواع رسائل Meta Webhook الجديدة
تم إضافة دعم للأنواع التالية:
- `interactive` - رسائل تفاعلية (أزرار، قوائم)
- `image` - صور
- `audio` - صوت
- `video` - فيديو
- `document` - مستندات
- `location` - موقع
- `contacts` - جهات اتصال
- `template` - ردود على القوالب
- `unknown` - أنواع غير مدعومة

### تحديثات Schema
تم تحديث جدول `whatsappMessages`:
- إضافة أنواع جديدة إلى `messageType` enum
- إضافة حقل `metadata` لتخزين بيانات إضافية

### تحديثات الواجهة
تم تحديث `ChatWindow.tsx`:
- إضافة أيقونات لأنواع الرسائل المختلفة
- عرض نوع الرسالة وأيقونتها في المحادثة

## استكشاف الأخطاء

### أخطاء Lint
الأخطاء الحالية المتعلقة بـ `Cannot find module` ستختفي بعد تثبيت التبعيات:
```bash
pnpm install
```

### أخطاء TypeScript
بعد تثبيت التبعيات، قم بتشغيل:
```bash
pnpm check
```

## الاختبار

بعد التثبيت والتشغيل:
1. افتح المتصفح على `http://localhost:3000`
2. انتقل إلى صفحة WhatsApp
3. أرسل رسالة اختبار من WhatsApp
4. تحقق من ظهور الرسالة في الواجهة
5. جرب إرسال أنواع مختلفة من الرسائل (صور، مستندات، إلخ)
