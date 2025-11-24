import { pool } from './db.js';

const migrate = async () => {
    try {
        console.log('Starting migration...');

        await pool.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;
        `);

        console.log('Migration completed: Added discount_percentage to caterings table.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
