#!/usr/bin/env node
/**
 * Script to reset CockroachDB schema for string ID compatibility
 */

const { Client } = require('pg');

async function resetCockroachSchema() {
  console.log('🔧 Resetting CockroachDB schema for string ID compatibility...\n');

  const client = new Client({
    host: 'localhost',
    port: 26257,
    user: 'orders_user',
    database: 'orders_db',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to CockroachDB');

    // Drop existing order table if it exists
    console.log('🗑️ Dropping existing order table...');
    await client.query('DROP TABLE IF EXISTS "order" CASCADE;');
    console.log('✅ Order table dropped');

    // Let TypeORM recreate the table with proper schema
    console.log('📋 Table will be recreated by TypeORM when orders-service starts');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Stop your orders-service if it\'s running');
    console.log('2. Start with: npm run serve:orders-cockroach');
    console.log('3. The table will be recreated with proper CockroachDB compatibility');

  } catch (error) {
    console.error('❌ Error resetting schema:', error.message);
  } finally {
    await client.end();
  }
}

resetCockroachSchema().catch(console.error);
