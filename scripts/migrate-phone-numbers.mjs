#!/usr/bin/env node

/**
 * Migration script to normalize phone numbers in all tables
 * Converts phone numbers from "+967 777 165 305" format to "967777165305" format
 * 
 * Usage: node scripts/migrate-phone-numbers.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Parse MySQL connection string
function parseConnectionString(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5],
  };
}

/**
 * Normalize phone number to standard format (remove +, spaces, dashes)
 * Example: "+967 777 165 305" -> "967777165305"
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

async function migratePhoneNumbers() {
  let connection;
  
  try {
    const config = parseConnectionString(DATABASE_URL);
    connection = await mysql.createConnection(config);
    
    console.log('✅ Connected to database');
    
    const tables = [
      { name: 'leads', column: 'phone' },
      { name: 'appointments', column: 'phone' },
      { name: 'offerLeads', column: 'phone' },
      { name: 'campRegistrations', column: 'phone' },
      { name: 'whatsappConversations', column: 'phoneNumber' },
    ];
    
    for (const table of tables) {
      console.log(`\n📋 Processing table: ${table.name}`);
      
      try {
        // Get all records
        const [rows] = await connection.query(`SELECT id, ${table.column} FROM ${table.name}`);
        
        if (rows.length === 0) {
          console.log(`   ℹ️  No records found`);
          continue;
        }
        
        console.log(`   📊 Found ${rows.length} records`);
        
        let updatedCount = 0;
        
        // Update each record with normalized phone number
        for (const row of rows) {
          const normalized = normalizePhoneNumber(row[table.column]);
          
          // Only update if the phone number changed
          if (normalized !== row[table.column]) {
            await connection.query(
              `UPDATE ${table.name} SET ${table.column} = ? WHERE id = ?`,
              [normalized, row.id]
            );
            updatedCount++;
          }
        }
        
        console.log(`   ✅ Updated ${updatedCount} records`);
      } catch (error) {
        console.error(`   ❌ Error processing ${table.name}:`, error.message);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
migratePhoneNumbers();
