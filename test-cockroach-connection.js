#!/usr/bin/env node
/**
 * Test script to verify CockroachDB connectivity
 * Run with: node test-cockroach-connection.js
 */

const { Client } = require('pg');

async function testConnection() {
  console.log('🧪 Testing CockroachDB connection...');
  
  const configs = [
    {
      name: 'Load Balanced (Recommended)',
      config: {
        host: 'localhost',
        port: 26260,
        user: 'orders_user',
        database: 'orders_db',
        ssl: false
      }
    },
    {
      name: 'Direct Node 1',
      config: {
        host: 'localhost',
        port: 26257,
        user: 'orders_user',
        database: 'orders_db',
        ssl: false
      }
    },
    {
      name: 'Direct Node 2',
      config: {
        host: 'localhost',
        port: 26258,
        user: 'orders_user',
        database: 'orders_db',
        ssl: false
      }
    }
  ];

  for (const { name, config } of configs) {
    console.log(`\n🔌 Testing ${name} (${config.host}:${config.port})...`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log(`✅ Connected to ${name}`);
      
      // Test basic query
      const result = await client.query('SELECT version()');
      console.log(`📊 Database version: ${result.rows[0].version.substring(0, 50)}...`);
      
      // Test orders database
      const dbResult = await client.query('SELECT current_database()');
      console.log(`🗄️ Current database: ${dbResult.rows[0].current_database}`);
      
      // Test table creation (if orders table doesn't exist)
      try {
        const tableCheck = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'order'
        `);
        
        if (tableCheck.rows.length > 0) {
          console.log(`📋 Orders table exists`);
          
          // Count orders
          const countResult = await client.query('SELECT COUNT(*) FROM "order"');
          console.log(`📈 Orders count: ${countResult.rows[0].count}`);
        } else {
          console.log(`📋 Orders table does not exist yet (will be created by TypeORM)`);
        }
      } catch (tableError) {
        console.log(`📋 Orders table check skipped: ${tableError.message}`);
      }
      
      await client.end();
      console.log(`✅ ${name} test completed successfully`);
      
    } catch (error) {
      console.error(`❌ ${name} failed: ${error.message}`);
      try {
        await client.end();
      } catch (endError) {
        // Ignore end errors
      }
    }
  }
  
  console.log('\n🏁 Connection tests completed');
  console.log('\n📊 Next steps:');
  console.log('1. Start your orders-service: npm run serve:orders-cockroach');
  console.log('2. Or start all services: npm run start:all-cockroach');
  console.log('3. Check CockroachDB UI: http://localhost:8080');
  console.log('4. Check HAProxy stats: http://localhost:8404/stats');
}

// Run the test
testConnection().catch(console.error);
