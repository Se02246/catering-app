import { pool } from './db.js';

async function migrate() {
    try {
        console.log('Adding hide_in_menu column to products table...');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS hide_in_menu BOOLEAN DEFAULT FALSE;');
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
