import { pool } from './db.js';
async function migrate() {
    console.log('Starting migration: Adding menu_id to quotes...');
    const client = await pool.connect();
    try {
        await client.query('ALTER TABLE quotes ADD COLUMN menu_id UUID DEFAULT gen_random_uuid() UNIQUE');
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}
migrate();