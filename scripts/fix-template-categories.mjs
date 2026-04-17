/**
 * fix-template-categories.mjs
 * 
 * سكريبت لتحديث فئات القوالب القديمة في قاعدة البيانات
 * قبل تطبيق migration تغيير enum
 * 
 * الفئات القديمة → الفئات الجديدة (Meta الرسمية):
 *   confirmation → UTILITY
 *   reminder     → UTILITY
 *   thank_you    → MARKETING
 *   follow_up    → MARKETING
 *   cancellation → UTILITY
 *   custom       → UTILITY
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL غير محدد في متغيرات البيئة');
  process.exit(1);
}

async function fixTemplateCategories() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔄 بدء تحديث فئات القوالب...\n');
    
    // عرض البيانات الحالية
    const [currentData] = await connection.execute(
      'SELECT id, name, category FROM whatsapp_templates ORDER BY id'
    );
    console.log(`📊 القوالب الحالية (${currentData.length} قالب):`);
    currentData.forEach(row => {
      console.log(`  ID: ${row.id} | Name: ${row.name} | Category: ${row.category}`);
    });
    
    console.log('\n🔄 تطبيق التحديثات...\n');
    
    // تحديث الفئات القديمة إلى الجديدة
    const categoryMappings = [
      { old: 'confirmation', new: 'UTILITY' },
      { old: 'reminder', new: 'UTILITY' },
      { old: 'thank_you', new: 'MARKETING' },
      { old: 'follow_up', new: 'MARKETING' },
      { old: 'cancellation', new: 'UTILITY' },
      { old: 'custom', new: 'UTILITY' },
    ];
    
    let totalUpdated = 0;
    
    for (const mapping of categoryMappings) {
      const [result] = await connection.execute(
        `UPDATE whatsapp_templates SET category = ? WHERE category = ?`,
        [mapping.new, mapping.old]
      );
      
      if (result.affectedRows > 0) {
        console.log(`  ✅ "${mapping.old}" → "${mapping.new}": ${result.affectedRows} سجل`);
        totalUpdated += result.affectedRows;
      }
    }
    
    if (totalUpdated === 0) {
      console.log('  ℹ️ لا توجد سجلات تحتاج تحديث');
    } else {
      console.log(`\n✅ تم تحديث ${totalUpdated} سجل بنجاح`);
    }
    
    // التحقق من النتيجة
    const [updatedData] = await connection.execute(
      'SELECT category, COUNT(*) as count FROM whatsapp_templates GROUP BY category'
    );
    console.log('\n📊 الفئات بعد التحديث:');
    updatedData.forEach(row => {
      console.log(`  ${row.category}: ${row.count} قالب`);
    });
    
    console.log('\n✅ اكتمل التحديث! يمكن الآن تشغيل pnpm db:push');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixTemplateCategories();
