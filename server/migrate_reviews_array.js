import { pool } from './db.js';

async function migrate() {
    try {
        console.log('Migrating reviews table to support multiple images...');
        await pool.query(`
            ALTER TABLE reviews RENAME COLUMN image_url TO legacy_image_url;
            ALTER TABLE reviews ADD COLUMN images TEXT[] DEFAULT '{}';
        `);
        
        // Move existing single image to the new array column
        await pool.query(`
            UPDATE reviews SET images = ARRAY[legacy_image_url] WHERE legacy_image_url IS NOT NULL;
            ALTER TABLE reviews DROP COLUMN legacy_image_url;
        `);
        
        console.log('Reviews table migrated successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
