# مرجع عربي شامل لأحداث Meta Webhooks المرتبطة بـ WhatsApp Cloud API

## 1) مقدمة: ما هي Webhooks في Meta؟

تعتمد Meta على **Webhooks** كآلية لإرسال إشعارات إلى خادمك تلقائيًا عندما يحدث حدث مهم داخل المنظومة، بدلًا من أن يقوم نظامك بعمل polling مستمر. في سياق **WhatsApp Cloud API**، هذا يعني أن خادمك قد يستقبل أحداثًا مثل:

- وصول رسالة جديدة من المستخدم.
- تغيّر حالة رسالة أرسلتها سابقًا.
- تفاعل المستخدم مع زر أو قائمة.
- تحديثات مرتبطة برقم الهاتف أو جودة الحساب.
- بعض الإشعارات الإدارية المرتبطة بالقوالب أو الأصول التجارية أو سيناريو **Embedded Signup**.

الفكرة الأساسية هي أن نظامك يجب أن يكون قادرًا على:

1. استقبال طلب `POST` من Meta.
2. التحقق من صحة الطلب.
3. فهم نوع الحدث.
4. توجيهه إلى منطق المعالجة الصحيح.
5. تسجيله وتجنب تكراره.

> مهم: ليست كل الأحداث التي تراها في وثائق Meta تخص **رسائل WhatsApp** مباشرة. بعض الأحداث إدارية أو تجارية، وقد تصل ضمن اشتراكات Webhooks مختلفة أو callbacks مرتبطة بأصول الأعمال.

---

## 2) البنية العامة لحمولة Webhook

