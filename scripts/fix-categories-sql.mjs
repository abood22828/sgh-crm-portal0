/**
 * fix-categories-sql.mjs
 * 
 * تحديث فئات القوالب بطريقة صحيحة:
 * 1. تغيير العمود إلى VARCHAR مؤقتاً
 * 2. تحديث القيم القديمة إلى الجديدة
 * 3. تغيير العمود إلى ENUM الجديد
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL غير محدد');
  process.exit(1);
}

async function fixCategories() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔄 بدء إصلاح فئات القوالب...\n');
    
    // الخطوة 1: تغيير العمود إلى VARCHAR مؤقتاً
    console.log('1️⃣ تغيير العمود إلى VARCHAR...');
    await connection.execute(
      `ALTER TABLE whatsapp_templates MODIFY COLUMN category VARCHAR(50) NOT NULL DEFAULT 'UTILITY'`
    );
    console.log('   ✅ تم تغيير العمود إلى VARCHAR');
    
    // الخطوة 2: تحديث القيم القديمة
    console.log('\n2️⃣ تحديث القيم القديمة...');
    const mappings = [
      { old: 'confirmation', new: 'UTILITY' },
      { old: 'reminder', new: 'UTILITY' },
      { old: 'thank_you', new: 'MARKETING' },
      { old: 'follow_up', new: 'MARKETING' },
      { old: 'cancellation', new: 'UTILITY' },
      { old: 'custom', new: 'UTILITY' },
    ];
    
    let totalUpdated = 0;
    for (const mapping of mappings) {
      const [result] = await connection.execute(
        `UPDATE whatsapp_templates SET category = ? WHERE category = ?`,
        [mapping.new, mapping.old]
      );
      if (result.affectedRows > 0) {
        console.log(`   ✅ "${mapping.old}" → "${mapping.new}": ${result.affectedRows} سجل`);
        totalUpdated += result.affectedRows;
      }
    }
    console.log(`   📊 إجمالي المحدّث: ${totalUpdated} سجل`);
    
    // الخطوة 3: التحقق من عدم وجود قيم غير صالحة
    const [invalidRows] = await connection.execute(
      `SELECT id, name, category FROM whatsapp_templates 
       WHERE category NOT IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')`
    );
    
    if (invalidRows.length > 0) {
      console.log('\n⚠️ سجلات بقيم غير صالحة - سيتم تحويلها إلى UTILITY:');
      for (const row of invalidRows) {
        console.log(`   ID: ${row.id} | Name: ${row.name} | Category: ${row.category}`);
      }
      await connection.execute(
        `UPDATE whatsapp_templates SET category = 'UTILITY' 
         WHERE category NOT IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')`
      );
      console.log('   ✅ تم تحويل جميع القيم غير الصالحة إلى UTILITY');
    }
    
    // الخطوة 4: تغيير العمود إلى ENUM الجديد
    console.log('\n3️⃣ تغيير العمود إلى ENUM الجديد...');
    await connection.execute(
      `ALTER TABLE whatsapp_templates MODIFY COLUMN category ENUM('MARKETING','UTILITY','AUTHENTICATION') NOT NULL DEFAULT 'UTILITY'`
    );
    console.log('   ✅ تم تغيير العمود إلى ENUM الجديد');
    
    // التحقق النهائي
    const [finalData] = await connection.execute(
      `SELECT category, COUNT(*) as count FROM whatsapp_templates GROUP BY category`
    );
    console.log('\n📊 الفئات النهائية:');
    finalData.forEach(row => {
      console.log(`   ${row.category}: ${row.count} قالب`);
    });
    
    console.log('\n✅ اكتمل الإصلاح بنجاح!');
    console.log('💡 الآن يمكن تشغيل: pnpm db:push');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixCategories();
