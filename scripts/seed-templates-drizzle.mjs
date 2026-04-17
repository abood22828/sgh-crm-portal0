import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import * as schema from "../drizzle/schema.ts";

dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 1,
  enableKeepAlive: true,
  enableStreamingResults: false,
  waitForConnections: true,
  uri: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema, mode: 'default' });

const templates = [
  // 1. تأكيدات الحجوزات
  {
    name: "appointment_confirmation_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\nتم تأكيد موعدك الطبي بنجاح ✅\n\n📋 التفاصيل:\n• الطبيب: {{2}}\n• التخصص: {{3}}\n• التاريخ: {{4}}\n• الوقت: {{5}}\n• الموقع: شارع الستين الشمالي - صنعاء\n\nشكراً لاختيارك المستشفى السعودي الألماني",
    variables: JSON.stringify([
      "name",
      "doctor_name",
      "specialty",
      "date",
      "time",
    ]),
    metaName: "appointment_confirmation_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "camp_registration_confirmation_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\nتم تأكيد تسجيلك في المخيم الطبي بنجاح ✅\n\n🏥 المخيم: {{2}}\n📅 التاريخ: {{3}} - {{4}}\n📍 الموقع: {{5}}\n👥 الفئة: {{6}}\n\nشكراً لمشاركتك معنا!",
    variables: JSON.stringify([
      "name",
      "camp_name",
      "start_date",
      "end_date",
      "location",
      "category",
    ]),
    metaName: "camp_registration_confirmation_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "offer_booking_confirmation_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\nشكراً لاهتمامك بعرضنا الخاص! 🎁\n\n💰 العرض: {{2}}\n📝 التفاصيل: {{3}}\n⏰ صلاحية العرض: {{4}}\n\nسيتواصل معك فريقنا قريباً لتأكيد التفاصيل.\n\nشكراً لاختيارك المستشفى السعودي الألماني",
    variables: JSON.stringify([
      "name",
      "offer_title",
      "offer_details",
      "expiry_date",
    ]),
    metaName: "offer_booking_confirmation_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "MARKETING",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 2. التذكيرات
  {
    name: "appointment_reminder_24h_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\nتذكير: لديك موعد طبي غداً! ⏰\n\n📋 التفاصيل:\n• الطبيب: {{2}}\n• الوقت: {{3}}\n• الموقع: شارع الستين الشمالي - صنعاء\n\nالرجاء التأكد من وصولك قبل الموعد بـ 15 دقيقة.",
    variables: JSON.stringify(["name", "doctor_name", "time"]),
    metaName: "appointment_reminder_24h_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "appointment_reminder_1h_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\nتذكير: موعدك الطبي بعد ساعة واحدة! ⏰\n\nالرجاء التأكد من وصولك الآن.\n\n📍 الموقع: شارع الستين الشمالي - صنعاء\n📞 للاستفسارات: {{2}}",
    variables: JSON.stringify(["name", "phone_number"]),
    metaName: "appointment_reminder_1h_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 3. تحديثات الحالة
  {
    name: "appointment_status_confirmed_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\n✅ تم تأكيد موعدك الطبي بنجاح\n\n📅 الموعد: {{2}}\n⏰ الوقت: {{3}}\n👨‍⚕️ الطبيب: {{4}}\n\nشكراً لاختيارك المستشفى السعودي الألماني",
    variables: JSON.stringify(["name", "date", "time", "doctor_name"]),
    metaName: "appointment_status_confirmed_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "appointment_status_cancelled_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\n❌ تم إلغاء موعدك الطبي\n\n📅 الموعد: {{2}}\n📝 السبب: {{3}}\n\nللحجز مرة أخرى، يرجى التواصل معنا:\n📞 {{4}}",
    variables: JSON.stringify(["name", "date", "reason", "phone_number"]),
    metaName: "appointment_status_cancelled_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "appointment_status_rescheduled_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\n📅 تم إعادة جدولة موعدك الطبي\n\nالموعد الجديد:\n📅 التاريخ: {{2}}\n⏰ الوقت: {{3}}\n👨‍⚕️ الطبيب: {{4}}\n\nشكراً لتفهمك",
    variables: JSON.stringify(["name", "new_date", "new_time", "doctor_name"]),
    metaName: "appointment_status_rescheduled_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "appointment_status_completed_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\n✨ شكراً لزيارتك!\n\nنتمنى لك الشفاء العاجل وتحسن صحتك.\n\nإذا كنت بحاجة لموعد متابعة أو لديك أي استفسارات:\n📞 {{2}}\n\nشكراً لاختيارك المستشفى السعودي الألماني",
    variables: JSON.stringify(["name", "phone_number"]),
    metaName: "appointment_status_completed_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 4. المتابعة
  {
    name: "appointment_followup_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\nنتمنى أن تكون قد استفدت من زيارتك! 😊\n\n📋 هل تحتاج إلى:\n• موعد متابعة؟\n• استشارة أخرى؟\n• معلومات إضافية؟\n\nتواصل معنا:\n📞 {{2}}\n💬 WhatsApp: {{3}}",
    variables: JSON.stringify(["name", "phone_number", "whatsapp_number"]),
    metaName: "appointment_followup_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "camp_followup_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\nشكراً لمشاركتك في المخيم الطبي! 🏥\n\nنتمنى أن تكون قد استفدت من الخدمات المقدمة.\n\nهل لديك أي استفسارات أو تحتاج إلى:\n📞 {{2}}\n💬 WhatsApp: {{3}}",
    variables: JSON.stringify(["name", "phone_number", "whatsapp_number"]),
    metaName: "camp_followup_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 5. الإلغاء
  {
    name: "camp_cancellation_ar",
    category: "UTILITY",
    content:
      "مرحباً {{1}},\n\nتم إلغاء تسجيلك في المخيم الطبي.\n\n📅 المخيم: {{2}}\n📝 السبب: {{3}}\n\nللمزيد من المعلومات:\n📞 {{4}}",
    variables: JSON.stringify(["name", "camp_name", "reason", "phone_number"]),
    metaName: "camp_cancellation_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "UTILITY",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "offer_cancellation_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\n❌ انتهت صلاحية العرض الخاص\n\n🎁 العرض: {{2}}\n⏰ انتهى في: {{3}}\n\nتابع معنا للحصول على عروض جديدة!\n📞 {{4}}",
    variables: JSON.stringify([
      "name",
      "offer_title",
      "expiry_date",
      "phone_number",
    ]),
    metaName: "offer_cancellation_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "MARKETING",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 6. الترحيب والتسويق
  {
    name: "welcome_message_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\nأهلاً وسهلاً بك في المستشفى السعودي الألماني بصنعاء! 👋\n\n🏥 نقدم لك:\n• خدمات طبية متقدمة\n• فريق طبي متخصص\n• رعاية صحية شاملة\n\n📞 للحجز والاستفسارات:\n{{2}}\n\nشارع الستين الشمالي - صنعاء",
    variables: JSON.stringify(["name", "phone_number"]),
    metaName: "welcome_message_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "MARKETING",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  {
    name: "new_offer_announcement_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\n🎁 عرض خاص جديد!\n\n{{2}}\n\n💰 السعر: {{3}}\n⏰ صلاحية العرض: {{4}}\n\nاحجز الآن:\n📞 {{5}}",
    variables: JSON.stringify([
      "name",
      "offer_description",
      "price",
      "expiry_date",
      "phone_number",
    ]),
    metaName: "new_offer_announcement_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "MARKETING",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },

  // 7. قالب ترحيب مخصص بهوية المستشفى
  {
    name: "sgh_welcome_greeting_ar",
    category: "MARKETING",
    content:
      "مرحباً {{1}},\n\nأهلاً وسهلاً عزيزي العميل. المستشفى السعودي الألماني معكم. 👋\n\nتفضلوا بطرح استفساراتكم وسؤالكم. نحن هنا لخدمتكم.\n\n🏥 خدماتنا:\n• مواعيد طبية\n• مخيمات صحية\n• عروض خاصة\n\nشكراً لاختيارك المستشفى السعودي الألماني\n\n#المستشفى_السعودي_الألماني",
    variables: JSON.stringify(["name"]),
    metaName: "sgh_welcome_greeting_ar",
    languageCode: "ar",
    metaStatus: "APPROVED",
    metaCategory: "MARKETING",
    headerText: null,
    footerText: "المستشفى السعودي الألماني - صنعاء",
    createdBy: 1,
  },
];

async function seedTemplates() {
  try {
    console.log("🚀 بدء إضافة قوالب WhatsApp...\n");

    let addedCount = 0;
    let skippedCount = 0;

    for (const template of templates) {
      try {
        // التحقق من وجود القالب
        const existing = await db.query.whatsappTemplates.findFirst({
          where: (t, { eq }) => eq(t.metaName, template.metaName),
        });

        if (existing) {
          console.log(`⏭️  تخطي: ${template.metaName} (موجود بالفعل)`);
          skippedCount++;
          continue;
        }

        // إضافة القالب
        await db.insert(schema.whatsappTemplates).values({
          name: template.name,
          category: template.category,
          content: template.content,
          variables: template.variables,
          isActive: 1,
          usageCount: 0,
          createdBy: template.createdBy,
          metaName: template.metaName,
          languageCode: template.languageCode,
          metaStatus: template.metaStatus,
          metaCategory: template.metaCategory,
          headerText: template.headerText,
          footerText: template.footerText,
        });

        console.log(`✅ تم إضافة: ${template.metaName}`);
        addedCount++;
      } catch (error) {
        console.error(`❌ خطأ في إضافة ${template.metaName}:`, error.message);
      }
    }

    console.log(
      `\n✨ تم إكمال العملية!\n📊 الإحصائيات:\n   ✅ تم إضافة: ${addedCount} قالب\n   ⏭️  تم تخطي: ${skippedCount} قالب`
    );
    console.log("\n📌 الخطوات التالية:");
    console.log("1. جميع القوالب الآن معتمدة من Meta (metaStatus = APPROVED)");
    console.log("2. يمكنك البدء في اختبار الإرسال الفوري");
    console.log("3. تابع الرسائل المرسلة في جدول whatsapp_messages");
  } catch (error) {
    console.error("❌ خطأ عام:", error);
  } finally {
    await pool.end();
  }
}

seedTemplates();
