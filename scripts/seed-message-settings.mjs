/**
 * Seed script for message_settings table
 * يضيف/يحدث جميع الرسائل التلقائية مع triggerEvent وentityType
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// ─── تعريف جميع الرسائل التلقائية ─────────────────────────────────────────────
const messages = [
  // ══════════════════════════════════════════════════════════════════════════════
  // مواعيد الأطباء (appointment)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    messageType: "appointment_confirmation",
    displayName: "تأكيد الحجز التفاعلي - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_create",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "date", "time", "doctor", "service"]),
    messageContent: `مرحباً {name}،

شكراً لحجزك موعد في المستشفى السعودي الألماني - صنعاء.

📅 التاريخ: {date}
🕐 الوقت: {time}
👨‍⚕️ الطبيب: {doctor}
🏥 الخدمة: {service}

يرجى تأكيد حجزك:`,
    description: "تُرسل تلقائياً عند إنشاء حجز جديد لموعد طبيب",
  },
  {
    messageType: "appointment_confirmed",
    displayName: "تأكيد نجاح الحجز - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_confirmed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "date", "time", "doctor", "service"]),
    messageContent: `عزيزي {name}،

✅ تم تأكيد حجزك بنجاح في المستشفى السعودي الألماني - صنعاء.

📅 التاريخ: {date}
🕐 الوقت: {time}
👨‍⚕️ الطبيب: {doctor}
🏥 الخدمة: {service}

نتطلع لرؤيتك. يرجى الحضور قبل 15 دقيقة من موعدك.`,
    description: "تُرسل تلقائياً عند تحديث حالة الموعد إلى مؤكد",
  },
  {
    messageType: "appointment_arrived",
    displayName: "ترحيب عند الحضور - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_arrived",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "doctor", "service"]),
    messageContent: `أهلاً وسهلاً {name}! 👋

يسعدنا استقبالك في المستشفى السعودي الألماني - صنعاء.

👨‍⚕️ طبيبك: {doctor}
🏥 الخدمة: {service}

يرجى التوجه إلى مكتب الاستقبال. نتمنى لك الشفاء العاجل.`,
    description: "تُرسل تلقائياً عند تحديث حالة الموعد إلى حضر",
  },
  {
    messageType: "appointment_completed",
    displayName: "طلب تقييم التجربة - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_completed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "doctor", "service"]),
    messageContent: `عزيزي {name}،

نأمل أن تكون زيارتك للمستشفى السعودي الألماني - صنعاء قد كانت مريحة ومفيدة.

⭐ رأيك يهمنا! يرجى تقييم تجربتك مع:
👨‍⚕️ الطبيب: {doctor}
🏥 الخدمة: {service}

شكراً لثقتك بنا. نتمنى لك دوام الصحة والعافية.`,
    description: "تُرسل تلقائياً عند تحديث حالة الموعد إلى مكتمل",
  },
  {
    messageType: "appointment_cancelled",
    displayName: "إلغاء الحجز - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_cancelled",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "date", "time", "doctor"]),
    messageContent: `عزيزي {name}،

نُعلمك بأنه تم إلغاء موعدك في المستشفى السعودي الألماني - صنعاء.

📅 التاريخ: {date}
🕐 الوقت: {time}
👨‍⚕️ الطبيب: {doctor}

يمكنك حجز موعد جديد عبر موقعنا أو الاتصال بنا على: 8000018
نعتذر عن أي إزعاج.`,
    description: "تُرسل تلقائياً عند تحديث حالة الموعد إلى ملغي",
  },
  {
    messageType: "appointment_reminder_24h",
    displayName: "تذكير 24 ساعة - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_reminder_24h",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "date", "time", "doctor", "service"]),
    messageContent: `تذكير: عزيزي {name}،

🔔 لديك موعد غداً في المستشفى السعودي الألماني - صنعاء.

📅 التاريخ: {date}
🕐 الوقت: {time}
👨‍⚕️ الطبيب: {doctor}
🏥 الخدمة: {service}

يرجى الحضور قبل 15 دقيقة من موعدك.`,
    description: "تُرسل تلقائياً قبل 24 ساعة من الموعد",
  },
  {
    messageType: "appointment_reminder_1h",
    displayName: "تذكير ساعة - مواعيد الأطباء",
    category: "patient_journey",
    entityType: "appointment",
    triggerEvent: "on_reminder_1h",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "time", "doctor"]),
    messageContent: `تذكير: عزيزي {name}،

⏰ موعدك بعد ساعة واحدة!

🕐 الوقت: {time}
👨‍⚕️ الطبيب: {doctor}

يرجى التوجه الآن للمستشفى السعودي الألماني - صنعاء.`,
    description: "تُرسل تلقائياً قبل ساعة من الموعد",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // تسجيلات المخيمات (camp_registration)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    messageType: "camp_registration_confirmation",
    displayName: "تأكيد التسجيل في المخيم التفاعلي",
    category: "patient_journey",
    entityType: "camp_registration",
    triggerEvent: "on_create",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "campName", "date", "location"]),
    messageContent: `مرحباً {name}،

شكراً لتسجيلك في المخيم الطبي التفاعلي للمستشفى السعودي الألماني - صنعاء.

🏕️ المخيم: {campName}
📅 التاريخ: {date}
📍 الموقع: {location}

سيتم التواصل معك قريباً لتأكيد التسجيل.`,
    description: "تُرسل تلقائياً عند التسجيل في مخيم جديد",
  },
  {
    messageType: "camp_registration_confirmed",
    displayName: "تأكيد نجاح التسجيل في المخيم",
    category: "patient_journey",
    entityType: "camp_registration",
    triggerEvent: "on_confirmed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "campName", "date", "location"]),
    messageContent: `عزيزي {name}،

✅ تم تأكيد تسجيلك في المخيم الطبي بنجاح!

🏕️ المخيم: {campName}
📅 التاريخ: {date}
📍 الموقع: {location}

يرجى الحضور في الوقت المحدد. نتطلع لرؤيتك!`,
    description: "تُرسل تلقائياً عند تحديث حالة التسجيل إلى مؤكد",
  },
  {
    messageType: "camp_registration_arrived",
    displayName: "ترحيب عند الحضور - المخيمات",
    category: "patient_journey",
    entityType: "camp_registration",
    triggerEvent: "on_arrived",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "campName"]),
    messageContent: `أهلاً وسهلاً {name}! 👋

يسعدنا استقبالك في مخيم {campName} للمستشفى السعودي الألماني - صنعاء.

يرجى التوجه إلى نقطة التسجيل للحصول على بطاقتك. نتمنى لك تجربة مفيدة!`,
    description: "تُرسل تلقائياً عند تحديث حالة التسجيل إلى حضر",
  },
  {
    messageType: "camp_registration_completed",
    displayName: "طلب تقييم التجربة - المخيمات",
    category: "patient_journey",
    entityType: "camp_registration",
    triggerEvent: "on_completed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "campName"]),
    messageContent: `عزيزي {name}،

نشكرك على مشاركتك في مخيم {campName} للمستشفى السعودي الألماني - صنعاء.

⭐ رأيك يهمنا! كيف كانت تجربتك في المخيم؟

شكراً لثقتك بنا. نتمنى لك دوام الصحة والعافية.`,
    description: "تُرسل تلقائياً عند تحديث حالة التسجيل إلى مكتمل",
  },
  {
    messageType: "camp_registration_cancelled",
    displayName: "إلغاء التسجيل في المخيم",
    category: "patient_journey",
    entityType: "camp_registration",
    triggerEvent: "on_cancelled",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "campName", "date"]),
    messageContent: `عزيزي {name}،

نُعلمك بأنه تم إلغاء تسجيلك في مخيم {campName}.

📅 التاريخ: {date}

يمكنك التسجيل في مخيماتنا القادمة عبر موقعنا أو الاتصال بنا على: 8000018
نعتذر عن أي إزعاج.`,
    description: "تُرسل تلقائياً عند تحديث حالة التسجيل إلى ملغي",
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // حجوزات العروض (offer_lead)
  // ══════════════════════════════════════════════════════════════════════════════
  {
    messageType: "offer_lead_confirmation",
    displayName: "تأكيد حجز العرض التفاعلي",
    category: "patient_journey",
    entityType: "offer_lead",
    triggerEvent: "on_create",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "offerName", "price"]),
    messageContent: `مرحباً {name}،

شكراً لحجزك عرض {offerName} في المستشفى السعودي الألماني - صنعاء.

💰 السعر: {price}

سيتم التواصل معك قريباً لتأكيد الحجز وتحديد الموعد المناسب.`,
    description: "تُرسل تلقائياً عند حجز عرض جديد",
  },
  {
    messageType: "offer_lead_confirmed",
    displayName: "تأكيد نجاح حجز العرض",
    category: "patient_journey",
    entityType: "offer_lead",
    triggerEvent: "on_confirmed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "offerName", "price"]),
    messageContent: `عزيزي {name}،

✅ تم تأكيد حجزك لعرض {offerName} بنجاح!

💰 السعر: {price}

سيتم التواصل معك لتحديد موعد الخدمة. نتطلع لخدمتك!`,
    description: "تُرسل تلقائياً عند تحديث حالة الحجز إلى مؤكد",
  },
  {
    messageType: "offer_lead_arrived",
    displayName: "ترحيب عند الحضور - العروض",
    category: "patient_journey",
    entityType: "offer_lead",
    triggerEvent: "on_arrived",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "offerName"]),
    messageContent: `أهلاً وسهلاً {name}! 👋

يسعدنا استقبالك للاستفادة من عرض {offerName} في المستشفى السعودي الألماني - صنعاء.

يرجى التوجه إلى مكتب الاستقبال. نتمنى لك تجربة رائعة!`,
    description: "تُرسل تلقائياً عند تحديث حالة الحجز إلى حضر",
  },
  {
    messageType: "offer_lead_completed",
    displayName: "طلب تقييم التجربة - العروض",
    category: "patient_journey",
    entityType: "offer_lead",
    triggerEvent: "on_completed",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "offerName"]),
    messageContent: `عزيزي {name}،

نشكرك على استفادتك من عرض {offerName} في المستشفى السعودي الألماني - صنعاء.

⭐ رأيك يهمنا! كيف كانت تجربتك؟

شكراً لثقتك بنا. نتمنى لك دوام الصحة والعافية.`,
    description: "تُرسل تلقائياً عند تحديث حالة الحجز إلى مكتمل",
  },
  {
    messageType: "offer_lead_cancelled",
    displayName: "إلغاء حجز العرض",
    category: "patient_journey",
    entityType: "offer_lead",
    triggerEvent: "on_cancelled",
    deliveryChannel: "whatsapp_api",
    availableVariables: JSON.stringify(["name", "offerName"]),
    messageContent: `عزيزي {name}،

نُعلمك بأنه تم إلغاء حجزك لعرض {offerName}.

يمكنك الاطلاع على عروضنا الأخرى عبر موقعنا أو الاتصال بنا على: 8000018
نعتذر عن أي إزعاج.`,
    description: "تُرسل تلقائياً عند تحديث حالة الحجز إلى ملغي",
  },
];

console.log(`\n🚀 بدء إضافة/تحديث ${messages.length} رسالة تلقائية...\n`);

let added = 0;
let updated = 0;
let errors = 0;

for (const msg of messages) {
  try {
    // Check if exists
    const [existing] = await connection.execute(
      "SELECT id FROM message_settings WHERE messageType = ?",
      [msg.messageType]
    );

    if (existing.length > 0) {
      // Update existing
      await connection.execute(
        `UPDATE message_settings SET
          displayName = ?,
          entityType = ?,
          triggerEvent = ?,
          deliveryChannel = ?,
          availableVariables = ?,
          description = ?
        WHERE messageType = ?`,
        [
          msg.displayName,
          msg.entityType,
          msg.triggerEvent,
          msg.deliveryChannel,
          msg.availableVariables,
          msg.description,
          msg.messageType,
        ]
      );
      console.log(`✏️  تحديث: ${msg.displayName}`);
      updated++;
    } else {
      // Insert new
      await connection.execute(
        `INSERT INTO message_settings
          (messageType, displayName, category, entityType, triggerEvent, deliveryChannel, availableVariables, messageContent, description, isEnabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          msg.messageType,
          msg.displayName,
          msg.category,
          msg.entityType,
          msg.triggerEvent,
          msg.deliveryChannel,
          msg.availableVariables,
          msg.messageContent,
          msg.description,
        ]
      );
      console.log(`✅ إضافة: ${msg.displayName}`);
      added++;
    }
  } catch (err) {
    console.error(`❌ خطأ في ${msg.messageType}:`, err.message);
    errors++;
  }
}

await connection.end();

console.log(`\n═══════════════════════════════════════`);
console.log(`✅ تمت العملية:`);
console.log(`   - مضافة جديدة: ${added}`);
console.log(`   - محدّثة: ${updated}`);
console.log(`   - أخطاء: ${errors}`);
console.log(`═══════════════════════════════════════\n`);
