import { pool } from './db.js';

const migrate = async () => {
    try {
        console.log('Running migration...');
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS pieces_per_kg DECIMAL(10, 2),
            ADD COLUMN IF NOT EXISTS min_order_quantity DECIMAL(10, 2) DEFAULT 1,
            ADD COLUMN IF NOT EXISTS order_increment DECIMAL(10, 2) DEFAULT 1;
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
