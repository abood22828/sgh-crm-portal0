# دليل تنفيذ المرحلة الأولى: حملة العروض

**المطور:** علي (فريق آيديا)
**التاريخ:** 2025-11-09
**الحالة:** جاري التنفيذ
**الأولوية:** عالية جدًا

---

## نظرة عامة

المرحلة الأولى تركز على **إطلاق حملة العروض الطبية** للمستشفى. هذه المرحلة تتضمن تطوير صفحات الهبوط (Landing Pages)، نماذج التسجيل، وتكامل أنظمة التتبع والتواصل.

---

## المهام الرئيسية

### 1. صفحة قائمة العروض (Offers List Page)

#### الملف:
- `app/offers/page.tsx`

#### الوصف:
صفحة تعرض جميع العروض الطبية المتاحة حاليًا بشكل جذاب وسهل التصفح.

#### المميزات:
- **SSG (Static Site Generation):** الصفحة تُبنى بشكل ثابت عند وقت البناء لأداء أفضل.
- **عرض شبكي:** عرض العروض في شبكة (Grid) مع صور وأوصاف مختصرة.
- **روابط ديناميكية:** كل عرض يحتوي على رابط يقود إلى صفحة هبوط العرض الفردي.
- **تصميم استجابي:** يعمل بشكل مثالي على جميع الأجهزة (موبايل، تابلت، ديسكتوب).

#### التقنيات المستخدمة:
- **Next.js App Router:** للتوجيه والصفحات.
- **tRPC:** لجلب بيانات العروض من الخادم.
- **Tailwind CSS:** للتصميم والتنسيق.
- **Radix UI Components:** لمكونات واجهة المستخدم.

#### مثال على الكود:
```typescript
// app/offers/page.tsx
import { trpc } from "@/app/lib/trpc/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function OffersPage() {
  // جلب العروض من الخادم
  const offers = await getOffers();

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">العروض الطبية</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {offer.imageUrl && (
              <img src={offer.imageUrl} alt={offer.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{offer.title}</h2>
              <p className="text-gray-600 mb-4">{offer.description}</p>
              <Link href={`/offers/${offer.slug}`}>
                <Button className="w-full">عرض التفاصيل</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
```

---

### 2. صفحة هبوط العرض الفردي (Offer Landing Page)

#### الملف:
- `app/offers/[slug]/page.tsx`

#### الوصف:
صفحة تفصيلية لعرض واحد تتضمن معلومات شاملة ونموذج تسجيل.

#### المميزات:
- **SSG مع ISR:** الصفحة تُبنى بشكل ثابت مع إمكانية التحديث الدوري (Incremental Static Regeneration).
- **معلومات شاملة:** عرض كامل تفاصيل العرض (الوصف، السعر، الشروط، إلخ).
- **نموذج تسجيل:** نموذج جميل وسهل الاستخدام للتسجيل في العرض.
- **تكامل Meta Pixel:** إطلاق حدث `Lead` عند إكمال النموذج.
- **تكامل WhatsApp:** إرسال رسالة تأكيد فورية عبر واتساب.

#### التقنيات المستخدمة:
- **Next.js Dynamic Routes:** للصفحات الديناميكية.
- **React Hook Form:** لإدارة النموذج.
- **Zod:** للتحقق من صحة البيانات.
- **Meta Pixel SDK:** لتتبع التحويلات.
- **WhatsApp API:** لإرسال الرسائل.

#### مثال على الكود:
```typescript
// app/offers/[slug]/page.tsx
import { notFound } from "next/navigation";
import OfferForm from "@/components/offers/OfferForm";
import { getOfferBySlug } from "@/app/lib/offers";

export async function generateStaticParams() {
  const offers = await getOffers();
  return offers.map((offer) => ({
    slug: offer.slug,
  }));
}

export default async function OfferPage({ params }: { params: { slug: string } }) {
  const offer = await getOfferBySlug(params.slug);

  if (!offer) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* معلومات العرض */}
        <div>
          {offer.imageUrl && (
            <img src={offer.imageUrl} alt={offer.title} className="w-full rounded-lg mb-6" />
          )}
          <h1 className="text-4xl font-bold mb-4">{offer.title}</h1>
          <p className="text-gray-600 text-lg mb-6">{offer.description}</p>
        </div>

        {/* نموذج التسجيل */}
        <div>
          <OfferForm offerId={offer.id} offerTitle={offer.title} />
        </div>
      </div>
    </main>
  );
}
```

---

### 3. مكون نموذج التسجيل (Offer Form Component)

#### الملف:
- `app/components/offers/OfferForm.tsx`

#### الوصف:
مكون يحتوي على نموذج تسجيل العميل في العرض.

#### الحقول:
- **الاسم الكامل:** (نص)
- **رقم الهاتف:** (رقم)
- **البريد الإلكتروني:** (بريد)
- **ملاحظات إضافية:** (نص طويل - اختياري)

