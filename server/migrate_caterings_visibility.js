import { pool } from './db.js';

async function migrate() {
    try {
        console.log('Adding is_visible column to caterings table...');
        await pool.query(`
            ALTER TABLE caterings 
            ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;
        `);
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
