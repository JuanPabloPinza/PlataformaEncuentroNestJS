#!/usr/bin/env node
/**
 * Debug script to check which database the orders-service is actually connecting to
 */

const { Client } = require('pg');

async function debugDatabaseConnection() {
  console.log('🔍 Debugging database connection for orders-service...\n');

  // Test different connection scenarios
  const connections = [
    {
      name: 'Current Default (PostgreSQL)',
      config: {
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: 'password',
        database: 'orders_db',
        ssl: false
      }
    },
    {
      name: 'CockroachDB Load Balanced',
      config: {
        host: 'localhost',
        port: 26260,
        user: 'orders_user',
        password: '',
        database: 'orders_db',
        ssl: false
      }
    },
    {
      name: 'CockroachDB Node 1',
      config: {
        host: 'localhost',
        port: 26257,
        user: 'orders_user',
        password: '',
        database: 'orders_db',
        ssl: false
      }
    }
  ];

  for (const { name, config } of connections) {
    console.log(`\n🔌 Testing: ${name}`);
    console.log(`   ${config.host}:${config.port} -> ${config.database}`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ Connection successful`);
      
      // Check if it's CockroachDB or PostgreSQL
      const versionResult = await client.query('SELECT version()');
      const version = versionResult.rows[0].version;
      
      if (version.includes('CockroachDB')) {
        console.log(`🪳 Database: CockroachDB`);
      } else {
        console.log(`🐘 Database: PostgreSQL`);
      }
      
      console.log(`📊 Version: ${version.substring(0, 80)}...`);
      
      // Check for orders table
      try {
        const tableCheck = await client.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'order'
        `);
        
        if (tableCheck.rows[0].count > 0) {
          console.log(`📋 Orders table: EXISTS`);
          
          // Count orders
          const orderCount = await client.query('SELECT COUNT(*) as count FROM "order"');
          console.log(`📈 Orders count: ${orderCount.rows[0].count}`);
          
          // Show sample order if exists
          if (orderCount.rows[0].count > 0) {
            const sampleOrder = await client.query('SELECT id, user_id, event_id, status, created_at FROM "order" LIMIT 1');
            console.log(`📄 Sample order:`, sampleOrder.rows[0]);
          }
        } else {
          console.log(`📋 Orders table: NOT FOUND`);
        }
      } catch (tableError) {
        console.log(`📋 Orders table check failed: ${tableError.message}`);
      }
      
      await client.end();
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }

  console.log('\n🔧 Environment Variables Check:');
  console.log(`DB_TYPE: ${process.env.DB_TYPE || 'NOT SET'}`);
  console.log(`DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
  console.log(`DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
  console.log(`DB_USERNAME: ${process.env.DB_USERNAME || 'NOT SET'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);

  console.log('\n💡 Solutions:');
  console.log('1. If PostgreSQL has data but CockroachDB is empty:');
  console.log('   - Your orders-service is still connecting to PostgreSQL');
  console.log('   - Stop orders-service and restart with: npm run serve:orders-cockroach');
  console.log('');
  console.log('2. To migrate existing data from PostgreSQL to CockroachDB:');
  console.log('   - Export: pg_dump -h 127.0.0.1 -U postgres orders_db > orders_backup.sql');
  console.log('   - Import: docker exec -i cockroach-node1 cockroach sql --insecure --database=orders_db < orders_backup.sql');
  console.log('');
  console.log('3. To start fresh with CockroachDB:');
  console.log('   - Stop all services');
  console.log('   - Run: npm run start:all-cockroach');
}

debugDatabaseConnection().catch(console.error);
