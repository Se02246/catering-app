import { pool } from '../server/db.js';

async function testQuotes() {
    const res = await pool.query(
        'SELECT id, client_name, total_price, event_date, created_at, updated_at FROM quotes ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 5'
    );
    console.log('Quotes list sample:');
    console.table(res.rows);
    process.exit(0);
}

testQuotes().catch(err => {
    console.error(err);
    process.exit(1);
});
