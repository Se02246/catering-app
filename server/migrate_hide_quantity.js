import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding hide_quantity to products table...');
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS hide_quantity BOOLEAN DEFAULT FALSE
        `);
        console.log('Migration completed: hide_quantity column added.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
