import { pool } from './db.js';

const migrate = async () => {
    try {
        console.log('Migrating catering_items table to include override fields...');

        await pool.query(`
            ALTER TABLE catering_items 
            ADD COLUMN IF NOT EXISTS name TEXT,
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS image_url TEXT,
            ADD COLUMN IF NOT EXISTS is_sold_by_piece BOOLEAN,
            ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS price_per_piece DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS is_gluten_free BOOLEAN,
            ADD COLUMN IF NOT EXISTS is_lactose_free BOOLEAN,
            ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
        `);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