غالبًا تصل أحداث Meta ضمن بنية عامة مشابهة لهذا الشكل:

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505550000",
              "phone_number_id": "PHONE_NUMBER_ID"
            }
          }
        }
      ]
    }
  ]
}
```

### شرح الحقول الأساسية

#### `object`
يمثل نوع الكيان العام الذي صدر عنه الحدث.

أمثلة متوقعة:
- `whatsapp_business_account`
- أحيانًا أنواع أخرى مرتبطة بأصول الأعمال أو تكاملات Meta الأخرى حسب الاشتراك

#### `entry`
مصفوفة تحتوي على سجل أو أكثر. كل عنصر يمثل سياقًا مرتبطًا بكيان معيّن، مثل WABA معيّن.

#### `entry[].id`
هو غالبًا معرف الكيان الأساسي الذي يرتبط به الحدث، مثل **WABA ID**.

#### `changes`
مصفوفة التغييرات داخل نفس الـ entry.

#### `changes[].field`
هذا من أهم الحقول لأنه يعطيك **الفئة الرئيسية** للحدث.

أمثلة شائعة:
- `messages`
- `message_template_status_update`
- تحديثات إدارية أخرى متعلقة بالحساب أو الرقم بحسب الاشتراكات المتاحة

#### `changes[].value`
يحتوي على التفاصيل الفعلية للحدث. داخله قد تجد:
- `messages`
- `statuses`
- `contacts`
- `errors`
- `metadata`
- حقول إدارية خاصة بالقوالب أو الحساب أو الرقم

---

## 3) القاعدة العملية لفهم الحدث

في معظم تكاملات WhatsApp Cloud API، هناك ثلاث طبقات لفهم Webhook:

1. **نوع الكيان العام**: من `object`
2. **فئة التغيير**: من `field`
3. **النوع الدقيق للحدث**: من الحقول الداخلية داخل `value`

مثال عملي:
- إذا كان `field = "messages"`
- وداخل `value` يوجد `messages[]`
- فهذا يعني غالبًا **حدث رسالة واردة أو تفاعل من المستخدم**

أما إذا كان:
- `field = "messages"`
- وداخل `value` يوجد `statuses[]`
- فهذا يعني غالبًا **تحديث حالة رسالة صادرة**

وأما إذا كان:
- `field = "message_template_status_update"`
- فهذا يعني **تحديثًا إداريًا متعلقًا بحالة قالب رسالة**

---

## 4) التصنيف الرئيسي للأحداث المهمة

## 4.1 الرسائل الواردة Incoming Messages

هذه من أهم الأحداث التشغيلية. تصل عادة عندما يرسل المستخدم رسالة إلى رقم WhatsApp Business المرتبط بك.

قد تحتوي الرسالة على أنواع متعددة، مثل:
- نص `text`
- صورة `image`
- فيديو `video`
- ملف `document`
- صوت `audio`
- ملصق `sticker`
- موقع `location`
- جهة اتصال `contacts`
- رسالة تفاعلية `interactive`
- زر `button`
- سياق رد على رسالة سابقة `context`

### مثال JSON مبسط: رسالة نصية واردة

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "16505550000",
              "phone_number_id": "1234567890"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Ahmed"
                },
                "wa_id": "201000000000"
              }
            ],
            "messages": [
              {
                "from": "201000000000",
                "id": "wamid.HBg...",
                "timestamp": "1710000000",
                "type": "text",
                "text": {
                  "body": "مرحبا"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### ما الذي يستخرجه النظام؟
- المرسل: `messages[0].from`
- معرف الرسالة: `messages[0].id`
- نوع الرسالة: `messages[0].type`
- النص: `messages[0].text.body`
- اسم العميل: `contacts[0].profile.name`
- الرقم التجاري المستهدف: `metadata.phone_number_id`

### الإجراء البرمجي المقترح
- إنشاء سجل inbound message
- ربط الرسالة بالمحادثة المناسبة
- تمرير النص إلى منطق bot أو agent
- حفظ `wamid` لمنع المعالجة المكررة

---

## 4.2 الرسائل التفاعلية والتفاعلات Interactive Replies

عندما يرد المستخدم على رسالة تفاعلية، قد يصل الحدث على شكل `interactive` أو `button` حسب نوع التفاعل.

### أمثلة للتفاعلات
- الضغط على زر quick reply
- اختيار عنصر من list message
- الرد على أزرار call-to-action أو reply buttons حسب التصميم المدعوم
- استكمال مسار معين في flow-related messaging حسب ما أرسلته سابقًا

### مثال JSON مبسط: رد على زر

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "metadata": {
              "phone_number_id": "1234567890"
            },
            "contacts": [
              {
                "wa_id": "201000000000",
                "profile": {
                  "name": "Ahmed"
                }
              }
            ],
            "messages": [
              {
                "from": "201000000000",
                "id": "wamid.HBg...",
                "timestamp": "1710000001",
                "type": "interactive",
                "interactive": {
                  "type": "button_reply",
                  "button_reply": {
                    "id": "confirm_order",
                    "title": "تأكيد الطلب"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: اختيار من قائمة

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messages": [
              {
                "from": "201000000000",
                "id": "wamid.HBg...",
                "timestamp": "1710000002",
                "type": "interactive",
                "interactive": {
                  "type": "list_reply",
                  "list_reply": {
                    "id": "plan_premium",
                    "title": "الباقة المميزة",
                    "description": "اشتراك شهري"
                  }
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### الإجراء البرمجي المقترح
- تحويل `button_reply.id` أو `list_reply.id` إلى intent داخلي
- تحديث حالة الرحلة أو الطلب
- تنفيذ action مرتبط بالخيار
- الاحتفاظ بالنص الظاهر (`title`) والمعرف الداخلي (`id`)

---

## 4.3 الوسائط الواردة Media Messages

قد يرسل المستخدم وسائط بدل النص، مثل صورة أو ملف أو صوت. في هذه الحالة يصل النوع داخل `messages[].type`، وتكون البيانات المرجعية داخل الكائن الموافق لنوع الرسالة.

### مثال JSON مبسط: صورة واردة

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messages": [
              {
                "from": "201000000000",
                "id": "wamid.HBg...",
                "timestamp": "1710000003",
                "type": "image",
                "image": {
                  "mime_type": "image/jpeg",
                  "sha256": "abc123",
                  "id": "MEDIA_ID"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: مستند وارد

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "messages": [
              {
                "from": "201000000000",
                "id": "wamid.HBg...",
                "timestamp": "1710000004",
                "type": "document",
                "document": {
                  "filename": "invoice.pdf",
                  "mime_type": "application/pdf",
                  "sha256": "def456",
                  "id": "MEDIA_ID"
                }
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### كيف يعالجها النظام؟
- يقرأ `messages[0].type`
- يستخرج `media id`
- ينفذ طلبًا منفصلًا لاسترجاع رابط الوسائط عند الحاجة
- يحفظ metadata فقط أو ينزّل الملف حسب السياسة الأمنية

### ملاحظة مهمة
حدث الـ webhook لا يرسل دائمًا الملف نفسه، بل غالبًا يرسل **مرجعًا** له مثل `MEDIA_ID`، ثم يستخدم نظامك واجهة الوسائط لجلب الملف أو رابطه.

---

## 4.4 تحديثات حالات الرسائل Message Status Updates

هذه الفئة أساسية جدًا لتتبع دورة حياة الرسالة الصادرة. غالبًا تصل عندما ترسل أنت رسالة عبر API، ثم تُبلَّغ لاحقًا بالحالة.

الحالات الشائعة المتوقعة:
- `sent`
- `delivered`
- `read`
- `failed`

### مثال JSON مبسط: Delivered

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "metadata": {
              "phone_number_id": "1234567890"
            },
            "statuses": [
              {
                "id": "wamid.HBg...",
                "status": "delivered",
                "timestamp": "1710000010",
                "recipient_id": "201000000000"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: Read

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "statuses": [
              {
                "id": "wamid.HBg...",
                "status": "read",
                "timestamp": "1710000020",
                "recipient_id": "201000000000"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: Failed مع خطأ

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "messages",
          "value": {
            "statuses": [
              {
                "id": "wamid.HBg...",
                "status": "failed",
                "timestamp": "1710000030",
                "recipient_id": "201000000000",
                "errors": [
                  {
                    "code": 131026,
                    "title": "Message undeliverable",
                    "message": "Unable to deliver message"
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  ]
}
```

