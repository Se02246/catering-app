import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding created_at and updated_at to quotes...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE quotes 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        `);
        console.log('Migration completed: created_at and updated_at columns added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
