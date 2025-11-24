import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const migrate = async () => {
    try {
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS max_order_quantity DECIMAL(10, 2);
        `);
        console.log('Migration successful: Added max_order_quantity column');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