#### الوظائف:
- **التحقق من الصحة:** التحقق من صحة البيانات قبل الإرسال.
- **إرسال البيانات:** إرسال البيانات إلى الخادم عبر tRPC.
- **Meta Pixel:** إطلاق حدث `Lead` عند النجاح.
- **WhatsApp:** إرسال رسالة تأكيد عبر واتساب.
- **رسالة نجاح:** عرض رسالة تأكيد للمستخدم.

#### مثال على الكود:
```typescript
// app/components/offers/OfferForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/app/lib/trpc/client";

const offerFormSchema = z.object({
  fullName: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  phone: z.string().regex(/^\d{9,}$/, "رقم الهاتف غير صحيح"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  notes: z.string().optional(),
});

type OfferFormData = z.infer<typeof offerFormSchema>;

export default function OfferForm({ offerId, offerTitle }: { offerId: number; offerTitle: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OfferFormData>({
    resolver: zodResolver(offerFormSchema),
  });

  const submitLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      // إطلاق حدث Meta Pixel
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead", {
          value: 0,
          currency: "SAR",
        });
      }

      // إرسال رسالة واتساب
      // (سيتم التعامل معها من جانب الخادم)

      toast.success("تم التسجيل بنجاح! سيتم التواصل معك قريبًا.");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء التسجيل. حاول مرة أخرى.");
    },
  });

  const onSubmit = (data: OfferFormData) => {
    submitLead.mutate({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
      offerId,
      sourceType: "offer",
      sourceId: offerId,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">التسجيل في {offerTitle}</h2>

      <div>
        <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
        <Input {...register("fullName")} placeholder="أدخل اسمك الكامل" />
        {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
        <Input {...register("phone")} placeholder="أدخل رقم الهاتف" />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
        <Input {...register("email")} type="email" placeholder="أدخل بريدك الإلكتروني" />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">ملاحظات إضافية (اختياري)</label>
        <Textarea {...register("notes")} placeholder="أي ملاحظات إضافية؟" />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "جاري الإرسال..." : "التسجيل الآن"}
      </Button>
    </form>
  );
}
```

---

### 4. تحديث Leads Router

#### الملف:
- `server/routers/leads.ts`

#### الوصف:
إضافة إجراء `create` لإنشاء عملية بيع جديدة (Lead).

#### الإجراءات:
- **`create`:** إنشاء عملية بيع جديدة مع إرسال رسالة واتساب.

#### مثال على الكود:
```typescript
// server/routers/leads.ts
import { router, publicProcedure } from "@trpc/server";
import { z } from "zod";
import { db } from "@/server/db";
import { leads } from "@/drizzle/schema";
import { sendWhatsAppMessage } from "@/server/whatsapp";

export const leadsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        fullName: z.string(),
        phone: z.string(),
        email: z.string().email(),
        notes: z.string().optional(),
        offerId: z.number(),
        sourceType: z.enum(["offer", "doctor", "camp", "campaign"]),
        sourceId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      // إنشاء العملية في قاعدة البيانات
      const lead = await db.insert(leads).values({
        fullName: input.fullName,
        phone: input.phone,
        email: input.email,
        notes: input.notes,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      });

      // إرسال رسالة واتساب
      await sendWhatsAppMessage(input.phone, `مرحبًا ${input.fullName}، شكرًا لتسجيلك في عرضنا. سيتم التواصل معك قريبًا.`);

      return lead;
    }),
});
```

---

### 5. تكامل Meta Pixel

#### الملف:
- `app/components/MetaPixel.tsx`

#### الوصف:
مكون يضيف كود Meta Pixel إلى الصفحة.

#### مثال على الكود:
```typescript
// app/components/MetaPixel.tsx
import Script from "next/script";

export default function MetaPixel() {
  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
    </>
  );
}
```

---

## معايير الجودة والتوثيق

### التوثيق المطلوب:
- ✅ JSDoc لكل مكون وإجراء.
- ✅ تعليقات واضحة لكل جزء معقد.
- ✅ أمثلة على الاستخدام.

### معايير الكود:
- ✅ TypeScript Strict Mode.
- ✅ Zod Validation.
- ✅ Error Handling.
- ✅ Accessibility (a11y).

---

## الخطوات التالية

1.  **تطوير صفحة قائمة العروض.**
2.  **تطوير صفحة هبوط العرض الفردي.**
3.  **تطوير مكون نموذج التسجيل.**
4.  **تحديث Leads Router.**
5.  **تكامل Meta Pixel.**
6.  **الاختبار الشامل.**
7.  **الدفع إلى المستودع البعيد.**

---

## ملاحظات مهمة

- جميع الصفحات يجب أن تكون **SSG** للأداء الأمثل.
- يجب التأكد من **التوافق مع الهاتف المحمول** (Mobile-First Design).
- يجب اختبار **Meta Pixel** و **WhatsApp Integration** قبل الإطلاق.
- يجب توثيق جميع **متغيرات البيئة** المطلوبة.
