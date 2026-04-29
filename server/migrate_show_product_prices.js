import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding show_product_prices to settings table...');
    const client = await pool.connect();
    try {
        // Insert the setting if it doesn't exist, default to 'true'
        await client.query(`
            INSERT INTO settings (key, value)
            VALUES ('show_product_prices', 'true')
            ON CONFLICT (key) DO NOTHING;
        `);
        console.log('Migration completed: show_product_prices setting initialized.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