### ما الذي ينبغي على النظام فعله؟
- ربط `statuses[].id` بسجل الرسالة الصادرة
- تحديث حالة الرسالة داخليًا
- تسجيل لحظة التسليم أو القراءة
- في حالة `failed`، تصنيف الخطأ وإطلاق retry أو alert إذا لزم

---

## 4.5 الأخطاء Errors

قد تظهر الأخطاء داخل `statuses[].errors` أو ضمن حمولة event ذات صلة حسب النوع. الهدف ليس فقط تسجيل الخطأ، بل **تحويله إلى قرار برمجي**.

### أنواع قرارات شائعة عند الأخطاء
- **خطأ دائم**: لا تعِد المحاولة
- **خطأ مؤقت**: أعد المحاولة مع backoff
- **خطأ بيانات**: أصلح الحمولة أو القالب أو الرقم
- **خطأ صلاحيات/اشتراك**: افحص token أو app subscription أو WABA setup

### مثال JSON مبسط: خطأ متعلق بالحالة

```json
{
  "statuses": [
    {
      "id": "wamid.HBg...",
      "status": "failed",
      "errors": [
        {
          "code": 131000,
          "title": "Generic error",
          "message": "Something went wrong"
        }
      ]
    }
  ]
}
```

### توصية عملية
ابنِ طبقة داخلية باسم مثل `mapMetaErrorToAction()` تقوم بتحويل كل رمز خطأ إلى:
- مستوى خطورة
- هل يعاد الإرسال أم لا
- هل يحتاج تدخل بشري
- هل يجب إشعار العميل أو الفريق التقني

---

## 4.6 تغيّرات هوية العميل Customer Identity Changes

قد تحتاج الأنظمة إلى التعامل مع تغيّر بعض بيانات هوية المستخدم الظاهرة في الحدث، مثل:
- الاسم الظاهر في `contacts[].profile.name`
- بيانات جهة الاتصال إذا كانت الرسالة من نوع `contacts`
- تغيّر طريقة تعريف المحادثة بناءً على `wa_id`

