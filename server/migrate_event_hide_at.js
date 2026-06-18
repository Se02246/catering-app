import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding hide_at column to events table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE events 
            ADD COLUMN IF NOT EXISTS hide_at TIMESTAMP;
        `);
        console.log('Migration completed: hide_at column added to events table.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
