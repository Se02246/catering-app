import { pool } from './db.js';

const migrate = async () => {
    try {
        console.log('Running migration for allow_multiple...');
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS allow_multiple BOOLEAN DEFAULT FALSE;
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
