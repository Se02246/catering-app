import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding notes column to quotes table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS notes TEXT;
        `);
        console.log('Migration completed: notes column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
