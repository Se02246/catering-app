import { pool } from './db.js';

async function migrate() {
    try {
        console.log('Adding menu_description column to products table...');
        await pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS menu_description TEXT;');
        console.log('Migration successful.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
