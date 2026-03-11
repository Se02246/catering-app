import { pool } from './db.js';

async function migrate() {
    console.log('Starting migration: Adding indices for performance...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Catering items indices (Crucial for the complex JOIN in GET /caterings)
        await client.query('CREATE INDEX IF NOT EXISTS idx_catering_items_catering_id ON catering_items(catering_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_catering_items_product_id ON catering_items(product_id)');

        // Caterings indices
        await client.query('CREATE INDEX IF NOT EXISTS idx_caterings_sort_order ON caterings(sort_order)');

        // Products indices
        await client.query('CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)');

        // Settings indices (if not already handled by UNIQUE)
        await client.query('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)');

        await client.query('COMMIT');
        console.log('Migration completed successfully: Indices added.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
