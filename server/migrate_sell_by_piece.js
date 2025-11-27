import { pool } from './db.js';

const migrate = async () => {
    try {
        console.log('Migrating products table to include sell by piece fields...');

        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS is_sold_by_piece BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS price_per_piece DECIMAL(10, 2);
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
