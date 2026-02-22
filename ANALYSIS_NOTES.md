# ملاحظات تحليل ربط التسجيلات بالحملات

## الوضع الحالي:
- campaigns: يحتوي على حقول شاملة (ميزانية، أهداف، منصات، فريق)
- leads: مرتبط بـ campaignId (علاقة مباشرة)
- appointments: مرتبط بـ campaignId + doctorId (علاقة مباشرة)
- offerLeads: مرتبط بـ offerId فقط (لا يوجد campaignId)
- campRegistrations: مرتبط بـ campId فقط (لا يوجد campaignId)
- offers: لا يوجد campaignId
- camps: لا يوجد campaignId
- doctors: لا يوجد campaignId

## المطلوب:
1. إضافة جدول ربط campaignOffers (many-to-many بين campaigns و offers)
2. إضافة جدول ربط campaignCamps (many-to-many بين campaigns و camps)
3. إضافة جدول ربط campaignDoctors (many-to-many بين campaigns و doctors)
4. إضافة campaignId اختياري في offerLeads
5. إضافة campaignId اختياري في campRegistrations
6. تحديث CampaignsPage UI لإظهار وإدارة الروابط
7. تحديث إحصائيات الحملة لتشمل العروض والمخيمات والأطباء المرتبطة

## النهج:
- جداول ربط many-to-many لأن عرض/مخيم/طبيب واحد يمكن أن يكون في عدة حملات
- campaignId اختياري في offerLeads/campRegistrations لتتبع مصدر التسجيل
