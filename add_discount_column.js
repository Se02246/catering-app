import { pool } from './server/db.js';

const runMigration = async () => {
    try {
        console.log('Adding discounted_price column to products table...');
        await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS discounted_price DECIMAL(10, 2) DEFAULT NULL;
    `);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
};

runMigration();
