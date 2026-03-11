import { pool } from '../db.js';

async function migrate() {
    console.log('Starting migration: Creating quotes table...');
    const client = await pool.connect();
    try {
        await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
        await client.query(`
            CREATE TABLE IF NOT EXISTS quotes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                items JSONB NOT NULL,
                total_price DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Migration completed: quotes table is ready.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