### ملاحظة مهمة
لا يوجد عادة تصنيف منفصل شائع باسم webhook مستقل لـ **customer identity changes** بنفس وضوح حالات الرسائل، لكن قد تلاحظ تغيّر المعلومات التي تصل مع الرسائل نفسها، أو في أنواع رسائل معينة. لذلك الأفضل عمليًا هو:

- اعتبار `wa_id` هو الهوية الأساسية المستقرة نسبيًا
- اعتبار الاسم الظاهر field قابلًا للتغير
- تحديث الملف الشخصي للمستخدم عند وجود قيمة أحدث وموثوقة

### مثال JSON مبسط: الاسم الظاهر ضمن contact

```json
{
  "value": {
    "contacts": [
      {
        "profile": {
          "name": "Ahmed Ali"
        },
        "wa_id": "201000000000"
      }
    ],
    "messages": [
      {
        "id": "wamid.HBg...",
        "type": "text",
        "text": {
          "body": "أريد تحديث بياناتي"
        }
      }
    ]
  }
}
```

### الإجراء البرمجي المقترح
- إن كان المستخدم موجودًا، حدّث الاسم إذا كانت السياسة تسمح
- لا تعتمد على الاسم كمفتاح رئيسي للمستخدم
- اعتمد على `wa_id` و/أو المحادثة الداخلية

---

## 4.7 تحديثات حالة قوالب الرسائل Message Template Status Updates

هذه فئة إدارية مهمة، خصوصًا إذا كنت تستخدم القوالب بكثرة أو لديك منصة ترسل بالنيابة عن عملاء.

قد تتعلق التحديثات بـ:
- اعتماد القالب
- رفض القالب
- تعطيل القالب
- تغير حالته التشغيلية أو جودته حسب ما توفره Meta

غالبًا تصل عبر field مختلف عن `messages`، مثل:
- `message_template_status_update`

### مثال JSON مبسط

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "message_template_status_update",
          "value": {
            "message_template_id": "987654321",
            "message_template_name": "order_update",
            "message_template_language": "ar",
            "event": "APPROVED",
            "reason": null,
            "timestamp": 1710000100
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: رفض قالب

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "message_template_status_update",
          "value": {
            "message_template_id": "987654321",
            "message_template_name": "promo_template",
            "event": "REJECTED",
            "reason": "Policy violation",
            "timestamp": 1710000110
          }
        }
      ]
    }
  ]
}
```

### الإجراء البرمجي المقترح
- تحديث سجل القالب في قاعدة البيانات
- في حالة الرفض، إرسال تنبيه للفريق مع السبب
- منع الاعتماد على القالب تشغيليًا إذا أصبح غير صالح

---

## 4.8 تحديثات رقم الهاتف والجودة والحساب Phone Number / Quality / Account Updates

في سيناريوهات WhatsApp Business وEmbedded Signup، قد تكون هناك أحداث إدارية مرتبطة بـ:
- جودة رقم الهاتف
- تغيير الاسم المعروض للرقم
- مراجعة أو تقييد WABA
- ترقية/تغيير حالة رقم sandbox أو production
- تغييرات على الحساب التجاري أو الاشتراك أو الربط

هذه ليست دائمًا من نفس نوع **webhook الرسائل**، لكنها مهمة تشغيليًا وإداريًا.

### أمثلة لأحداث قد تكون ذات صلة
- تحديث جودة الرقم
- تحديث display name
- اكتمال مراجعة WABA
- حظر WABA أو تقييده
- تغييرات في حالة الأصول المرتبطة بعد الربط

### مثال JSON مبسط: تحديث جودة رقم

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "phone_number_quality_update",
          "value": {
            "phone_number_id": "1234567890",
            "display_phone_number": "16505550000",
            "event": "quality_rating_changed",
            "current_quality_rating": "GREEN",
            "timestamp": 1710000200
          }
        }
      ]
    }
  ]
}
```

