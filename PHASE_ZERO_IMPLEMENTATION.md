# المرحلة صفر: دليل التنفيذ الشامل (Phase Zero Implementation Guide)

**المطور:** علي (فريق آيديا)
**التاريخ:** 2025-11-08
**الحالة:** جاري التنفيذ

---

## نظرة عامة على المرحلة صفر

الهدف من هذه المرحلة هو بناء أساس تقني قوي ومستقبلي للمشروع من خلال الترحيل من Vite إلى Next.js، مما يمكّن استراتيجية العرض الهجين (SSG/CSR) وتحسين الأداء بشكل جذري.

### المهام الرئيسية:
1. **0.1 الترحيل إلى Next.js** - نقل الكود من Vite إلى Next.js
2. **0.2 تحديث هيكل البيانات** - إضافة جداول جديدة للعروض والمخيمات
3. **0.3 بناء أساسات النضج** - إعداد الاختبارات و CI/CD

---

## 0.1 الترحيل إلى Next.js

### الخطوات:

#### أ) إعداد مشروع Next.js جديد
```bash
# إنشاء مشروع Next.js جديد مع App Router
npx create-next-app@latest . --typescript --tailwind --app
```

#### ب) نقل المكونات والصفحات
- نقل مجلد `client/src/components` إلى `app/components`
- نقل مجلد `client/src/lib` إلى `lib`
- نقل مجلد `client/src/contexts` إلى `contexts`
- نقل مجلد `client/src/hooks` إلى `hooks`

#### ج) تحديث الصفحات
- تحويل `client/src/pages/Home.tsx` إلى `app/page.tsx`
- تحويل `client/src/pages/CampaignLanding.tsx` إلى `app/campaigns/page.tsx`
- إنشاء صفحات ديناميكية للعروض: `app/offers/[slug]/page.tsx`
- إنشاء صفحات ديناميكية للأطباء: `app/doctors/[slug]/page.tsx`
- إنشاء صفحات ديناميكية للمخيمات: `app/camps/[slug]/page.tsx`

#### د) تحديث tRPC للعمل مع Next.js
- إنشاء `app/api/trpc/[trpc]/route.ts` للتعامل مع طلبات tRPC
- تحديث `server/routers` للعمل مع Next.js Server Components

#### هـ) تحديث متغيرات البيئة
- نقل جميع متغيرات البيئة من `.env` إلى `.env.local`
- إضافة `NEXT_PUBLIC_*` للمتغيرات التي تحتاج إلى الوصول من جانب العميل

---

## 0.2 تحديث هيكل البيانات (Drizzle ORM)

### الجداول الجديدة والمعدلة:

#### جدول `offers` (جديد)
```typescript
/**
 * Offers table - stores special medical offers and promotions
 * يخزن العروض الطبية الخاصة والعروض الترويجية
 */
export const offers = mysqlTable("offers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(), // عنوان العرض
  slug: varchar("slug", { length: 255 }).notNull().unique(), // رابط فريد للعرض
  description: text("description"), // وصف العرض
  imageUrl: varchar("imageUrl", { length: 500 }), // صورة العرض
  isActive: boolean("isActive").default(true).notNull(), // هل العرض نشط؟
  startDate: timestamp("startDate"), // تاريخ بدء العرض
  endDate: timestamp("endDate"), // تاريخ انتهاء العرض
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### جدول `camps` (جديد)
```typescript
/**
 * Camps table - stores information about medical camps
 * يخزن معلومات المخيمات الطبية
 */
export const camps = mysqlTable("camps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // اسم المخيم
  slug: varchar("slug", { length: 255 }).notNull().unique(), // رابط فريد للمخيم
  description: text("description"), // وصف المخيم
  imageUrl: varchar("imageUrl", { length: 500 }), // صورة المخيم
  startDate: timestamp("startDate"), // تاريخ بدء المخيم
  endDate: timestamp("endDate"), // تاريخ انتهاء المخيم
  isActive: boolean("isActive").default(true).notNull(), // هل المخيم نشط؟
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

#### تحديث جدول `doctors`
```typescript
// إضافة حقل slug فريد لكل طبيب
slug: varchar("slug", { length: 255 }).notNull().unique(),
```

#### تحديث جدول `leads`
```typescript
// إضافة حقول لتتبع مصدر العميل
sourceType: mysqlEnum("sourceType", ["offer", "doctor", "camp", "campaign"]).default("campaign"),
sourceId: int("sourceId"), // معرف العرض أو الطبيب أو المخيم
```

### خطوات التطبيق:
1. تحديث ملف `drizzle/schema.ts` بالجداول الجديدة
2. إنشاء ملف migration جديد: `drizzle/migrations/0006_add_offers_camps.sql`
3. تشغيل: `pnpm db:push`

---

## 0.3 بناء أساسات النضج

### أ) إعداد الاختبارات الآلية

#### تحديث `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
    },
  },
})
```

#### إنشاء `vitest.setup.ts`:
```typescript
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

#### كتابة اختبارات أساسية:
- اختبارات للمكونات الرئيسية
- اختبارات للـ API endpoints
- اختبارات لـ tRPC routers

### ب) إعداد CI/CD

#### إنشاء `.github/workflows/ci.yml`:
```yaml
name: Continuous Integration

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Type Check
        run: pnpm check

      - name: Run Lint
        run: pnpm lint

      - name: Run Tests
        run: pnpm test
```

---

## معايير الجودة والتوثيق

### التوثيق في الكود:
- كل دالة يجب أن تحتوي على JSDoc comment يشرح الغرض والمعاملات والعائد
- كل مكون React يجب أن يحتوي على تعليق يشرح دوره
- كل ملف يجب أن يبدأ بتعليق يشرح محتواه

### مثال على التوثيق الجيد:
```typescript
/**
 * Converts a slug string to a readable title
 * تحويل رابط إلى عنوان قابل للقراءة
 * 
 * @param slug - The slug string (e.g., "ob-gyn-delivery-offer")
 * @returns The formatted title (e.g., "OB/GYN Delivery Offer")
 * 
 * @example
 * slugToTitle("ob-gyn-delivery-offer") // "OB/GYN Delivery Offer"
 */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
```

---

## الخطوات التالية

بعد الانتهاء من المرحلة صفر:
1. اختبار المشروع بالكامل للتأكد من أن جميع الوظائف تعمل
2. دفع التغييرات إلى المستودع البعيد
3. الانتقال إلى المرحلة الأولى: إطلاق حملة العروض
