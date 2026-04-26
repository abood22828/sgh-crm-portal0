/**
 * Script to update delivery channel for message settings without templates
 * تحديث قناة الإرسال للإعدادات التي لا تحتوي على قوالب Meta
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

console.log("🚀 بدء تحديث قنوات الإرسال...\n");

try {
  // تحديث جميع الإعدادات التي لا تحتوي على قوالب Meta
  // استخدام "whatsapp_integration" لإرسال النص العادي
  const [result] = await connection.execute(
    `UPDATE message_settings 
     SET deliveryChannel = 'whatsapp_integration' 
     WHERE whatsappTemplateId IS NULL 
     AND deliveryChannel = 'whatsapp_api'`
  );

  console.log(`✅ تم تحديث ${result.affectedRows} إعداد`);
  console.log("   - تم تغيير deliveryChannel من 'whatsapp_api' إلى 'whatsapp_integration'");
  console.log("   - الآن ستُرسل الرسائل كنصوص عادية بدلاً من قوالب Meta\n");

  // عرض الإعدادات المحدثة
  const [settings] = await connection.execute(
    `SELECT id, messageType, entityType, triggerEvent, deliveryChannel, whatsappTemplateId 
     FROM message_settings 
     WHERE deliveryChannel = 'whatsapp_integration'
     ORDER BY entityType, triggerEvent`
  );

  console.log("📋 الإعدادات المحدثة:");
  console.log("═══════════════════════════════════════");
  for (const setting of settings) {
    console.log(`${setting.messageType} (${setting.entityType}:${setting.triggerEvent})`);
    console.log(`  - القناة: ${setting.deliveryChannel}`);
    console.log(`  - القالب: ${setting.whatsappTemplateId ? `ID ${setting.whatsappTemplateId}` : "بدون قالب"}\n`);
  }

  console.log("═══════════════════════════════════════\n");
  console.log("✅ تمت العملية بنجاح!");
  console.log("💡 ملاحظة: عندما تُمزامن القوالب من Meta، يمكنك تحديث deliveryChannel إلى 'whatsapp_api' وربط القوالب.\n");

} catch (error) {
  console.error("❌ خطأ:", error.message);
}

await connection.end();
