import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function migrate() {
    try {
        console.log('Adding is_visible column to products table...');
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        `);
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