### مثال JSON مبسط: تحديث اسم العرض أو أصل إداري

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "account_update",
          "value": {
            "event": "display_name_review_completed",
            "phone_number_id": "1234567890",
            "display_name": "My Business",
            "status": "APPROVED",
            "timestamp": 1710000210
          }
        }
      ]
    }
  ]
}
```

> تنبيه: أسماء بعض الحقول الإدارية قد تختلف بحسب نوع الاشتراك والإصدار وما إذا كان الحدث يأتي من Webhooks الخاصة بـ WhatsApp أو من اشتراكات/Callbacks تجارية أخرى في Meta. لذلك تعامل مع هذه الأحداث كفئة **إدارية** تحتاج مرونة في parser، لا كصيغة واحدة ثابتة 100%.

### الإجراء البرمجي المقترح
- تحديث حالة الرقم أو الأصل الإداري داخليًا
- إطلاق تنبيه إذا انخفضت الجودة أو تم تقييد الحساب
- إبلاغ لوحة التحكم الداخلية أو فريق الدعم

---

## 5) كيف يقرأ النظام الحدث ويصنفه عمليًا؟

## 5.1 خوارزمية قراءة مقترحة

1. استقبل الطلب الخام `POST`.
2. تحقّق من التوقيع إن كان مفعلًا.
3. تأكد أن `object` يخص نوعًا تعرفه.
4. مرّ على كل عنصر داخل `entry`.
5. مرّ على كل عنصر داخل `changes`.
6. اقرأ `field`.
7. افحص `value` لمعرفة إن كان يحتوي على:
   - `messages`
   - `statuses`
   - حقول قوالب
   - حقول إدارية للأصول أو الرقم
8. حوّل الحدث إلى **نوع داخلي موحد** داخل نظامك.
9. نفّذ الإجراء المناسب.
10. خزّن event log لأغراض التتبع وإعادة المعالجة.

## 5.2 تصنيف داخلي مقترح

يمكنك بناء enum أو taxonomy داخلية مثل:

- `inbound.message.text`
- `inbound.message.media.image`
- `inbound.message.media.document`
- `inbound.message.interactive.button_reply`
- `inbound.message.interactive.list_reply`
- `outbound.status.sent`
- `outbound.status.delivered`
- `outbound.status.read`
- `outbound.status.failed`
- `template.status.approved`
- `template.status.rejected`
- `account.phone.quality_changed`
- `account.phone.display_name_updated`
- `account.waba.review_completed`
- `account.waba.restricted`

## 5.3 Pseudocode مبسط

```json
{
  "logic": [
    "if field == 'messages' and value.messages exists => inbound event",
    "if field == 'messages' and value.statuses exists => message status event",
    "if field == 'message_template_status_update' => template status event",
    "if field in administrative fields => account/business administrative event",
    "else => unknown event, log and quarantine"
  ]
}
```

### مثال أقرب للتنفيذ

```text
for entry in payload.entry:
  for change in entry.changes:
    field = change.field
    value = change.value

    if field == 'messages' and value.messages:
      for msg in value.messages:
        classifyInboundMessage(msg)

    else if field == 'messages' and value.statuses:
      for status in value.statuses:
        classifyStatus(status)

    else if field == 'message_template_status_update':
      handleTemplateUpdate(value)

    else:
      handleAdministrativeOrUnknownEvent(field, value)
