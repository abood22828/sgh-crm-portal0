/**
 * Script to link WhatsApp templates to message settings
 * ربط قوالب Meta بإعدادات الرسائل تلقائياً بناءً على أسماء القوالب
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

// ─── تعريف الربط بين أسماء الإعدادات وأسماء القوالب ─────────────────────────────────────────────
const templateMappings = [
  // مواعيد الأطباء
  { messageType: "appointment_confirmation", templateName: "appointment_confirmation" },
  { messageType: "appointment_confirmed", templateName: "appointment_confirmed" },
  { messageType: "appointment_arrived", templateName: "appointment_arrived" },
  { messageType: "appointment_completed", templateName: "appointment_completed" },
  
  // المخيمات
  { messageType: "camp_registration_confirmation", templateName: "camp_registration_confirmation" },
  { messageType: "camp_registration_confirmed", templateName: "camp_registration_confirmed" },
  { messageType: "camp_registration_arrived", templateName: "camp_registration_arrived" },
  { messageType: "camp_registration_completed", templateName: "camp_registration_completed" },
  
  // العروض
  { messageType: "offer_lead_confirmation", templateName: "offer_lead_confirmation" },
  { messageType: "offer_lead_confirmed", templateName: "offer_lead_confirmed" },
  { messageType: "offer_lead_arrived", templateName: "offer_lead_arrived" },
  { messageType: "offer_lead_completed", templateName: "offer_lead_completed" },
];

console.log("🚀 بدء ربط القوالب بالإعدادات...\n");

let linked = 0;
let notFound = 0;

for (const mapping of templateMappings) {
  try {
    // البحث عن القالب
    const [templates] = await connection.execute(
      "SELECT id FROM whatsapp_templates WHERE name = ? OR metaName = ? LIMIT 1",
      [mapping.templateName, mapping.templateName]
    );

    if (templates.length === 0) {
      console.log(`⚠️  لم يتم العثور على قالب: ${mapping.templateName}`);
      notFound++;
      continue;
    }

    const templateId = templates[0].id;

    // تحديث الإعداد
    const [result] = await connection.execute(
      "UPDATE message_settings SET whatsappTemplateId = ? WHERE messageType = ?",
      [templateId, mapping.messageType]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ تم ربط: ${mapping.messageType} ← ${mapping.templateName} (ID: ${templateId})`);
      linked++;
    } else {
      console.log(`⚠️  لم يتم تحديث: ${mapping.messageType}`);
      notFound++;
    }
  } catch (error) {
    console.error(`❌ خطأ في ربط ${mapping.messageType}:`, error.message);
  }
}

console.log("\n═══════════════════════════════════════");
console.log(`✅ تمت العملية:`);
console.log(`   - مرتبطة: ${linked}`);
console.log(`   - غير موجودة: ${notFound}`);
console.log("═══════════════════════════════════════\n");

await connection.end();
