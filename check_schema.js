import { pool } from './server/db.js';

async function checkSchema() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'products';
        `);
        const columns = result.rows.map(row => row.column_name);
        console.log('Columns:', columns.join(', '));
        console.log('Has discounted_price:', columns.includes('discounted_price'));
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
