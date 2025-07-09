#!/usr/bin/env node
/**
 * CockroachDB Data Viewer - Better formatted output
 */

const { Client } = require('pg');

async function viewCockroachData() {
  console.log('🪳 CockroachDB Data Viewer\n');

  const client = new Client({
    host: 'localhost',
    port: 26260,
    user: 'orders_user',
    password: '',
    database: 'orders_db',
    ssl: false
  });

  try {
    await client.connect();
    console.log('✅ Connected to CockroachDB');

    // Check tables
    console.log('\n📋 Tables in orders_db:');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check order table structure
    if (tables.rows.some(row => row.table_name === 'order')) {
      console.log('\n🏗️ Order table structure:');
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'order'
        ORDER BY ordinal_position
      `);
      
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

      // Check orders data
      console.log('\n📊 Orders data:');
      const orders = await client.query(`
        SELECT 
          id,
          "userId" as user_id,
          "eventId" as event_id,
          "categoryId" as category_id,
          quantity,
          "unitPrice" as unit_price,
          "totalPrice" as total_price,
          status,
          "eventName" as event_name,
          "categoryName" as category_name,
          notes,
          "createdAt" as created_at
        FROM "order" 
        ORDER BY "createdAt" DESC
        LIMIT 10
      `);

      if (orders.rows.length === 0) {
        console.log('  No orders found');
      } else {
        console.log(`  Found ${orders.rows.length} orders:`);
        console.log('');
        
        orders.rows.forEach((order, index) => {
          console.log(`  Order #${index + 1}:`);
          console.log(`    ID: ${order.id}`);
          console.log(`    User ID: ${order.user_id}`);
          console.log(`    Event ID: ${order.event_id}`);
          console.log(`    Category ID: ${order.category_id}`);
          console.log(`    Quantity: ${order.quantity}`);
          console.log(`    Unit Price: $${order.unit_price}`);
          console.log(`    Total Price: $${order.total_price}`);
          console.log(`    Status: ${order.status}`);
          console.log(`    Event: ${order.event_name}`);
          console.log(`    Category: ${order.category_name}`);
          console.log(`    Notes: ${order.notes || 'None'}`);
          console.log(`    Created: ${order.created_at}`);
          console.log('');
        });

        // Check ID range and type
        const idInfo = await client.query('SELECT MIN(id) as min_id, MAX(id) as max_id, COUNT(*) as total FROM "order"');
        const { min_id, max_id, total } = idInfo.rows[0];
        console.log(`📈 ID Statistics:`);
        console.log(`  Total Orders: ${total}`);
        console.log(`  Smallest ID: ${min_id}`);
        console.log(`  Largest ID: ${max_id}`);
        console.log(`  ID Type: ${typeof max_id} (${max_id.toString().length} digits)`);
      }
    } else {
      console.log('\n❌ Order table not found');
    }

    await client.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await client.end();
    } catch (endError) {
      // Ignore
    }
  }
}

viewCockroachData().catch(console.error);
