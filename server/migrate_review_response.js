import { pool } from './db.js';

async function migrate() {
    try {
        console.log('Adding response column to reviews table...');
        await pool.query(`
            ALTER TABLE reviews 
            ADD COLUMN IF NOT EXISTS response TEXT;
        `);
        console.log('Migration successful: response column added.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