```

---

## 6) جدول Mapping مقترح

| اسم الحدث الداخلي المقترح | معنى الحدث | كيف تتعرف عليه | الإجراء البرمجي المقترح |
|---|---|---|---|
| inbound.message.text | رسالة نصية واردة | `field=messages` و `messages[].type=text` | حفظ الرسالة، تشغيل منطق الرد، ربطها بالمحادثة |
| inbound.message.image | صورة واردة | `field=messages` و `messages[].type=image` | حفظ metadata، جلب الوسائط عند الحاجة، تمريرها للمعالجة |
| inbound.message.document | مستند وارد | `messages[].type=document` | حفظ الملف المرجعي، فحص النوع، تنزيله إن لزم |
| inbound.message.audio | رسالة صوتية واردة | `messages[].type=audio` | حفظ media id، إرسالها لخدمة تفريغ/معالجة إن وجدت |
| inbound.message.video | فيديو وارد | `messages[].type=video` | حفظ المرجع وجدولة معالجة ثقيلة إن لزم |
| inbound.message.location | موقع وارد | `messages[].type=location` | استخراج الإحداثيات وتحديث السياق |
| inbound.message.contacts | جهة اتصال واردة | `messages[].type=contacts` | تخزين بيانات الجهة وتحديد ما إذا كانت قابلة للاستخدام |
| inbound.message.interactive.button_reply | ضغط على زر | `messages[].interactive.type=button_reply` | تحويله إلى intent أو action |
| inbound.message.interactive.list_reply | اختيار عنصر من قائمة | `messages[].interactive.type=list_reply` | تنفيذ الإجراء المرتبط بالعنصر المحدد |
| outbound.status.sent | تم إرسال الرسالة من النظام إلى منصة WhatsApp | `statuses[].status=sent` | تحديث السجل إلى sent |
| outbound.status.delivered | تم تسليم الرسالة للمستلم | `statuses[].status=delivered` | تحديث التسليم وإيقاف retry |
| outbound.status.read | قام المستخدم بقراءة الرسالة | `statuses[].status=read` | تحديث analytics أو SLA أو funnel |
| outbound.status.failed | فشل إرسال الرسالة | `statuses[].status=failed` | تسجيل الخطأ، تصنيفه، retry أو alert |
| template.status.approved | اعتماد قالب | `field=message_template_status_update` و `event=APPROVED` | تفعيل القالب داخليًا |
| template.status.rejected | رفض قالب | `field=message_template_status_update` و `event=REJECTED` | تعطيل القالب وإشعار الفريق |
| account.phone.quality_changed | تغير جودة الرقم | field إداري خاص بالجودة | تحديث لوحة المتابعة والتنبيه عند التراجع |
| account.phone.display_name_review_completed | اكتمال مراجعة اسم العرض | حدث إداري خاص بالرقم | تحديث حالة الرقم داخليًا |
| account.waba.review_completed | اكتمال مراجعة WABA | حدث إداري متعلق بالحساب | فتح أو تحديث المسار التشغيلي للعميل |
| account.waba.restricted | تقييد أو حظر WABA | حدث إداري/تجاري | تنبيه عالي الأولوية وتعليق الإرسال |
| unknown.meta.event | حدث غير معروف | لا ينطبق عليه parser الحالي | تسجيله في quarantine ومراجعته يدويًا |

---

## 7) الأحداث الإدارية/التجارية المرتبطة بـ Embedded Signup وBusiness Assets

عند العمل في سيناريو **Embedded Signup**، توجد أحداث ومؤشرات مهمة لا تعتبر دائمًا من فئة **webhook الرسائل** التقليدية، لكنها مؤثرة جدًا على التشغيل.

### أمثلة على ذلك
- نجاح ربط WABA بالتطبيق
- إضافة أو ربط System User
- تفعيل الاشتراك على WABA
- مشاركة Line of Credit أو التحقق منها
- تحديث حالة رقم الهاتف أو جودته
- اعتماد اسم العرض أو اكتمال مراجعة WABA
- تحديثات متعلقة بقوالب الرسائل

### كيف تفكر فيها معماريًا؟
قسّم الأحداث إلى مجموعتين:

#### أ) أحداث تشغيلية Messaging Webhooks
هذه تستخدمها عادة في مسار المحادثة المباشر، مثل:
- الرسائل الواردة
- التفاعلات
- حالات الرسائل
- أخطاء الإرسال

#### ب) أحداث إدارية/تجارية Administrative / Business Callbacks
هذه تستخدمها في مسارات:
- onboarding
- compliance
- readiness checks
- إدارة الأصول التجارية
- المراقبة والتنبيهات الداخلية

### توصية عملية
أنشئ داخل نظامك قناتين منطقيتين:
- **Messaging Event Processor**
- **Administrative Event Processor**

بحيث لا تختلط أحداث المحادثة اليومية مع أحداث تهيئة الحساب أو الأصول.

### مثال JSON مبسط: حدث إداري بعد الربط

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "WABA_ID",
      "changes": [
        {
          "field": "account_update",
          "value": {
            "event": "waba_review_completed",
            "waba_id": "WABA_ID",
            "status": "APPROVED",
            "timestamp": 1710000300
          }
        }
      ]
    }
  ]
}
```

