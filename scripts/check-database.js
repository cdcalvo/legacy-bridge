/**
 * Script to check database contents
 * Run with: node scripts/check-database.js
 */

const { Pool } = require('pg');

async function checkDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/legacy_bridge'
  });

  try {
    console.log('🔍 Checking database connection...\n');

    // Check connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully\n');

    // Check tables exist
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    console.log('📋 Tables in database:');
    tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');

    // Count merchants
    const merchantsCount = await pool.query('SELECT COUNT(*) FROM merchants');
    console.log(`👥 Merchants: ${merchantsCount.rows[0].count}`);

    if (parseInt(merchantsCount.rows[0].count) > 0) {
      const merchants = await pool.query('SELECT id, name FROM merchants LIMIT 5');
      console.log('   First 5 merchants:');
      merchants.rows.forEach(m => console.log(`   - [${m.id}] ${m.name}`));
    }
    console.log('');

    // Count transactions
    const transactionsCount = await pool.query('SELECT COUNT(*) FROM transactions');
    console.log(`💳 Transactions: ${transactionsCount.rows[0].count}`);

    if (parseInt(transactionsCount.rows[0].count) > 0) {
      const transactions = await pool.query(`
        SELECT
          t.id,
          t.txn_id,
          t.description,
          t.amount,
          t.currency,
          t.category,
          m.name as merchant_name
        FROM transactions t
        LEFT JOIN merchants m ON t.merchant_id = m.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      console.log('   Last 5 transactions:');
      transactions.rows.forEach(t => {
        console.log(`   - [${t.txn_id}] ${t.description} - ${t.currency} ${t.amount} (${t.category || 'Uncategorized'})`);
      });
    }
    console.log('');

    // Category summary
    const categorySummary = await pool.query(`
      SELECT
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM transactions
      GROUP BY category
      ORDER BY count DESC
    `);

    if (categorySummary.rows.length > 0) {
      console.log('📊 Category Summary:');
      categorySummary.rows.forEach(cat => {
        console.log(`   - ${cat.category || 'Uncategorized'}: ${cat.count} transactions, Total: ${cat.total}`);
      });
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running on localhost:5432');
    }
  } finally {
    await pool.end();
  }
}

checkDatabase();
