import { pool } from './db.js';

const migrate = async () => {
    try {
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS show_servings BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS servings_per_unit DECIMAL(10, 2);
        `);
        console.log('Migration successful: Added show_servings and servings_per_unit to products table.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
