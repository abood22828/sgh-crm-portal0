# توثيق جدول whatsappNotifications - WhatsApp Notifications Table Documentation

## نظرة عامة

جدول `whatsapp_notifications` يخزن سجلات الإشعارات والرسائل المرسلة عبر WhatsApp، مع تتبع حالتها وربطها بالكيانات المختلفة (المواعيد، تسجيلات المخيمات، عروض العملاء).

---

## الحقول

### الحقول الأساسية

| الحقل | النوع | الوصف |
|-------|------|-------|
| `id` | int (PK) | المعرف الفريد للإشعار |
| `entityType` | enum | نوع السجل المرتبط: `appointment`, `camp_registration`, `offer_lead` |
| `entityId` | int | معرف السجل المرتبط (معرف الموعد، التسجيل، أو العرض) |
| `notificationType` | enum | نوع الإشعار (انظر أدناه) |

### أنواع الإشعارات (notificationType)

| النوع | الوصف |
|-------|-------|
| `booking_confirmation` | تأكيد الحجز |
| `reminder_24h` | تذكير قبل 24 ساعة |
| `reminder_1h` | تذكير قبل ساعة |
| `post_visit_followup` | متابعة بعد الزيارة |
| `cancellation` | إلغاء |
| `status_update` | تحديث الحالة |
| `custom` | مخصص |

### بيانات الرسالة

| الحقل | النوع | الوصف |
|-------|------|-------|
| `phone` | varchar(20) | رقم هاتف المستلم |
| `recipientName` | varchar(255) | اسم المستلم |
| `templateName` | varchar(255) | اسم القالب المستخدم |
| `messageContent` | text | محتوى الرسالة |
| `variables` | text | متغيرات القالب (JSON) |

### حالة الإرسال

| الحقل | النوع | الوصف |
|-------|------|-------|
| `status` | enum | حالة الإرسال: `pending`, `sent`, `delivered`, `read`, `failed` |
| `metaMessageId` | varchar(255) | معرف الرسالة من Meta API |
| `errorMessage` | text | رسالة الخطأ في حالة الفشل |

### معلومات الإرسال

| الحقل | النوع | الوصف |
|-------|------|-------|
| `sentAt` | timestamp | وقت الإرسال |
| `deliveredAt` | timestamp | وقت التسليم |
| `readAt` | timestamp | وقت القراءة |
| `sentBy` | int | معرف المستخدم الذي أرسل (null = تلقائي) |
| `isAutomatic` | boolean | هل الإرسال تلقائي (افتراضي: true) |

### حقول التوقيت

| الحقل | النوع | الوصف |
|-------|------|-------|
| `createdAt` | timestamp | وقت إنشاء السجل |
| `updatedAt` | timestamp | وقت آخر تحديث |

---

## الفهارس (Indexes)

| الفهرس | الحقول | الغرض |
|--------|--------|-------|
| `wn_entity_idx` | `entityType`, `entityId` | البحث السريع حسب الكيان |
| `wn_phone_idx` | `phone` | البحث حسب رقم الهاتف |
| `wn_status_idx` | `status` | البحث حسب الحالة |
| `wn_createdAt_idx` | `createdAt` | البحث حسب وقت الإنشاء |

---

## حالات الإرسال (Status Flow)

```
pending → sent → delivered → read
              ↓
            failed
```

### شرح الحالات

- **pending**: الإشعار في قائمة الانتظار، لم يُرسل بعد
- **sent**: تم الإرسال بنجاح، بانتظار التسليم
- **delivered**: تم التسليم للجهاز
- **read**: تم قراءة الرسالة من قبل المستلم
- **failed**: فشل الإرسال (راجع `errorMessage`)

---

## الاستخدامات

### 1. تتبع إشعارات المواعيد

```sql
-- إشعارات موعد معين
SELECT * FROM whatsapp_notifications 
WHERE entityType = 'appointment' 
AND entityId = 123;
```

### 2. تتبع الإشعارات الفاشلة

```sql
-- الإشعارات الفاشلة في آخر 24 ساعة
SELECT * FROM whatsapp_notifications 
WHERE status = 'failed' 
AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### 3. إحصائيات الإشعارات

```sql
-- عدد الإشعارات حسب النوع
SELECT notificationType, COUNT(*) as count 
FROM whatsapp_notifications 
GROUP BY notificationType;
```

### 4. تتبع معدل النجاح

```sql
-- معدل النجاح حسب نوع الإشعار
SELECT 
  notificationType,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM whatsapp_notifications 
GROUP BY notificationType;
```

---

## العلاقات مع الجداول الأخرى

### مع جدول المواعيد (appointments)
- `entityType = 'appointment'`
- `entityId = appointments.id`

### مع جدول تسجيلات المخيمات (camp_registrations)
- `entityType = 'camp_registration'`
- `entityId = camp_registrations.id`

### مع جدول عروض العملاء (offer_leads)
- `entityType = 'offer_lead'`
- `entityId = offer_leads.id`

### مع جدول المستخدمين (users)
- `sentBy = users.id` (للإشعارات اليدوية)

---

## أمثلة الاستخدام

### إنشاء إشعار تأكيد حجز

```typescript
await db.insert(whatsappNotifications).values({
  entityType: 'appointment',
  entityId: appointmentId,
  notificationType: 'booking_confirmation',
  phone: '+967777165305',
  recipientName: 'أحمد محمد',
  templateName: 'booking_confirmation_ar',
  messageContent: 'تم تأكيد حجزك بنجاح...',
  variables: JSON.stringify({ name: 'أحمد', date: '2026-04-28' }),
  status: 'pending',
  isAutomatic: true,
});
```

### تحديث حالة الإشعار بعد الإرسال

```typescript
await db.update(whatsappNotifications)
  .set({
    status: 'sent',
    metaMessageId: 'wamid.xxx',
    sentAt: new Date(),
  })
  .where(eq(whatsappNotifications.id, notificationId));
```

### تحديث حالة التسليم (من Webhook)

```typescript
await db.update(whatsappNotifications)
  .set({
    status: 'delivered',
    deliveredAt: new Date(),
  })
  .where(eq(whatsappNotifications.metaMessageId, metaMessageId));
```

---

## ملاحظات مهمة

1. **التزامن مع Webhook**: يتم تحديث حالة الإشعار (`delivered`, `read`) من خلال webhook من Meta
2. **الإشعارات التلقائية**: `isAutomatic = true` للإشعارات المرسلة تلقائياً (التذكيرات، التأكيدات)
3. **الإشعارات اليدوية**: `isAutomatic = false` و `sentBy` معبأ للإشعارات المرسلة يدوياً
4. **معالجة الأخطاء**: في حالة الفشل، `errorMessage` يحتوي على تفاصيل الخطأ
5. **الأرشفة**: يمكن أرشفة الإشعارات القديمة لتقليل حجم الجدول

---

## الصيانة والتشغيل

### تنظيف الإشعارات القديمة

```sql
-- حذف الإشعارات الأقدم من 90 يوم
DELETE FROM whatsapp_notifications 
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

### إعادة محاولة الإشعارات الفاشلة

```sql
-- الإشعارات الفاشلة التي يمكن إعادة محاولتها
SELECT * FROM whatsapp_notifications 
WHERE status = 'failed' 
AND errorMessage IS NULL 
AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```