### لماذا هذا مهم؟
لأن كثيرًا من المنصات تبني parser واحدًا مخصصًا فقط للرسائل، ثم تتفاجأ لاحقًا بأحداث إدارية لا يفهمها النظام. النتيجة تكون:
- تجاهل إشعارات حرجة
- فقدان مؤشرات تتعلق بالجودة أو التقييد
- عدم مزامنة حالة onboarding مع Meta

---

## 8) Best Practices للتعامل مع أحداث Meta Webhooks

## 8.1 التحقق من التوقيع Signature Verification

من أفضل الممارسات التحقق من أن الطلب قادم فعلًا من Meta، عادة عبر:
- التحقق من headers الخاصة بالتوقيع
- استخدام App Secret لحساب ومقارنة التوقيع

### لماذا؟
لمنع:
- الطلبات المزيفة
- حقن أحداث مزورة
- إساءة استخدام endpoint

### توصية عملية
- احتفظ بنسخة raw body قبل parsing
- نفّذ التحقق قبل قبول الحدث
- إذا فشل التحقق، أعد `403`

---

## 8.2 التعامل مع التكرار Idempotency

قد تعيد Meta إرسال نفس الحدث أو قد تصلك أحداث متشابهة أكثر من مرة لأسباب شبكية أو تشغيلية. لذلك يجب أن يكون نظامك **idempotent**.

### مفاتيح مناسبة لمنع التكرار
- `messages[].id` للرسائل الواردة
- `statuses[].id + statuses[].status` لحالات الرسائل
- معرّف القالب + نوع الحدث + timestamp في تحديثات القوالب
- hash للحمولة أو event fingerprint للأحداث الإدارية إذا لم يوجد id واضح

### توصية عملية
أنشئ جدولًا مثل:
- `processed_webhook_events`

ويحتوي على:
- dedupe key
- first seen at
- event type
- processing result

---

## 8.3 الاستجابة السريعة وعدم تنفيذ العمل الثقيل داخل الـ request

الأفضل أن:
1. تستقبل webhook
2. تتحقق منه
3. تحفظه في queue أو log
4. تعيد `200 OK` بسرعة
5. تعالج التفاصيل في worker لاحقًا

### لماذا؟
- لتقليل timeouts
- لتحسين الاعتمادية
- لتسهيل إعادة المعالجة
- لفصل ingestion عن business logic

---

## 8.4 احترام الترتيب الزمني لكن دون افتراض الكمال

أحيانًا قد تصل الأحداث بترتيب غير مثالي. مثلًا:
- قد ترى `delivered` قبل تسجيل `sent` داخليًا إذا كان هناك تأخير في بعض المسارات
- قد يصل تحديث إداري متأخرًا عن لحظة التغيير الفعلية

### لذلك:
- استخدم `timestamp` الموجود في الحدث
- لا تعتمد على ترتيب الوصول فقط
- اسمح بعمليات upsert للحالة
- لا تفترض أن كل transition سيصل حتمًا

---

## 8.5 الاحتفاظ بالحدث الخام Raw Event Logging

من المهم جدًا حفظ نسخة raw من الحدث، خاصة في المراحل الأولى من بناء النظام.

### الفائدة
- debugging
- اكتشاف حقول جديدة
- مراجعة الاختلافات بين الأحداث التشغيلية والإدارية
- تحسين parser مع الوقت

### توصية
احفظ:
- raw body
- headers المهمة
- وقت الوصول
- نتيجة التحقق من التوقيع
- حالة المعالجة

---

## 8.6 بناء Parser مرن للحقول غير المعروفة

Meta قد توسّع الحمولة أو تضيف حقولًا جديدة. لذلك لا تبنِ parser هشًا يفشل إذا ظهر حقل جديد.

### الأفضل
- تجاهل الحقول غير المعروفة مع log
- استخدم parsing دفاعيًا
- افصل validation الصارم عن ingestion الأساسي

---

## 8.7 فصل المنطق حسب مستوى الأهمية

