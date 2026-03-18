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
        console.log('Adding columns to products and caterings tables...');
        
        // Products
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS hide_at TIMESTAMP;
        `);
        
        // Caterings
        await pool.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS hide_at TIMESTAMP;
        `);
        
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
