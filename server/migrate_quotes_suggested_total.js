import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding suggested_total to quotes table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS suggested_total DECIMAL(10, 2)
        `);
        console.log('Migration completed: suggested_total column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