صنّف الأحداث إلى:
- **حرجة جدًا**: failed, account restricted, quality downgrade
- **تشغيلية**: inbound messages, delivered, read
- **إدارية**: template approved, review completed
- **مرجعية/غير معروفة**: تحتاج مراجعة فقط

هذا يساعدك في:
- تصميم التنبيهات
- تحديد أولوية المعالجة
- توزيع الأحداث على services مختلفة

---

## 8.8 المراقبة والتنبيهات

من المفيد مراقبة مؤشرات مثل:
- عدد الرسائل الواردة بالدقيقة
- نسبة `failed` في statuses
- تكرار أخطاء معينة
- تغير جودة الأرقام
- أحداث تقييد الحساب أو رفض القوالب

---

## 9) نموذج بنية داخلية موحدة للأحداث داخل نظامك

بدل أن تتعامل كل خدمة مع حمولة Meta الخام مباشرة، من الأفضل تحويل الحدث إلى صيغة داخلية موحدة.

### مثال مقترح

```json
{
  "event_category": "messaging",
  "event_name": "inbound.message.text",
  "provider": "meta",
  "channel": "whatsapp",
  "waba_id": "WABA_ID",
  "phone_number_id": "PHONE_NUMBER_ID",
  "customer_id": "201000000000",
  "message_id": "wamid.HBg...",
  "timestamp": "1710000000",
  "payload": {
    "text": "مرحبا"
  }
}
```

### الفائدة
- يسهل ربطها مع queue أو event bus
- يسهّل بناء analytics
- يسهّل دعم أكثر من نوع أحداث إداري وتشغيلي
- يمنع انتشار منطق Meta الخام داخل كامل النظام

---

## 10) Checklist عملية عند بناء Webhook Server

- تأكد من endpoint مخصص لاستقبال Meta Webhooks.
- فعّل التحقق من webhook verification challenge عند الإعداد الأولي.
- خزّن App Secret وVerify Token بشكل آمن.
- تحقّق من التوقيع قبل المعالجة.
- سجل raw payload.
- ابنِ deduplication layer.
- صنّف الأحداث إلى messaging أو administrative.
- اربط inbound messages بالمحادثات.
- اربط statuses بالرسائل الصادرة.
- فعّل monitoring للأخطاء والجودة والحساب.
- احتفظ بمنطقة quarantine للأحداث غير المفهومة.

---

## 11) خلاصة تنفيذية

إذا أردت أن يفهم نظامك أحداث Meta/WhatsApp Cloud API بشكل صحيح، فالتصميم الأفضل هو:

1. **استقبال موثوق وآمن** للـ webhook.
2. **فهم هرمي** للحمولة: `object -> entry -> changes -> field -> value`.
3. **تصنيف واضح** بين:
   - رسائل واردة
   - حالات رسائل
   - تفاعلات
   - وسائط
   - أخطاء
   - قوالب
   - أحداث إدارية وتجارية
4. **تحويل الحدث إلى صيغة داخلية موحدة**.
5. **ضمان idempotency** وعدم الاعتماد على ترتيب الوصول فقط.
6. **فصل أحداث المحادثة عن أحداث onboarding/business assets**.

بهذا الشكل سيصبح خادمك قادرًا ليس فقط على استقبال الأحداث، بل على **فهمها تشغيليًا** وتحويلها إلى قرارات برمجية واضحة.

---

## 12) ملاحظات ختامية مهمة

- أمثلة JSON في هذا الملف **مبسطة ومرجعية**، وهدفها مساعدتك على تصميم parser عملي.
- بعض الحقول أو أسماء الأحداث الإدارية قد تختلف حسب:
  - إصدار Graph API
  - نوع الاشتراك
  - نوع الأصل التجاري
  - ما إذا كان الحدث يأتي من WhatsApp messaging webhook أو من فئة إدارية أخرى ضمن Meta
- لذلك يُنصح دائمًا ببناء parser مرن، مع الاحتفاظ بالحدث الخام للمراجعة.

إذا استخدمت هذا الملف كمرجع داخلي، فالأفضل أن تعتبره **خريطة تصنيف ومعالجة** للأحداث، وليس فقط قائمة أسماء حقول.