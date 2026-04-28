import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding needs_sync column to quotes table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS needs_sync BOOLEAN DEFAULT true;
        `);
        console.log('Migration completed: needs_sync column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
