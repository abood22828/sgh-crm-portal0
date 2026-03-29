#!/usr/bin/env node

/**
 * Migration Script: Update WhatsApp Conversation Names
 * 
 * هذا السكريبت يقوم بتحديث أسماء المحادثات القديمة التي تحمل اسم "عميل جديد" أو null
 * بأسماء العملاء الصحيحة من ملفات العملاء (leads, appointments, offers, camps)
 * 
 * الاستخدام: node scripts/updateConversationNames.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

// Helper function to normalize phone numbers
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  // If it starts with 1 (US code), remove it
  if (cleaned.startsWith('1')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
}

// Parse DATABASE_URL
function parseDatabaseUrl() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  try {
    const url = new URL(dbUrl);
    return {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.substring(1),
      port: url.port || 4000,
      ssl: url.searchParams.get('ssl') ? JSON.parse(url.searchParams.get('ssl')) : true,
    };
  } catch (error) {
    throw new Error(`Failed to parse DATABASE_URL: ${error.message}`);
  }
}

// Create database connection
async function getConnection() {
  try {
    const config = parseDatabaseUrl();
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database,
      port: config.port,
      ssl: config.ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    return connection;
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error.message);
    process.exit(1);
  }
}

// Get customer info from all tables
async function getCustomerInfo(connection, normalizedPhone) {
  try {
    // Search in leads
    const [leads] = await connection.query(
      'SELECT id, fullName, phone, email, status, source, createdAt FROM leads WHERE phone LIKE ? LIMIT 1',
      [`%${normalizedPhone}%`]
    );
    
    if (leads.length > 0) {
      const lead = leads[0];
      return {
        type: 'lead',
        id: lead.id,
        name: lead.fullName,
        phone: lead.phone,
        email: lead.email,
        status: lead.status,
        source: lead.source,
        createdAt: lead.createdAt,
      };
    }

    // Search in appointments
    const [appointments] = await connection.query(
      'SELECT id, fullName, phone, email, status, createdAt FROM appointments WHERE phone LIKE ? LIMIT 1',
      [`%${normalizedPhone}%`]
    );
    
    if (appointments.length > 0) {
      const appointment = appointments[0];
      return {
        type: 'appointment',
        id: appointment.id,
        name: appointment.fullName,
        phone: appointment.phone,
        email: appointment.email,
        status: appointment.status,
        createdAt: appointment.createdAt,
      };
    }

    // Search in offerLeads
    const [offerLeads] = await connection.query(
      'SELECT id, fullName, phone, email, status, createdAt FROM offerLeads WHERE phone LIKE ? LIMIT 1',
      [`%${normalizedPhone}%`]
    );
    
    if (offerLeads.length > 0) {
      const offer = offerLeads[0];
      return {
        type: 'offer',
        id: offer.id,
        name: offer.fullName,
        phone: offer.phone,
        email: offer.email,
        status: offer.status,
        createdAt: offer.createdAt,
      };
    }

    // Search in campRegistrations
    const [campRegistrations] = await connection.query(
      'SELECT id, fullName, phone, email, status, createdAt FROM campRegistrations WHERE phone LIKE ? LIMIT 1',
      [`%${normalizedPhone}%`]
    );
    
    if (campRegistrations.length > 0) {
      const camp = campRegistrations[0];
      return {
        type: 'camp',
        id: camp.id,
        name: camp.fullName,
        phone: camp.phone,
        email: camp.email,
        status: camp.status,
        createdAt: camp.createdAt,
      };
    }

    return null;
  } catch (error) {
    console.error('❌ خطأ في البحث عن معلومات العميل:', error.message);
    return null;
  }
}

// Main migration function
async function migrateConversationNames() {
  const connection = await getConnection();
  
  try {
    console.log('🔄 جاري بدء تحديث أسماء المحادثات...\n');

    // Get all conversations with "عميل جديد" or null names
    const [conversations] = await connection.query(
      `SELECT id, phoneNumber, customerName 
       FROM whatsapp_conversations 
       WHERE customerName IS NULL OR customerName = 'عميل جديد' OR customerName = ''
       ORDER BY createdAt DESC`
    );

    console.log(`📊 وجدت ${conversations.length} محادثة تحتاج تحديث\n`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const conversation of conversations) {
      try {
        const normalizedPhone = normalizePhoneNumber(conversation.phoneNumber);
        
        if (!normalizedPhone) {
          console.log(`⚠️  محادثة #${conversation.id}: رقم هاتف غير صحيح - ${conversation.phoneNumber}`);
          errors++;
          continue;
        }

        const customerInfo = await getCustomerInfo(connection, normalizedPhone);

        if (customerInfo && customerInfo.name) {
          // Update conversation with correct customer name
          await connection.query(
            'UPDATE whatsapp_conversations SET customerName = ?, updatedAt = NOW() WHERE id = ?',
            [customerInfo.name, conversation.id]
          );
          
          console.log(`✅ محادثة #${conversation.id}: تم التحديث من "${conversation.customerName || 'null'}" إلى "${customerInfo.name}" (${customerInfo.type})`);
          updated++;
        } else {
          console.log(`⚠️  محادثة #${conversation.id}: لم يتم العثور على عميل برقم ${conversation.phoneNumber}`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ خطأ في تحديث المحادثة #${conversation.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 ملخص النتائج:');
    console.log('='.repeat(60));
    console.log(`✅ تم تحديث: ${updated} محادثة`);
    console.log(`⚠️  لم يتم العثور على عميل: ${notFound} محادثة`);
    console.log(`❌ أخطاء: ${errors} محادثة`);
    console.log(`📊 الإجمالي: ${conversations.length} محادثة`);
    console.log('='.repeat(60) + '\n');

    if (updated > 0) {
      console.log('🎉 تم إكمال التحديث بنجاح!');
    } else {
      console.log('⚠️  لم يتم تحديث أي محادثات');
    }

  } catch (error) {
    console.error('❌ خطأ في تنفيذ السكريبت:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run the migration
migrateConversationNames().catch(error => {
  console.error('❌ خطأ غير متوقع:', error);
  process.exit(1);
});
